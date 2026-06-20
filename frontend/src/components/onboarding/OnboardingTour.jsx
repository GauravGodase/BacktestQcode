import { createPortal } from 'react-dom'
import { useState } from 'react'
import { fetchDataStatus, startDataLoad, waitForDataReady } from '../../api/data'
import { formatApiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../ui/Spinner'
import { ChartIcon, DatabaseIcon, SlidersIcon, SparkIcon } from '../ui/Icons'

import { markOnboardingComplete } from './onboardingStorage'

const WORKFLOW = [
  {
    step: 1,
    title: 'Load Market Data',
    body: 'Fetch price and fundamental data from Yahoo Finance for NSE-listed stocks.',
    detail: 'Quick Load pulls 10 large-cap stocks for 2024 — ready in under a minute.',
    icon: DatabaseIcon,
    accent: 'from-amber-500/20 to-amber-500/5 text-amber-400',
  },
  {
    step: 2,
    title: 'Configure Strategy',
    body: 'Define screening filters, ranking rules, and portfolio constraints.',
    detail: 'Start with a preset like Quality Momentum, or tune every parameter yourself.',
    icon: SlidersIcon,
    accent: 'from-brand-500/20 to-brand-500/5 text-brand-400',
  },
  {
    step: 3,
    title: 'Analyze Results',
    body: 'Review performance metrics, equity curves, and trade-level breakdowns.',
    detail: 'Export full reports as CSV or Excel for further analysis.',
    icon: ChartIcon,
    accent: 'from-accent-blue/20 to-accent-blue/5 text-accent-blue',
  },
]

const HIGHLIGHTS = [
  'Fundamental equity screening on Indian NSE stocks',
  'Historical backtesting with realistic portfolio simulation',
  'Interactive charts and exportable research reports',
]

export default function OnboardingTour({ onComplete, onSkip, onTryDemo }) {
  const { user } = useAuth()
  const [phase, setPhase] = useState('welcome')
  const [workflowStep, setWorkflowStep] = useState(0)
  const [demoLoading, setDemoLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(null)
  const [demoError, setDemoError] = useState(null)

  const finish = () => {
    markOnboardingComplete(user?.email)
    onComplete()
  }

  const skip = () => {
    markOnboardingComplete(user?.email)
    onSkip()
  }

  const quickStart = async () => {
    setDemoLoading(true)
    setDemoError(null)
    setLoadProgress('Starting demo data load…')
    try {
      await startDataLoad('minimal')

      const pollProgress = setInterval(async () => {
        try {
          const status = await fetchDataStatus()
          if (status.loading && status.load_progress) {
            setLoadProgress(status.load_progress)
          }
        } catch {
          /* ignore polling errors */
        }
      }, 1500)

      try {
        await waitForDataReady()
      } finally {
        clearInterval(pollProgress)
      }

      setLoadProgress('Data ready — opening strategy builder…')
      markOnboardingComplete(user?.email)
      onTryDemo()
      onComplete()
    } catch (err) {
      setDemoError(formatApiError(err))
      setLoadProgress(null)
    } finally {
      setDemoLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden bg-[#070b14]/90 backdrop-blur-md sm:items-center sm:p-4">
      <div className="glass-panel max-h-[min(92dvh,56rem)] w-full min-w-0 max-w-xl overflow-y-auto overscroll-contain scroll-touch rounded-t-2xl sm:max-h-[min(85dvh,48rem)] sm:rounded-2xl">
        {phase === 'welcome' && (
          <WelcomePhase highlights={HIGHLIGHTS} onContinue={() => setPhase('workflow')} onSkip={skip} />
        )}

        {phase === 'workflow' && (
          <WorkflowPhase
            step={workflowStep}
            onBack={() => (workflowStep > 0 ? setWorkflowStep((s) => s - 1) : setPhase('welcome'))}
            onNext={() => (workflowStep < WORKFLOW.length - 1 ? setWorkflowStep((s) => s + 1) : setPhase('start'))}
            onSkip={skip}
          />
        )}

        {phase === 'start' && (
          <StartPhase
            demoLoading={demoLoading}
            loadProgress={loadProgress}
            demoError={demoError}
            onQuickStart={quickStart}
            onManual={finish}
            onSkip={skip}
          />
        )}
      </div>
    </div>,
    document.body,
  )
}

function WelcomePhase({ highlights, onContinue, onSkip }) {
  return (
    <div className="p-5 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-400">Welcome</span>
        <button type="button" onClick={onSkip} className="btn-ghost text-xs text-slate-500 hover:text-white">
          Skip
        </button>
      </div>

      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-600 shadow-lg shadow-brand-500/20">
        <SparkIcon className="h-8 w-8 text-white" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Welcome to Qcode</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        A research platform for backtesting fundamental equity strategies on Indian markets. Here&apos;s what you can do:
      </p>

      <ul className="mt-6 space-y-3">
        {highlights.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
            {item}
          </li>
        ))}
      </ul>

      <button type="button" onClick={onContinue} className="btn-primary mt-8 w-full py-3">
        See how it works
      </button>
    </div>
  )
}

function WorkflowPhase({ step, onBack, onNext, onSkip }) {
  const current = WORKFLOW[step]
  const Icon = current.icon

  return (
    <div className="p-5 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-400">
          How it works · {step + 1}/{WORKFLOW.length}
        </span>
        <button type="button" onClick={onSkip} className="btn-ghost text-xs text-slate-500 hover:text-white">
          Skip
        </button>
      </div>

      <div className="mb-6 flex gap-2">
        {WORKFLOW.map((item, index) => (
          <div
            key={item.step}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${index <= step ? 'bg-brand-500' : 'bg-white/[0.08]'}`}
          />
        ))}
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2">
        {WORKFLOW.map((item, index) => {
          const StepIcon = item.icon
          const active = index === step
          const done = index < step
          return (
            <div
              key={item.step}
              className={`rounded-xl border px-3 py-3 text-center transition-all ${
                active
                  ? 'border-brand-500/40 bg-brand-500/10'
                  : done
                    ? 'border-brand-500/20 bg-brand-500/5'
                    : 'border-white/[0.06] bg-white/[0.02]'
              }`}
            >
              <StepIcon className={`mx-auto h-4 w-4 ${active || done ? 'text-brand-400' : 'text-slate-600'}`} />
              <p className={`mt-1.5 text-[10px] font-semibold uppercase tracking-wider ${active ? 'text-brand-400' : 'text-slate-500'}`}>
                Step {item.step}
              </p>
            </div>
          )
        })}
      </div>

      <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${current.accent}`}>
        <Icon className="h-7 w-7" />
      </div>

      <h2 className="text-xl font-bold text-white">{current.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{current.body}</p>
      <p className="mt-2 text-xs text-slate-500">{current.detail}</p>

      <div className="mt-8 flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">
          Back
        </button>
        <button type="button" onClick={onNext} className="btn-primary flex-1">
          {step === WORKFLOW.length - 1 ? 'Continue' : 'Next'}
        </button>
      </div>
    </div>
  )
}

function StartPhase({ demoLoading, loadProgress, demoError, onQuickStart, onManual, onSkip }) {
  return (
    <div className="p-5 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-400">Get started</span>
        {!demoLoading && (
          <button type="button" onClick={onSkip} className="btn-ghost text-xs text-slate-500 hover:text-white">
            Skip
          </button>
        )}
      </div>

      {demoLoading ? (
        <div className="py-6 text-center">
          <Spinner size="lg" className="mx-auto mb-5" />
          <h2 className="text-lg font-semibold text-white">Preparing your workspace</h2>
          <p className="mt-2 text-sm text-slate-400">{loadProgress || 'Fetching 2024 market data…'}</p>
          <div className="mx-auto mt-6 h-1.5 max-w-xs overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-1/3 animate-[slide_1.8s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-brand-500 to-accent-blue" />
          </div>
          <p className="mt-4 text-xs text-slate-500">This usually takes less than a minute</p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold text-white">Ready to begin?</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Choose how you&apos;d like to start. Quick Start loads sample data and opens the strategy builder so you can run your first backtest immediately.
          </p>

          <div className="mt-6 space-y-3">
            <button type="button" onClick={onQuickStart} className="btn-primary w-full py-3">
              Quick Start — load demo data
            </button>
            <button type="button" onClick={onManual} className="btn-secondary w-full py-3">
              I&apos;ll set up manually
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-white/[0.06] bg-[#181e2c]/50 px-4 py-3">
            <p className="text-xs font-medium text-slate-300">Quick Start includes</p>
            <p className="mt-1 text-xs text-slate-500">10 NSE large-cap stocks · 2024 price &amp; fundamental data · Strategy tab pre-selected</p>
          </div>
        </>
      )}

      {demoError && (
        <div className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {demoError}
          <button type="button" onClick={onManual} className="btn-secondary mt-3 w-full text-xs">
            Continue without demo data
          </button>
        </div>
      )}
    </div>
  )
}
