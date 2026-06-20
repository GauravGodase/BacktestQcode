from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .config import get_settings
from .crud import get_data_stats
from .data_fetch import DEFAULT_TICKERS
from .database import SessionLocal, get_db, init_db
from .dependencies import get_current_user
from .models import User
from .routers import auth, backtest, data
from .services.auth_service import ensure_demo_user

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        ensure_demo_user(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.app_name, version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(data.router)
app.include_router(backtest.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/stocks")
def list_stocks(db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    stats = get_data_stats(db)
    tickers = stats["tickers"] or DEFAULT_TICKERS
    return {"tickers": tickers, "count": len(tickers)}
