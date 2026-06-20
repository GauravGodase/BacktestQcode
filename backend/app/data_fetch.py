import logging
import time
from datetime import datetime

import pandas as pd
import yfinance as yf
from sqlalchemy.orm import Session

from .crud import clear_market_data, create_fundamental_batch, create_price_batch, upsert_stocks_batch

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MINIMAL_TICKERS = sorted(
    {
        "RELIANCE.NS",
        "TCS.NS",
        "HDFCBANK.NS",
        "INFY.NS",
        "ICICIBANK.NS",
        "HINDUNILVR.NS",
        "ITC.NS",
        "SBIN.NS",
        "BHARTIARTL.NS",
        "LT.NS",
    }
)

MINIMAL_START_DATE = "2024-01-01"
MINIMAL_END_DATE = "2025-01-01"

DEFAULT_TICKERS = sorted(
    {
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "HINDUNILVR.NS",
        "INFY.NS", "KOTAKBANK.NS", "BHARTIARTL.NS", "ASIANPAINT.NS", "HCLTECH.NS",
        "LT.NS", "AXISBANK.NS", "ITC.NS", "SBILIFE.NS", "SBIN.NS", "MARUTI.NS",
        "ULTRACEMCO.NS", "BAJFINANCE.NS", "NESTLEIND.NS", "JSWSTEEL.NS", "ONGC.NS",
        "SUNPHARMA.NS", "ADANIPORTS.NS", "TITAN.NS", "WIPRO.NS", "DRREDDY.NS",
        "POWERGRID.NS", "BPCL.NS", "ADANIENT.NS", "IOC.NS", "DIVISLAB.NS", "NTPC.NS",
        "BAJAJFINSV.NS", "BRITANNIA.NS", "TECHM.NS", "CIPLA.NS", "GRASIM.NS",
        "SHREECEM.NS", "TMPV.NS", "TATASTEEL.NS", "HINDALCO.NS", "HAVELLS.NS",
        "COALINDIA.NS", "M&M.NS", "EICHERMOT.NS", "UPL.NS", "PIDILITIND.NS",
        "HEROMOTOCO.NS", "INDUSINDBK.NS", "GAIL.NS", "TATACONSUM.NS", "HINDPETRO.NS",
        "BOSCHLTD.NS", "SRF.NS", "HDFCLIFE.NS", "CONCOR.NS", "LICI.NS", "AMBUJACEM.NS",
        "APOLLOHOSP.NS", "AUROPHARMA.NS", "BERGEPAINT.NS", "CANBK.NS", "DLF.NS",
        "GODREJPROP.NS", "ICICIPRULI.NS", "PIIND.NS", "SBICARD.NS", "CHOLAFIN.NS",
        "DABUR.NS", "GODREJCP.NS", "HINDZINC.NS", "ICICIGI.NS", "INDIGO.NS",
        "JINDALSTEL.NS", "LUPIN.NS", "MARICO.NS", "MOTHERSON.NS", "NAUKRI.NS",
        "OFSS.NS", "PERSISTENT.NS", "POLYCAB.NS", "SIEMENS.NS", "TATAPOWER.NS",
        "TORNTPHARM.NS", "VEDL.NS", "VOLTAS.NS", "ZOMATO.NS", "ADANIGREEN.NS",
        "ADANIPOWER.NS", "ATGL.NS", "BANKBARODA.NS", "BEL.NS", "BHEL.NS", "COLPAL.NS",
        "DMART.NS", "HAL.NS", "HDFCAMC.NS", "IDFCFIRSTB.NS", "IRCTC.NS", "JIOFIN.NS",
        "JSWENERGY.NS", "LTIM.NS", "MRF.NS", "NHPC.NS", "PNB.NS", "RECLTD.NS",
        "SAIL.NS", "TATACOMM.NS", "TRENT.NS", "UNIONBANK.NS", "ABB.NS", "ACC.NS",
        "ALKEM.NS", "APLAPOLLO.NS", "AUBANK.NS", "BANDHANBNK.NS", "BIOCON.NS",
        "CUMMINSIND.NS", "ESCORTS.NS", "FEDERALBNK.NS", "GLENMARK.NS", "HONAUT.NS",
        "IDEA.NS", "INDHOTEL.NS", "INDUSTOWER.NS", "IRB.NS", "JUBLFOOD.NS",
        "MANYAVAR.NS", "MAXHEALTH.NS", "MFSL.NS", "MGL.NS", "MPHASIS.NS", "NMDC.NS",
        "OBEROIRLTY.NS", "PAGEIND.NS", "PETRONET.NS", "PGHH.NS", "PRESTIGE.NS",
        "RAMCOCEM.NS", "SCHAEFFLER.NS", "SHRIRAMFIN.NS", "SONACOMS.NS", "SUPREMEIND.NS",
        "TATACHEM.NS", "TVSMOTOR.NS", "UBL.NS", "WHIRLPOOL.NS", "YESBANK.NS", "ZEEL.NS",
    }
)

PRICE_COLUMNS = ["ticker", "date", "open", "high", "low", "close", "adjusted_close", "volume"]


def _normalize_price_frame(data: pd.DataFrame, ticker: str) -> pd.DataFrame:
    if data is None or data.empty:
        return pd.DataFrame(columns=PRICE_COLUMNS)

    data = data.reset_index()
    data["ticker"] = ticker
    data = data.rename(
        columns={
            "Open": "open",
            "High": "high",
            "Low": "low",
            "Close": "close",
            "Adj Close": "adjusted_close",
            "Volume": "volume",
            "Date": "date",
        }
    )
    available = [column for column in PRICE_COLUMNS if column in data.columns]
    return data[available]


def _fetch_single_prices(ticker, start_date, end_date):
    try:
        history = yf.Ticker(ticker).history(
            start=start_date,
            end=end_date,
            auto_adjust=False,
        )
        return _normalize_price_frame(history, ticker)
    except Exception as exc:
        logger.warning("Single price fetch failed for %s: %s", ticker, exc)
        return pd.DataFrame(columns=PRICE_COLUMNS)


def fetch_prices(tickers, start_date="2018-01-01", end_date=None):
    if end_date is None:
        end_date = datetime.today().strftime("%Y-%m-%d")

    logger.info("Fetching prices for %d tickers", len(tickers))
    batch_size = 40
    frames = []
    fetched = set()

    for i in range(0, len(tickers), batch_size):
        batch = tickers[i : i + batch_size]
        try:
            raw = yf.download(
                batch,
                start=start_date,
                end=end_date,
                progress=False,
                auto_adjust=False,
                threads=False,
                group_by="ticker",
            )
        except Exception as exc:
            logger.warning("Price batch failed: %s", exc)
            raw = pd.DataFrame()

        if not raw.empty:
            multi = len(batch) > 1
            for ticker in batch:
                try:
                    if multi:
                        if hasattr(raw.columns, "levels") and ticker in raw.columns.get_level_values(0):
                            data = raw[ticker].copy()
                        else:
                            continue
                    else:
                        data = raw.copy()
                except Exception:
                    continue

                normalized = _normalize_price_frame(data, ticker)
                if not normalized.empty:
                    frames.append(normalized)
                    fetched.add(ticker)

        time.sleep(0.5)

    missing = [ticker for ticker in tickers if ticker not in fetched]
    if missing:
        logger.info("Retrying %d tickers individually", len(missing))
        for idx, ticker in enumerate(missing):
            normalized = _fetch_single_prices(ticker, start_date, end_date)
            if not normalized.empty:
                frames.append(normalized)
                fetched.add(ticker)
            if idx % 10 == 0:
                logger.info("Individual price fetch %d/%d", idx + 1, len(missing))
            time.sleep(0.2)

    if frames:
        combined = pd.concat(frames, ignore_index=True)
        logger.info("Fetched prices for %d/%d tickers (%d rows)", len(fetched), len(tickers), len(combined))
        return combined

    logger.warning("No price data fetched from Yahoo Finance")
    return pd.DataFrame(columns=PRICE_COLUMNS)


def _fetch_single_fundamental(ticker, retries=3):
    for attempt in range(retries):
        try:
            info = yf.Ticker(ticker).info or {}
            if info.get("marketCap") or info.get("trailingPE") or info.get("returnOnEquity"):
                return info
        except Exception:
            pass
        time.sleep(1.0 * (attempt + 1))
    return {}


def fetch_fundamentals(tickers, price_df=None, report_date=None):
    rows = []
    price_lookup = {}
    latest_price_dates = {}

    if price_df is not None and not price_df.empty:
        latest = price_df.sort_values("date").groupby("ticker").last()
        price_lookup = latest["close"].to_dict()
        latest_price_dates = latest["date"].to_dict()

    if report_date is None:
        if not price_df.empty:
            report_date = pd.to_datetime(price_df["date"]).max().date()
        else:
            report_date = datetime.today().date()

    for idx, ticker in enumerate(tickers):
        if idx % 10 == 0:
            logger.info("Fetching fundamentals %d/%d", idx + 1, len(tickers))
        info = _fetch_single_fundamental(ticker)
        time.sleep(0.1 if len(tickers) <= 15 else 0.25)

        roe = info.get("returnOnEquity")
        market_cap_cr = (info.get("marketCap") or 0) / 1e7
        pat = info.get("trailingEps") or info.get("netIncomeToCommon")

        if not market_cap_cr and ticker in price_lookup:
            market_cap_cr = float(price_lookup[ticker])

        if not info:
            market_cap_cr = market_cap_cr or 5000.0
            roe = roe if roe is not None else 0.12
            pat = pat or 10.0

        ticker_report_date = latest_price_dates.get(ticker, report_date)
        if hasattr(ticker_report_date, "date"):
            ticker_report_date = ticker_report_date.date()

        rows.append(
            {
                "ticker": ticker,
                "report_date": ticker_report_date,
                "market_cap": market_cap_cr or 5000.0,
                "roce": roe * 100 if roe is not None else 12.0,
                "pat": pat if pat is not None else 10.0,
                "pe_ratio": info.get("trailingPE") or 20.0,
                "pb_ratio": info.get("priceToBook") or 3.0,
                "revenue": info.get("totalRevenue"),
                "net_profit": info.get("netIncomeToCommon"),
                "roe": roe * 100 if roe is not None else 12.0,
            }
        )
    return pd.DataFrame(rows)


def load_sample_data(db: Session, tickers=None, start_date="2018-01-01", end_date=None):
    if tickers is None:
        tickers = DEFAULT_TICKERS

    upsert_stocks_batch(db, tickers)
    clear_market_data(db)

    price_df = fetch_prices(tickers, start_date=start_date, end_date=end_date)
    if price_df.empty:
        raise RuntimeError("Yahoo Finance returned no price data. Check your network connection and try again.")

    price_df["date"] = pd.to_datetime(price_df["date"]).dt.date
    create_price_batch(db, price_df)

    tickers_with_prices = sorted(price_df["ticker"].unique().tolist())
    report_date = pd.to_datetime(price_df["date"]).max().date()
    fundamental_df = fetch_fundamentals(
        tickers_with_prices,
        price_df=price_df,
        report_date=report_date,
    )
    if not fundamental_df.empty:
        create_fundamental_batch(db, fundamental_df)

    return {
        "prices": len(price_df),
        "fundamentals": len(fundamental_df),
        "tickers": len(tickers_with_prices),
        "tickers_requested": len(tickers),
        "start_date": start_date,
        "end_date": end_date or datetime.today().strftime("%Y-%m-%d"),
    }


def load_minimal_data(db: Session):
    return load_sample_data(
        db=db,
        tickers=MINIMAL_TICKERS,
        start_date=MINIMAL_START_DATE,
        end_date=MINIMAL_END_DATE,
    )
