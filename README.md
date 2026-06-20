# Qcode Backtesting Platform

A full-stack equity strategy backtesting application for Indian equities.

**Stack:** FastAPI · SQLAlchemy · PostgreSQL/SQLite · pandas · yfinance · React · Vite · Tailwind CSS · Recharts

## Features

- **Backtest Engine:** User-defined date range, rebalancing (monthly/quarterly/yearly), portfolio size, equal/market-cap/metric weighting, composite ranking, filter-once logic, compounding between rebalances, no future data leakage
- **Data Collection:** 130+ NSE tickers via Yahoo Finance (OHLCV + fundamentals)
- **Database:** Normalized tables for stocks, prices, and fundamentals with indexes
- **Frontend:** Strategy config UI, equity curve, drawdown chart, performance metrics, winners/losers, portfolio logs, CSV/Excel export
- **Presets:** Quality Growth, Value Screen, Large Cap Momentum strategies

## Architecture

```
Qcode/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI routes
│   │   ├── backtest.py      # Backtest engine
│   │   ├── data_fetch.py    # Yahoo Finance ingestion
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── crud.py          # Database operations
│   │   ├── schemas.py       # Pydantic models + export helpers
│   │   └── database.py      # DB connection (SQLite default, PostgreSQL via Docker)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── BacktestForm.jsx
│           ├── ResultsPanel.jsx
│           └── DataPanel.jsx
└── docker-compose.yml       # PostgreSQL + backend
```

## Quick Start (Local — SQLite)

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

### 3. Load Data & Run

1. Click **Load Sample Data** (fetches ~130 Indian stocks from Yahoo Finance — takes 2–5 min)
2. Configure strategy parameters or pick a preset
3. Click **Run Backtest**
4. View charts, metrics, portfolio log; export CSV or Excel

## Docker (PostgreSQL)

```bash
docker compose up --build
```

Set `DATABASE_URL=postgresql+psycopg2://postgres:postgres@db:5432/qcode_backtest` (default in docker-compose).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/data/status` | Database row counts |
| POST | `/api/data/load` | Fetch & store Yahoo Finance data |
| GET | `/api/stocks` | List available tickers |
| POST | `/api/backtest/run` | Run backtest, return JSON results |
| POST | `/api/backtest/export/csv` | Export equity curve as CSV |
| POST | `/api/backtest/export/excel` | Export full results as Excel |

## Assumptions

- Market cap stored in ₹ Crores (Yahoo `marketCap / 1e7`)
- Filters applied once at backtest start using fundamentals as-of start date
- ROCE approximated from Yahoo Finance ROE when direct ROCE unavailable
- PAT filter uses trailing EPS / net income proxy
- Rebalancing uses close prices; no transaction costs or slippage modeled

## Module Documentation

| Module | Purpose |
|--------|---------|
| `backtest.py` | Rebalance scheduling, filtering, composite ranking, position sizing, daily mark-to-market, performance metrics |
| `data_fetch.py` | yfinance price & fundamental ingestion for 130+ `.NS` tickers |
| `models.py` | `stocks`, `prices`, `fundamentals`, `backtest_runs` tables |
| `crud.py` | Batch inserts, price history queries, latest fundamentals lookup |
| `schemas.py` | Request/response models, CSV/Excel export via openpyxl |
