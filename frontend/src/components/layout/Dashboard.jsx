import { lazy, Suspense, useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useBacktest } from '../../hooks/useBacktest'
import { useDataStatus } from '../../hooks/useDataStatus'
import WorkflowSteps from './WorkflowSteps'
import { Skeleton } from '../ui/Skeleton'
import {
  BacktestRunningSkeleton,
  DataPanelSkeleton,
  ResultsPanelSkeleton,
  StrategyFormSkeleton,
  StrategySkeleton,
} from '../ui/SectionSkeletons'
import { ChartIcon, DatabaseIcon, SlidersIcon, SparkIcon } from '../ui/Icons'

const DataPanel = lazy(() => import('../DataPanel'))
const BacktestForm = lazy(() => import('../BacktestForm'))
const ResultsPanel = lazy(() => import('../ResultsPanel'))

export default function Dashboard({ initialSection = 'data', onReplayTour }) {
  const { user, logout } = useAuth()
  const { dataStatus, dataReady, statusLoading, refresh } = useDataStatus()
  const { result, loading, error, execute, exportResults, setError } = useBacktest()
  const [activeSection, setActiveSection] = useState(initialSection)

  useEffect(() => {
    if (error) {
      toast.error(error)
      setError(null)
    }
  }, [error, setError])

  const handleRun = async (params) => {
    setActiveSection('results')
    try {
      await execute(params)
    } catch {
      setActiveSection('strategy')
    }
  }

  const sections = [
    { id: 'data', label: 'Data', shortLabel: 'Data', icon: DatabaseIcon },
    { id: 'strategy', label: 'Strategy', shortLabel: 'Strategy', icon: SlidersIcon },
    { id: 'results', label: 'Results', shortLabel: 'Results', icon: ChartIcon, disabled: !result && !loading },
  ]

  const activeLabel = sections.find((s) => s.id === activeSection)?.label ?? ''

  return (
    <div className="app-shell flex h-screen min-w-0 flex-col overflow-hidden bg-surface text-slate-100">
      <Background />

      <header className="relative z-10 shrink-0 border-b border-white/[0.06] bg-[#0c0f17]/80 pt-safe backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 page-gutter py-2.5 sm:py-3">
          <div className="flex min-w-0 max-w-full items-center gap-2.5 sm:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-emerald-600 sm:h-9 sm:w-9">
              <SparkIcon className="h-4 w-4 text-white sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="hidden text-fluid-xs font-semibold uppercase tracking-[0.18em] text-brand-400 xs:block">Indian Equities</p>
              <h1 className="truncate text-fluid-lg font-bold tracking-tight text-white">Qcode Backtesting</h1>
            </div>
          </div>

          <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2">
            <div className="hidden flex-wrap items-center gap-2 md:flex">
              <HeaderStat label="Stocks" value={dataStatus?.stocks} loading={statusLoading} />
              <HeaderStat label="Price rows" value={dataStatus?.price_rows?.toLocaleString('en-IN')} loading={statusLoading} />
              <HeaderStat label="Fundamentals" value={dataStatus?.fundamental_rows?.toLocaleString('en-IN')} loading={statusLoading} />
            </div>
            <button type="button" onClick={logout} className="btn-secondary shrink-0 min-w-[7rem] px-4 py-2.5 text-fluid-xs sm:px-4">
              Sign out
            </button>
            {onReplayTour && (
              <button type="button" onClick={onReplayTour} className="btn-primary hidden shrink-0 min-w-[7rem] px-4 py-2.5 text-fluid-xs sm:inline-flex">
                Take tour
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-t border-white/[0.04] page-gutter py-2 no-scrollbar md:hidden">
          <HeaderStat label="Stocks" value={dataStatus?.stocks} loading={statusLoading} compact />
          <HeaderStat label="Price rows" value={dataStatus?.price_rows?.toLocaleString('en-IN')} loading={statusLoading} compact />
          <HeaderStat label="Fundamentals" value={dataStatus?.fundamental_rows?.toLocaleString('en-IN')} loading={statusLoading} compact />
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1">
        <aside className="hidden w-sidebar min-w-0 shrink-0 flex-col border-r border-white/[0.06] bg-[#0c0f17]/60 backdrop-blur-xl xl:flex">
          <div className="border-b border-white/[0.06] px-3 py-3 xl:px-4">
            <p className="text-fluid-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Workflow</p>
          </div>
          <WorkflowSteps
            orientation="vertical"
            activeSection={activeSection}
            dataReady={dataReady}
            hasResults={Boolean(result)}
            onNavigate={setActiveSection}
          />

          <div className="mt-auto border-t border-white/[0.06] p-2 xl:p-3">
            <p className="mb-2 px-1 text-fluid-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sections</p>
            <div className="flex flex-col gap-1">
              {sections.map(({ id, label, icon: Icon, disabled }) => (
                <button
                  key={id}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && setActiveSection(id)}
                  className={`nav-tab w-full justify-start px-2.5 py-2 text-fluid-xs xl:px-3 ${activeSection === id ? 'nav-tab-active' : 'nav-tab-inactive'} ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{label}</span>
                  {id === 'data' && (
                    <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${dataReady ? 'bg-brand-400' : 'bg-amber-400'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <main className="@container/main min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain scroll-touch page-gutter py-3 pb-bottom-nav xl:pb-5">
            <div className="mx-auto w-full min-w-0 max-w-content">
              {activeSection === 'data' && (
                <Suspense fallback={<DataPanelSkeleton />}>
                  <DataPanel dataStatus={dataStatus} onLoaded={refresh} onGoToStrategy={() => setActiveSection('strategy')} />
                </Suspense>
              )}

              {activeSection === 'strategy' && (
                <Suspense fallback={<StrategySkeleton />}>
                  <StrategySection
                    dataReady={dataReady}
                    loading={loading}
                    error={error}
                    onRun={handleRun}
                    onGoToData={() => setActiveSection('data')}
                    onClearError={() => setError(null)}
                  />
                </Suspense>
              )}

              {activeSection === 'results' && (
                <ResultsSection loading={loading} result={result} onExport={exportResults} onGoToStrategy={() => setActiveSection('strategy')} />
              )}
            </div>
          </main>

          <footer className="hidden shrink-0 border-t border-white/[0.06] bg-[#0c0f17]/80 py-2 backdrop-blur-xl xl:block">
            <div className="mx-auto flex w-full min-w-0 max-w-content flex-wrap items-center justify-between gap-x-3 gap-y-2 page-gutter text-fluid-xs">
              <div className="flex min-w-0 flex-1 items-center gap-2 text-slate-400">
                <span className="hidden shrink-0 sm:inline">Signed in as</span>
                <span className="truncate font-medium text-slate-300">{user?.full_name}</span>
                <span className="shrink-0 text-slate-600">·</span>
                <span className="truncate text-slate-500">{activeLabel}</span>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <StatusBadge label="Data" ready={dataReady} loading={dataStatus?.loading} />
                <StatusBadge label="Results" ready={Boolean(result)} />
              </div>
            </div>
          </footer>
        </div>
      </div>

      <MobileBottomNav
        sections={sections}
        activeSection={activeSection}
        dataReady={dataReady}
        onNavigate={setActiveSection}
      />
    </div>
  )
}

function MobileBottomNav({ sections, activeSection, dataReady, onNavigate }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/[0.08] bg-[#0c0f17]/95 pb-safe backdrop-blur-xl xl:hidden">
      <div className="mx-auto grid w-full max-w-lg grid-cols-3 gap-1 px-2 py-1.5">
        {sections.map(({ id, shortLabel, icon: Icon, disabled }) => {
          const active = activeSection === id
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onNavigate(id)}
              className={`flex min-h-[var(--touch-target)] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition ${
                active ? 'bg-brand-500/15 text-brand-400' : 'text-slate-500'
              } ${disabled ? 'cursor-not-allowed opacity-40' : 'active:scale-95'}`}
            >
              <span className="relative shrink-0">
                <Icon className="h-5 w-5" />
                {id === 'data' && (
                  <span className={`absolute -right-1 -top-1 h-2 w-2 rounded-full ring-2 ring-[#0c0f17] ${dataReady ? 'bg-brand-400' : 'bg-amber-400'}`} />
                )}
              </span>
              <span className="w-full truncate text-center text-fluid-xs font-semibold">{shortLabel}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function StrategySection({ dataReady, loading, error, onRun, onGoToData, onClearError }) {
  return (
    <div className="grid min-w-0 gap-4">
      <div className="glass-panel flex min-w-0 flex-col xl:max-h-[calc(100vh-8rem)] xl:overflow-hidden">
        <div className="shrink-0 border-b border-white/[0.06] p-4 sm:p-5 sm:pb-4">
          <SectionHeader icon={SlidersIcon} title="Strategy Configuration" subtitle="Filters, ranking & position sizing" />
        </div>
        <div className="min-w-0 p-4 sm:p-5 sm:pt-4 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:overscroll-contain xl:scroll-touch">
          <Suspense fallback={<StrategyFormSkeleton />}>
            <BacktestForm onRun={onRun} loading={loading} disabled={!dataReady} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function ResultsSection({ loading, result, onExport, onGoToStrategy }) {
  if (loading) {
    return <BacktestRunningSkeleton />
  }

  if (result) {
    return (
      <>
        <Suspense fallback={<ResultsPanelSkeleton />}>
          <ResultsPanel result={result} onExport={onExport} />
        </Suspense>
      </>
    )
  }

  return (
    <div className="glass-panel p-6 text-center sm:p-10">
      <p className="text-fluid-sm text-slate-400 sm:text-fluid-base">No results yet. Configure and run a backtest first.</p>
      <button type="button" onClick={onGoToStrategy} className="btn-secondary mt-4 w-full max-w-xs sm:w-auto">
        Open Strategy
      </button>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400 sm:h-9 sm:w-9">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <h2 className="truncate text-fluid-base font-semibold tracking-tight text-white">{title}</h2>
        <p className="truncate text-fluid-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  )
}

function HeaderStat({ label, value, loading, compact = false }) {
  return (
    <div className={`min-w-0 shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.03] text-center ${compact ? 'min-w-[4.5rem] flex-1 px-2 py-1.5 sm:flex-none sm:px-2.5' : 'px-2.5 py-1.5'}`}>
      <p className="truncate text-fluid-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      {loading ? (
        <Skeleton className="mx-auto mt-1 h-4 w-10" />
      ) : (
        <p className="mt-0.5 truncate font-mono font-semibold text-white text-fluid-sm">{value ?? '—'}</p>
      )}
    </div>
  )
}

function StatusBadge({ label, ready, loading }) {
  const tone = loading ? 'bg-brand-500/15 text-brand-400' : ready ? 'bg-brand-500/15 text-brand-400' : 'bg-amber-500/15 text-amber-400'
  const text = loading ? 'Syncing' : ready ? 'Ready' : 'Pending'

  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-fluid-xs font-semibold uppercase tracking-wider ${tone}`}>
      <span className="hidden sm:inline">{label}: </span>
      {text}
    </span>
  )
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-0 h-[min(480px,60vh)] w-[min(480px,80vw)] -translate-x-1/2 rounded-full bg-brand-500/[0.07] blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-[min(360px,50vh)] w-[min(360px,70vw)] rounded-full bg-accent-blue/10 blur-[100px]" />
    </div>
  )
}
