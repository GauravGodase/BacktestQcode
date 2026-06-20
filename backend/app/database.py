import os
from pathlib import Path

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import declarative_base, sessionmaker

_default_sqlite = f"sqlite:///{Path(__file__).resolve().parent.parent / 'qcode_backtest.db'}"
DATABASE_URL = os.getenv("DATABASE_URL", _default_sqlite)

_connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    _connect_args = {"check_same_thread": False, "timeout": 60}

engine = create_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args=_connect_args,
    pool_pre_ping=True,
)

if DATABASE_URL.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA busy_timeout=60000")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db():
    from . import models

    Base.metadata.create_all(bind=engine)
    _repair_fundamental_report_dates()


def _repair_fundamental_report_dates():
    if not DATABASE_URL.startswith("sqlite"):
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                UPDATE fundamentals
                SET report_date = (
                    SELECT MAX(p.date)
                    FROM prices p
                    WHERE p.ticker = fundamentals.ticker
                )
                WHERE EXISTS (
                    SELECT 1 FROM prices p WHERE p.ticker = fundamentals.ticker
                )
                """
            )
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
