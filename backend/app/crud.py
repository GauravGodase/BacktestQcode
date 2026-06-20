import pandas as pd
from sqlalchemy.orm import Session

from . import models

PRICE_BATCH_SIZE = 5000


def get_stock_by_ticker(db: Session, ticker: str):
    return db.query(models.Stock).filter(models.Stock.ticker == ticker).first()


def upsert_stocks_batch(db: Session, tickers: list):
    existing = {
        row.ticker: row
        for row in db.query(models.Stock).filter(models.Stock.ticker.in_(tickers)).all()
    }
    for ticker in tickers:
        payload = {
            "ticker": ticker,
            "name": ticker.replace(".NS", ""),
            "market_cap": None,
            "last_price": None,
        }
        if ticker in existing:
            for key, value in payload.items():
                setattr(existing[ticker], key, value)
        else:
            db.add(models.Stock(**payload))
    db.commit()


def create_stock(db: Session, stock_data: dict):
    stock = get_stock_by_ticker(db, stock_data["ticker"])
    if stock:
        for key, value in stock_data.items():
            setattr(stock, key, value)
        db.add(stock)
        db.commit()
        db.refresh(stock)
        return stock

    stock = models.Stock(**stock_data)
    db.add(stock)
    db.commit()
    db.refresh(stock)
    return stock


def clear_market_data(db: Session):
    db.query(models.Price).delete(synchronize_session=False)
    db.query(models.Fundamental).delete(synchronize_session=False)
    db.commit()


def create_price_batch(db: Session, prices: pd.DataFrame):
    records = []
    for _, row in prices.iterrows():
        if pd.isna(row["close"]):
            continue
        records.append(
            models.Price(
                ticker=row["ticker"],
                date=row["date"],
                open=row["open"],
                high=row["high"],
                low=row["low"],
                close=row["close"],
                adjusted_close=row["adjusted_close"],
                volume=row["volume"],
            )
        )
        if len(records) >= PRICE_BATCH_SIZE:
            db.bulk_save_objects(records)
            db.commit()
            records = []

    if records:
        db.bulk_save_objects(records)
        db.commit()


def create_fundamental_batch(db: Session, fundamentals: pd.DataFrame):
    records = []
    for _, row in fundamentals.iterrows():
        records.append(
            models.Fundamental(
                ticker=row["ticker"],
                report_date=row["report_date"],
                market_cap=row.get("market_cap"),
                roce=row.get("roce"),
                pat=row.get("pat"),
                pe_ratio=row.get("pe_ratio"),
                pb_ratio=row.get("pb_ratio"),
                revenue=row.get("revenue"),
                net_profit=row.get("net_profit"),
                roe=row.get("roe"),
            )
        )
    if records:
        db.bulk_save_objects(records)
        db.commit()


def load_price_history(db: Session, tickers: list, start_date, end_date):
    query = db.query(models.Price).filter(models.Price.ticker.in_(tickers))
    if start_date:
        query = query.filter(models.Price.date >= start_date)
    if end_date:
        query = query.filter(models.Price.date <= end_date)
    rows = query.order_by(models.Price.ticker, models.Price.date).all()
    return pd.DataFrame(
        [
            {
                "ticker": row.ticker,
                "date": row.date,
                "open": row.open,
                "high": row.high,
                "low": row.low,
                "close": row.close,
                "adjusted_close": row.adjusted_close,
                "volume": row.volume,
            }
            for row in rows
        ]
    )


def load_latest_fundamentals(db: Session, tickers: list, as_of_date):
    rows = (
        db.query(models.Fundamental)
        .filter(models.Fundamental.ticker.in_(tickers))
        .order_by(models.Fundamental.ticker, models.Fundamental.report_date.desc())
        .all()
    )
    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(
        [
            {
                "ticker": row.ticker,
                "report_date": row.report_date,
                "market_cap": row.market_cap,
                "roce": row.roce,
                "pat": row.pat,
                "pe_ratio": row.pe_ratio,
                "pb_ratio": row.pb_ratio,
                "revenue": row.revenue,
                "net_profit": row.net_profit,
                "roe": row.roe,
            }
            for row in rows
        ]
    )

    as_of = pd.to_datetime(as_of_date).date() if as_of_date else None
    if as_of is not None:
        eligible = df[df["report_date"] <= as_of]
        if not eligible.empty:
            return eligible.sort_values("report_date", ascending=False).drop_duplicates("ticker", keep="first")

    # Yahoo Finance only provides a current snapshot; use latest stored row per ticker.
    return df.sort_values("report_date", ascending=False).drop_duplicates("ticker", keep="first")


def get_data_stats(db: Session):
    return {
        "stocks": db.query(models.Stock).count(),
        "price_rows": db.query(models.Price).count(),
        "fundamental_rows": db.query(models.Fundamental).count(),
        "tickers": [row.ticker for row in db.query(models.Stock.ticker).order_by(models.Stock.ticker).all()],
    }
