import { useEffect, useState } from 'react'
import { fetchDemoCredentials } from '../../api/auth'
import { formatApiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { ButtonSpinner } from '../ui/Spinner'
import { SparkIcon } from '../ui/Icons'

const DEMO_FALLBACK = {
  email: 'demo@qcode.com',
  password: 'demo1234',
  hint: 'Use these credentials to explore the platform instantly.',
}

export default function LoginPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [demo, setDemo] = useState(null)

  useEffect(() => {
    fetchDemoCredentials()
      .then(setDemo)
      .catch(() => setDemo(DEMO_FALLBACK))
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, fullName)
      }
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const useDemoAccount = async () => {
    if (!demo) return
    setLoading(true)
    setError(null)
    try {
      await login(demo.email, demo.password)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[100dvh] min-w-0 flex-col overflow-y-auto overscroll-contain scroll-touch bg-surface page-gutter py-6 sm:py-10">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex w-full min-w-0 max-w-md flex-1 flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-600">
            <SparkIcon className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-fluid-xl font-bold text-white">Qcode Backtesting</h1>
          <p className="mt-2 text-fluid-sm text-slate-400">Sign in to research Indian equity strategies</p>
        </div>

        <div className="glass-panel p-6">
          <div className="mb-6 flex rounded-xl border border-white/[0.06] bg-[#181e2c]/50 p-1">
            {['login', 'register'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setMode(tab)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition ${
                  mode === tab ? 'bg-white/[0.1] text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Field label="Full name">
                <input className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} />
              </Field>
            )}
            <Field label="Email">
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Password" hint={mode === 'register' ? 'Min 8 chars, include letters and numbers' : undefined}>
              <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === 'register' ? 8 : 1} />
            </Field>

            {error && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <>
                  <ButtonSpinner />
                  Please wait…
                </>
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {demo && (
            <div className="mt-5 border-t border-white/[0.06] pt-5">
              <p className="text-xs text-slate-500">{demo.hint}</p>
              <button type="button" onClick={useDemoAccount} disabled={loading} className="btn-secondary mt-3 w-full">
                {loading ? (
                  <>
                    <ButtonSpinner />
                    Signing in…
                  </>
                ) : (
                  'Continue with Demo Account'
                )}
              </button>
              <p className="mt-2 text-center font-mono text-[11px] text-slate-600">
                {demo.email} · {demo.password}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-600">{hint}</p>}
    </div>
  )
}
