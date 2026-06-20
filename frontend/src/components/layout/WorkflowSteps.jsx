import { ChartIcon, DatabaseIcon, SlidersIcon } from '../ui/Icons'

const STEPS = [
  { id: 'data', step: 1, label: 'Load Data', icon: DatabaseIcon },
  { id: 'strategy', step: 2, label: 'Configure', icon: SlidersIcon },
  { id: 'results', step: 3, label: 'Results', icon: ChartIcon },
]

export default function WorkflowSteps({ activeSection, dataReady, hasResults, onNavigate, orientation = 'horizontal' }) {
  if (orientation === 'vertical') {
    return (
      <nav className="flex flex-col gap-1.5 p-3">
        {STEPS.map(({ id, step, label, icon: Icon }) => {
          const active = activeSection === id
          const complete = id === 'data' ? dataReady : id === 'results' ? hasResults : dataReady
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                active ? 'bg-brand-500/15 ring-1 ring-brand-500/30' : 'hover:bg-white/[0.04]'
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${complete ? 'bg-brand-500/15 text-brand-400' : 'bg-white/[0.05] text-slate-500'}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Step {step}</p>
                <p className="truncate text-fluid-xs font-semibold text-white">{label}</p>
              </div>
              {complete && !active && (
                <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              )}
            </button>
          )
        })}
      </nav>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {STEPS.map(({ id, step, label, icon: Icon }) => {
        const active = activeSection === id
        const complete = id === 'data' ? dataReady : id === 'results' ? hasResults : dataReady
        return (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className={`glass-panel flex items-center gap-3 px-4 py-3 text-left transition ${
              active ? 'ring-1 ring-brand-500/40' : 'hover:bg-white/[0.03]'
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${complete ? 'bg-brand-500/15 text-brand-400' : 'bg-white/[0.05] text-slate-500'}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Step {step}</p>
              <p className="text-sm font-semibold text-white">{label}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
