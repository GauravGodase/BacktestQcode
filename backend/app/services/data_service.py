import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..crud import get_data_stats
from ..data_fetch import DEFAULT_TICKERS, MINIMAL_END_DATE, MINIMAL_START_DATE, MINIMAL_TICKERS, load_sample_data
from ..database import SessionLocal
from ..schemas import DataLoadParams


@dataclass
class LoadJobState:
    running: bool = False
    mode: str | None = None
    progress: str = "idle"
    started_at: str | None = None
    finished_at: str | None = None
    error: str | None = None
    result: dict | None = None


_state = LoadJobState()
_lock = threading.Lock()


def get_load_state() -> LoadJobState:
    return _state


def _set_state(**kwargs):
    global _state
    with _lock:
        for key, value in kwargs.items():
            setattr(_state, key, value)


def _run_load(params: DataLoadParams):
    db = SessionLocal()
    try:
        _set_state(progress="Fetching Yahoo Finance data…")
        if params.mode == "full":
            start_date = params.start_date.isoformat() if params.start_date else "2018-01-01"
            end_date = params.end_date.isoformat() if params.end_date else None
            result = load_sample_data(db=db, tickers=DEFAULT_TICKERS, start_date=start_date, end_date=end_date)
        else:
            start_date = params.start_date.isoformat() if params.start_date else MINIMAL_START_DATE
            end_date = params.end_date.isoformat() if params.end_date else MINIMAL_END_DATE
            result = load_sample_data(db=db, tickers=MINIMAL_TICKERS, start_date=start_date, end_date=end_date)

        _set_state(
            running=False,
            progress="completed",
            finished_at=datetime.now(timezone.utc).isoformat(),
            result=result,
            error=None,
        )
    except Exception as exc:
        db.rollback()
        _set_state(running=False, progress="failed", error=str(exc), finished_at=datetime.now(timezone.utc).isoformat())
    finally:
        db.close()


def start_load_job(params: DataLoadParams) -> LoadJobState:
    with _lock:
        if _state.running:
            raise RuntimeError("Data load already in progress.")
        _state.running = True
        _state.mode = params.mode
        _state.progress = "starting"
        _state.started_at = datetime.now(timezone.utc).isoformat()
        _state.finished_at = None
        _state.error = None
        _state.result = None

    thread = threading.Thread(target=_run_load, args=(params,), daemon=True)
    thread.start()
    return _state


def build_status_payload(db: Session) -> dict:
    stats = get_data_stats(db)
    stats["loading"] = _state.running
    stats["ready"] = stats["price_rows"] > 0 and stats["fundamental_rows"] > 0
    stats["load_progress"] = _state.progress
    stats["load_mode"] = _state.mode
    stats["load_error"] = _state.error
    stats["load_result"] = _state.result
    return stats
