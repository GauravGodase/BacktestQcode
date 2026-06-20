import { useState } from 'react'
import { startDataLoad } from '../api/data'
import { formatApiError } from '../api/client'
import { ButtonSpinner } from './ui/Spinner'
import { DatabaseIcon } from './ui/Icons'

export default function DataPanel({ dataStatus, onLoaded, onGoToStrategy }) {
  const [loadingMode, setLoadingMode] = useState(null)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const dataReady = dataStatus?.ready ?? (dataStatus?.price_rows > 0 && dataStatus?.fundamental_rows > 0)
  const serverLoading = dataStatus?.loading

  const handleLoad = async (mode) => {
    if (serverLoading || loadingMode) return
    setLoadingMode(mode)
    setError(null)
    setMessage(null)
    try {
      await startDataLoad(mode)
      setMessage(
        mode === 'minimal'
          ? 'Data loaded successfully! Refresh the page to see the updated metrics.'
          : 'Data loaded successfully! Refresh the page to see the updated metrics.',
      )
      onLoaded()
      // Clear the success message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoadingMode(null)
    }
  }

  return (
    <div className="animate-fade-in min-w-0 space-y-4 sm:space-y-6">
      <div className="glass-panel overflow-hidden">
        <div className="border-b border-white/[0.06] bg-gradient-to-r from-brand-500/[0.08] to-transparent px-[var(--page-gutter)] py-4 sm:py-5">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${dataReady ? 'bg-brand-500/15 text-brand-400' : 'bg-amber-500/15 text-amber-400'}`}>
                <DatabaseIcon />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="section-title">Yahoo Finance Data</h2>
                  <StatusPill ready={dataReady} loading={serverLoading} />
                </div>
                <div className="space-y-1">
                  <p className="break-anywhere text-fluid-sm text-slate-400">
                    {dataReady
                      ? `Ready — ${dataStatus.stocks} stocks · ${dataStatus.price_rows.toLocaleString('en-IN')} price rows · ${dataStatus.fundamental_rows} fundamentals.`
                      : 'New here? Click Quick Load (2024) to fetch a small sample dataset in under a minute.'}
                  </p>
                  {dataStatus?.load_result?.start_date && (
                    <p className="text-xs text-slate-500">
                      {dataStatus?.load_mode === 'full' ? 'Full dataset' : 'Quick sample'} loaded from {dataStatus.load_result.start_date} to {dataStatus.load_result.end_date}.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button onClick={() => handleLoad('minimal')} disabled={serverLoading || loadingMode} className="btn-primary w-full px-5 sm:w-auto">
                {loadingMode === 'minimal' || (serverLoading && dataStatus?.load_mode === 'minimal') ? (
                  <>
                    <ButtonSpinner />
                    Loading 2024…
                  </>
                ) : (
                  'Quick Load (2024)'
                )}
              </button>
              <button onClick={() => handleLoad('full')} disabled={serverLoading || loadingMode} className="btn-secondary w-full px-5 sm:w-auto">
                {loadingMode === 'full' || (serverLoading && dataStatus?.load_mode === 'full') ? (
                  <>
                    <ButtonSpinner />
                    Full load…
                  </>
                ) : dataReady ? (
                  'Full Refresh'
                ) : (
                  'Full Load (2018+)'
                )}
              </button>
            </div>
          </div>
        </div>

        {serverLoading && (
          <div className="border-b border-white/[0.06] px-4 py-3 sm:px-6 sm:py-4">
            <div className="mb-2 flex flex-col gap-1 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span className="break-words">{dataStatus?.load_progress || 'Fetching from Yahoo Finance…'}</span>
              <span className="shrink-0 text-brand-400">In progress</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-1/3 animate-[slide_1.8s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-brand-500 to-accent-blue" />
            </div>
          </div>
        )}

        <div className="grid gap-px bg-white/[0.04] sm:grid-cols-3">
          <DataMetric label="Tickers" value={dataStatus?.stocks ?? '—'} hint="Companies in database" />
          <DataMetric label="Price Rows" value={dataStatus?.price_rows?.toLocaleString('en-IN') ?? '—'} hint="Daily OHLCV candles" />
          <DataMetric label="Fundamentals" value={dataStatus?.fundamental_rows?.toLocaleString('en-IN') ?? '—'} hint="Market cap, ROCE, P/E" />
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 px-5 py-4 text-sm text-emerald-200">{message}</div>
      )}
      {dataStatus?.load_error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
          Load failed: {dataStatus.load_error}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">{error}</div>
      )}

      {dataReady && onGoToStrategy && (
        <div className="glass-panel flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-white">Data is ready</p>
            <p className="mt-1 text-sm text-slate-400">Continue to Strategy to configure filters and run your first backtest.</p>
          </div>
          <button type="button" onClick={onGoToStrategy} className="btn-primary w-full sm:w-auto">
            Continue to Strategy →
          </button>
        </div>
      )}

      <div className="glass-panel p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-white">Which load should I use?</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { title: 'Quick Load (2024)', desc: 'Best for learning the app. 10 stocks, one year of data, finishes fast.', tag: 'Start here' },
            { title: 'Full Load (2018+)', desc: '130+ stocks with long history. Use when running serious research.', tag: 'Advanced' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-white/[0.06] bg-[#181e2c]/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white">{item.title}</p>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">{item.tag}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatusPill({ ready, loading }) {
  if (loading) {
    return <span className="rounded-full bg-brand-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-400">Syncing</span>
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${ready ? 'bg-brand-500/15 text-brand-400' : 'bg-amber-500/15 text-amber-400'}`}>
      {ready ? 'Ready' : 'Empty'}
    </span>
  )
}

function DataMetric({ label, value, hint }) {
  return (
    <div className="bg-surface-raised px-4 py-4 sm:px-6 sm:py-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="metric-value mt-2">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{hint}</p>
    </div>
  )
}
