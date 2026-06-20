export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4 border', md: 'h-8 w-8 border-2', lg: 'h-14 w-14 border-2' }
  return (
    <div
      className={`animate-spin rounded-full border-brand-500 border-t-transparent ${sizes[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-surface text-slate-400">
      <Spinner size="lg" />
      <p className="text-sm font-medium tracking-wide">{label}</p>
    </div>
  )
}

export function SectionLoader({ label = 'Loading…' }) {
  return (
    <div className="glass-panel flex min-h-[240px] flex-col items-center justify-center gap-3 p-12" role="status" aria-label={label}>
      <div className="skeleton-shimmer h-8 w-8 rounded-full" />
      <div className="skeleton-shimmer h-3 w-32 rounded-lg" />
    </div>
  )
}

export function ButtonSpinner() {
  return <Spinner size="sm" className="border-white/30 border-t-white" />
}
