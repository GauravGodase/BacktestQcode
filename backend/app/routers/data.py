from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..data_fetch import DEFAULT_TICKERS
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..schemas import DataLoadParams
from ..services.data_service import build_status_payload, get_load_state, start_load_job

router = APIRouter(prefix="/api/data", tags=["data"], dependencies=[Depends(get_current_user)])


@router.get("/status")
def data_status(db: Session = Depends(get_db)):
    return build_status_payload(db)


@router.post("/load")
def load_data(params: DataLoadParams = DataLoadParams(), db: Session = Depends(get_db)):
    del db
    try:
        start_load_job(params)
    except RuntimeError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

    state = get_load_state()
    return {
        "detail": "Data load started",
        "mode": params.mode,
        "loading": state.running,
        "progress": state.progress,
    }
