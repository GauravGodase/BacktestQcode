import hashlib
import json
from typing import Dict

from sqlalchemy.orm import Session

from ..backtest import run_backtest
from ..schemas import BacktestParams, BacktestResult

_result_cache: Dict[str, BacktestResult] = {}


def _cache_key(params: BacktestParams) -> str:
    payload = params.model_dump(mode="json")
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()


def execute_backtest(db: Session, params: BacktestParams, use_cache: bool = True) -> BacktestResult:
    key = _cache_key(params)
    if use_cache and key in _result_cache:
        return _result_cache[key]

    result = run_backtest(db, params)
    _result_cache[key] = result
    return result


def get_cached_backtest(params: BacktestParams) -> BacktestResult | None:
    return _result_cache.get(_cache_key(params))
