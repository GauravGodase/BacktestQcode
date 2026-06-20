import io
from datetime import date
from typing import Dict, List, Literal, Optional

import pandas as pd
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

ALLOWED_METRICS = {"roce", "roe", "pe_ratio", "pb_ratio", "market_cap"}
ALLOWED_DIRECTIONS = {"asc", "desc"}
ALLOWED_FREQUENCIES = {"monthly", "quarterly", "yearly"}
ALLOWED_WEIGHTING = {"equal", "market_cap", "metric"}
ALLOWED_MODES = {"minimal", "full"}


class FilterParams(BaseModel):
    min_market_cap: Optional[float] = Field(0.0, ge=0, description="Min market cap in crore")
    max_market_cap: Optional[float] = Field(999999999.0, gt=0, description="Max market cap in crore")
    min_roce: Optional[float] = Field(0.0, ge=-100, le=100, description="Minimum ROCE")
    require_pat_positive: Optional[bool] = Field(True, description="Require PAT > 0")

    @model_validator(mode="after")
    def validate_market_cap_range(self):
        if self.min_market_cap is not None and self.max_market_cap is not None:
            if self.min_market_cap > self.max_market_cap:
                raise ValueError("min_market_cap cannot exceed max_market_cap")
        return self


class RankingRule(BaseModel):
    metric: str
    direction: Literal["asc", "desc"] = "desc"

    @field_validator("metric")
    @classmethod
    def validate_metric(cls, value: str):
        if value not in ALLOWED_METRICS:
            raise ValueError(f"metric must be one of: {', '.join(sorted(ALLOWED_METRICS))}")
        return value


class BacktestParams(BaseModel):
    start_date: date
    end_date: date
    rebalance_frequency: Literal["monthly", "quarterly", "yearly"] = "quarterly"
    portfolio_size: int = Field(10, ge=1, le=50)
    weighting_method: Literal["equal", "market_cap", "metric"] = "equal"
    metric_for_weighting: Optional[str] = "roce"
    ranking_rules: List[RankingRule] = Field(default_factory=lambda: [RankingRule(metric="roce", direction="desc")])
    filters: FilterParams = Field(default_factory=FilterParams)
    tickers: Optional[List[str]] = None
    initial_capital: float = Field(10000000.0, gt=0)

    @field_validator("ranking_rules")
    @classmethod
    def validate_ranking_rules(cls, value: List[RankingRule]):
        if not value:
            raise ValueError("At least one ranking rule is required")
        return value

    @field_validator("metric_for_weighting")
    @classmethod
    def validate_weight_metric(cls, value: Optional[str]):
        if value is not None and value not in ALLOWED_METRICS:
            raise ValueError(f"metric_for_weighting must be one of: {', '.join(sorted(ALLOWED_METRICS))}")
        return value

    @field_validator("tickers")
    @classmethod
    def validate_tickers(cls, value: Optional[List[str]]):
        if value is not None and not value:
            raise ValueError("tickers list cannot be empty when provided")
        return value

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        if self.weighting_method == "metric" and not self.metric_for_weighting:
            raise ValueError("metric_for_weighting is required when weighting_method is 'metric'")
        return self


class DataLoadParams(BaseModel):
    mode: Literal["minimal", "full"] = "minimal"
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @model_validator(mode="after")
    def validate_custom_range(self):
        if self.start_date and self.end_date and self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=100)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str):
        if not any(char.isdigit() for char in value):
            raise ValueError("password must contain at least one number")
        if not any(char.isalpha() for char in value):
            raise ValueError("password must contain at least one letter")
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserPublic(BaseModel):
    id: int
    email: EmailStr
    full_name: str

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class EquityPoint(BaseModel):
    date: date
    value: float


class PerformanceMetrics(BaseModel):
    cagr: float
    annual_volatility: float
    sharpe_ratio: float
    max_drawdown: float
    total_return: float


class BacktestResult(BaseModel):
    equity_curve: List[EquityPoint]
    drawdown_curve: List[EquityPoint]
    performance: PerformanceMetrics
    top_winners: List[Dict]
    top_losers: List[Dict]
    portfolio_log: List[Dict]


def export_equity_csv(result: BacktestResult) -> StreamingResponse:
    df = pd.DataFrame([{"date": p.date, "portfolio_value": p.value} for p in result.equity_curve])
    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=equity_curve.csv"},
    )


def export_full_excel(result: BacktestResult) -> StreamingResponse:
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        pd.DataFrame([{"date": p.date, "portfolio_value": p.value} for p in result.equity_curve]).to_excel(
            writer, sheet_name="Equity Curve", index=False
        )
        pd.DataFrame([{"date": p.date, "drawdown": p.value} for p in result.drawdown_curve]).to_excel(
            writer, sheet_name="Drawdown", index=False
        )
        pd.DataFrame([result.performance.model_dump()]).to_excel(writer, sheet_name="Performance", index=False)
        log_rows = []
        for entry in result.portfolio_log:
            for ticker, data in entry.get("holdings", {}).items():
                log_rows.append({"date": entry["date"], "ticker": ticker, **data})
        if log_rows:
            pd.DataFrame(log_rows).to_excel(writer, sheet_name="Portfolio Log", index=False)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=backtest_results.xlsx"},
    )
