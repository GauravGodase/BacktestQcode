from typing import Dict, List

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from .crud import load_latest_fundamentals, load_price_history
from .data_fetch import DEFAULT_TICKERS
from .schemas import BacktestParams, BacktestResult, EquityPoint, PerformanceMetrics

FREQUENCY_MAP = {
    "monthly": "ME",
    "quarterly": "QE",
    "yearly": "YE",
}


def _build_rebalance_dates(prices: pd.DataFrame, frequency: str, start_date, end_date):
    dates = pd.DatetimeIndex(pd.to_datetime(prices["date"].drop_duplicates()).sort_values())
    freq = FREQUENCY_MAP.get(frequency, "QE")
    rebalance = dates.to_series().resample(freq).last().dropna()
    rebalance = rebalance[(rebalance.dt.date >= start_date) & (rebalance.dt.date <= end_date)]
    if rebalance.empty:
        rebalance = pd.Series([pd.Timestamp(start_date)])
    return [d.date() for d in rebalance]


def _apply_filters(df: pd.DataFrame, filters):
    if df.empty:
        return df
    if filters.min_market_cap is not None:
        df = df[df["market_cap"].fillna(0) >= filters.min_market_cap]
    if filters.max_market_cap is not None:
        df = df[df["market_cap"].fillna(float("inf")) <= filters.max_market_cap]
    if filters.min_roce is not None:
        df = df[df["roce"].fillna(-999) >= filters.min_roce]
    if filters.require_pat_positive:
        df = df[df["pat"].fillna(-1) > 0]
    return df


def _rank_universe(df: pd.DataFrame, ranking_rules):
    if df.empty:
        return df
    score_df = pd.DataFrame({"ticker": df["ticker"].unique(), "score": 0.0})
    for rule in ranking_rules:
        ascending = rule.direction == "asc"
        metric = rule.metric
        if metric not in df.columns:
            continue
        ranking = df[["ticker", metric]].drop_duplicates("ticker")
        ranking["rank"] = ranking[metric].rank(method="average", ascending=ascending, na_option="bottom")
        score_df = score_df.merge(ranking[["ticker", "rank"]], on="ticker", how="left")
        score_df["score"] = score_df["score"] + score_df["rank"].fillna(ranking["rank"].max() + 1)
        score_df = score_df.drop(columns=["rank"])
    ranked = df.merge(score_df, on="ticker", how="left")
    return ranked.sort_values("score", ascending=True).drop_duplicates("ticker")


def _position_weights(universe: pd.DataFrame, method: str, metric: str):
    if universe.empty:
        return pd.Series(dtype=float)
    tickers = universe["ticker"].tolist()
    if method == "equal":
        weights = pd.Series(1.0 / len(universe), index=tickers)
    elif method == "market_cap":
        cap = universe.set_index("ticker")["market_cap"].fillna(0).clip(lower=0)
        total = cap.sum()
        weights = cap / total if total > 0 else pd.Series(1.0 / len(universe), index=tickers)
    else:
        values = universe.set_index("ticker")[metric].fillna(0).clip(lower=0)
        total = values.sum()
        weights = values / total if total > 0 else pd.Series(1.0 / len(universe), index=tickers)
    return weights / weights.sum()


def _price_matrix(prices: pd.DataFrame):
    pivot = prices.pivot_table(index="date", columns="ticker", values="close", aggfunc="last")
    pivot.index = pd.to_datetime(pivot.index)
    return pivot.sort_index().ffill()


def _compute_metrics(equity: pd.Series):
    equity = equity.dropna().sort_index()
    returns = equity.pct_change().dropna()
    total_return = equity.iloc[-1] / equity.iloc[0] - 1.0 if len(equity) > 1 else 0.0
    years = max((equity.index[-1] - equity.index[0]).days / 365.25, 1 / 365.25)
    cagr = (equity.iloc[-1] / equity.iloc[0]) ** (1 / years) - 1 if len(equity) > 1 else 0.0
    volatility = returns.std() * np.sqrt(252) if not returns.empty else 0.0
    sharpe = returns.mean() / returns.std() * np.sqrt(252) if returns.std() and returns.std() > 0 else 0.0
    drawdown = equity / equity.cummax() - 1
    max_dd = float(drawdown.min()) if not drawdown.empty else 0.0
    return (
        PerformanceMetrics(
            cagr=float(cagr),
            annual_volatility=float(volatility),
            sharpe_ratio=float(sharpe),
            max_drawdown=float(max_dd),
            total_return=float(total_return),
        ),
        drawdown,
    )


def run_backtest(db: Session, params: BacktestParams) -> BacktestResult:
    tickers = params.tickers or DEFAULT_TICKERS
    prices = load_price_history(db, tickers, params.start_date, params.end_date)
    if prices.empty:
        raise ValueError("No price history found. Load data first via POST /api/data/load.")

    fundamentals = load_latest_fundamentals(db, tickers, params.start_date)
    if fundamentals.empty:
        raise ValueError("No fundamental data available. Load data first via POST /api/data/load.")

    prices["date"] = pd.to_datetime(prices["date"])
    price_matrix = _price_matrix(prices)
    rebalance_dates = _build_rebalance_dates(prices, params.rebalance_frequency, params.start_date, params.end_date)

    filtered_universe = _apply_filters(fundamentals.copy(), params.filters)
    if filtered_universe.empty:
        raise ValueError("No stocks passed the filter criteria.")

    ranked_universe = _rank_universe(filtered_universe, params.ranking_rules)
    eligible_tickers = set(ranked_universe["ticker"])

    shares: Dict[str, float] = {}
    portfolio_value = params.initial_capital
    portfolio_log: List[dict] = []
    ticker_period_returns: Dict[str, List[float]] = {}

    trading_dates = price_matrix.index[
        (price_matrix.index.date >= params.start_date) & (price_matrix.index.date <= params.end_date)
    ]

    rebalance_set = set(rebalance_dates)
    equity_points: List[tuple] = []

    for current_date in trading_dates:
        date_key = current_date.date()

        if date_key in rebalance_set or not shares:
            as_of_prices = price_matrix.loc[:current_date].iloc[-1]
            universe = ranked_universe[ranked_universe["ticker"].isin(eligible_tickers)].head(params.portfolio_size)
            weights = _position_weights(universe, params.weighting_method, params.metric_for_weighting or "roce")

            if shares:
                portfolio_value = sum(shares[t] * as_of_prices.get(t, np.nan) for t in shares if t in as_of_prices and pd.notna(as_of_prices[t]))
                if not portfolio_value or np.isnan(portfolio_value):
                    portfolio_value = params.initial_capital

            old_shares = shares.copy()
            shares = {}
            holdings = {}
            for ticker, weight in weights.items():
                price = as_of_prices.get(ticker)
                if price is None or pd.isna(price) or price <= 0:
                    continue
                allocation = portfolio_value * weight
                share_count = allocation / price
                shares[ticker] = share_count
                holdings[ticker] = {
                    "weight": float(weight),
                    "allocation": float(allocation),
                    "price": float(price),
                    "shares": float(share_count),
                }
                if old_shares and ticker in old_shares:
                    old_price = price_matrix.loc[:current_date, ticker].dropna()
                    if len(old_price) > 1:
                        prev = old_price.iloc[-2]
                        if prev > 0:
                            ticker_period_returns.setdefault(ticker, []).append(float(price / prev - 1))

            if holdings:
                portfolio_log.append(
                    {
                        "date": date_key.isoformat(),
                        "holdings": holdings,
                        "portfolio_size": len(holdings),
                        "portfolio_value": float(portfolio_value),
                    }
                )

        day_prices = price_matrix.loc[current_date]
        valid = {t: day_prices[t] for t in shares if t in day_prices.index and pd.notna(day_prices[t])}
        if valid:
            portfolio_value = sum(shares[t] * valid[t] for t in valid)
            equity_points.append((current_date, portfolio_value))

    if not equity_points:
        raise ValueError("Backtest did not generate any equity points.")

    equity = pd.Series({d: v for d, v in equity_points}).sort_index()
    performance, drawdown = _compute_metrics(equity)

    holding_returns = []
    for ticker, rets in ticker_period_returns.items():
        if rets:
            cumulative = float(np.prod([1 + r for r in rets]) - 1)
            holding_returns.append({"ticker": ticker, "return": cumulative, "periods": len(rets)})

    if not holding_returns and portfolio_log:
        last = portfolio_log[-1]["holdings"]
        start_prices = price_matrix.iloc[0]
        end_prices = price_matrix.iloc[-1]
        for ticker in last:
            if ticker in start_prices.index and ticker in end_prices.index:
                sp, ep = start_prices[ticker], end_prices[ticker]
                if pd.notna(sp) and pd.notna(ep) and sp > 0:
                    holding_returns.append({"ticker": ticker, "return": float(ep / sp - 1), "periods": 1})

    holding_returns.sort(key=lambda x: x["return"], reverse=True)
    winners = holding_returns[:5]
    losers = sorted(holding_returns, key=lambda x: x["return"])[:5]

    return BacktestResult(
        equity_curve=[EquityPoint(date=idx.date(), value=float(val)) for idx, val in equity.items()],
        drawdown_curve=[EquityPoint(date=idx.date(), value=float(val)) for idx, val in drawdown.items()],
        performance=performance,
        top_winners=winners,
        top_losers=losers,
        portfolio_log=portfolio_log,
    )
