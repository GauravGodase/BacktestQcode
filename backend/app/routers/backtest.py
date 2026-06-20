from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..data_fetch import DEFAULT_TICKERS
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..schemas import BacktestParams, export_equity_csv, export_full_excel
from ..services.backtest_service import execute_backtest, get_cached_backtest
from ..services.data_service import get_load_state

router = APIRouter(prefix="/api/backtest", tags=["backtest"], dependencies=[Depends(get_current_user)])


def _ensure_not_loading():
    if get_load_state().running:
        raise HTTPException(
            status_code=409,
            detail="Market data is currently loading. Wait for it to finish before running a backtest.",
        )


@router.post("/run")
def backtest(params: BacktestParams, db: Session = Depends(get_db)):
    _ensure_not_loading()
    try:
        return execute_backtest(db, params)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/export/csv")
def export_csv(params: BacktestParams, db: Session = Depends(get_db)):
    _ensure_not_loading()
    try:
        result = get_cached_backtest(params) or execute_backtest(db, params)
        return export_equity_csv(result)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.post("/export/excel")
def export_excel(params: BacktestParams, db: Session = Depends(get_db)):
    _ensure_not_loading()
    try:
        result = get_cached_backtest(params) or execute_backtest(db, params)
        return export_full_excel(result)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
