import { Skeleton, SkeletonText } from './Skeleton'

export function LoginPageSkeleton() {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-surface px-4 py-6 sm:h-screen">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center">
          <Skeleton className="mb-4 h-14 w-14 rounded-2xl" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-3 h-4 w-64" />
        </div>
        <div className="glass-panel space-y-4 p-6">
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="border-t border-white/[0.06] pt-5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-3 h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden bg-surface">
      <div className="shrink-0 border-b border-white/[0.06] bg-[#0c0f17]/80 px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="hidden h-2.5 w-20 sm:block" />
              <Skeleton className="h-5 w-36" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="hidden h-10 w-20 rounded-xl md:block" />
            <Skeleton className="hidden h-10 w-20 rounded-xl md:block" />
            <Skeleton className="hidden h-10 w-20 rounded-xl md:block" />
            <Skeleton className="h-8 w-16 rounded-xl" />
          </div>
        </div>
        <div className="mt-2 flex gap-2 md:hidden">
          <Skeleton className="h-10 w-20 shrink-0 rounded-xl" />
          <Skeleton className="h-10 w-20 shrink-0 rounded-xl" />
          <Skeleton className="h-10 w-20 shrink-0 rounded-xl" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-sidebar shrink-0 flex-col border-r border-white/[0.06] p-3 xl:flex">
          <Skeleton className="mb-4 h-3 w-16" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
          <div className="mt-auto space-y-2 border-t border-white/[0.06] pt-3">
            <Skeleton className="h-3 w-14" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-9 w-full rounded-xl" />
            ))}
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-hidden p-4 lg:p-6">
          <DataPanelSkeleton />
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-white/[0.08] bg-[#0c0f17]/95 pb-safe xl:hidden">
        <div className="grid grid-cols-3 gap-1 px-2 py-1.5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="mx-auto h-12 w-full max-w-[100px] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function DataPanelSkeleton() {
  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6">
      <div className="glass-panel overflow-hidden">
        <div className="border-b border-white/[0.06] px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl sm:h-11 sm:w-11" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <SkeletonText lines={2} />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Skeleton className="h-10 w-full rounded-xl sm:w-36" />
              <Skeleton className="h-10 w-full rounded-xl sm:w-36" />
            </div>
          </div>
        </div>
        <div className="grid gap-px bg-white/[0.04] sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 bg-surface-raised px-4 py-4 sm:px-6 sm:py-5">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </div>
      <div className="glass-panel p-4 sm:p-6">
        <Skeleton className="mb-4 h-4 w-44" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function StrategySkeleton() {
  return (
    <div className="animate-fade-in grid gap-4 xl:grid-cols-[minmax(0,380px)_1fr] xl:gap-5">
      <div className="glass-panel overflow-hidden">
        <div className="border-b border-white/[0.06] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-52" />
            </div>
          </div>
        </div>
        <StrategyFormSkeleton />
      </div>
      <div className="glass-panel flex min-h-[220px] flex-col items-center justify-center p-8 sm:min-h-[280px]">
        <Skeleton className="mb-4 h-10 w-10 rounded-xl" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
    </div>
  )
}

export function StrategyFormSkeleton() {
  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div>
        <Skeleton className="mb-2 h-3 w-24" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-white/[0.06] bg-[#181e2c]/30 p-4">
          <Skeleton className="mb-3 h-4 w-32" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
          </div>
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  )
}

export function ResultsPanelSkeleton() {
  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Skeleton className="h-10 w-full rounded-xl sm:w-24" />
          <Skeleton className="h-10 w-full rounded-xl sm:w-24" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`glass-panel p-3 sm:p-4 ${i === 3 ? 'col-span-2 lg:col-span-1' : ''}`}>
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="mt-2 h-7 w-20" />
          </div>
        ))}
      </div>

      <Skeleton className="h-10 w-full rounded-xl sm:w-72" />

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass-panel p-4 sm:p-5">
          <Skeleton className="mb-1 h-4 w-28" />
          <Skeleton className="mb-4 h-3 w-40" />
          <Skeleton className="chart-adaptive w-full rounded-xl" />
        </div>
        <div className="glass-panel p-4 sm:p-5">
          <Skeleton className="mb-1 h-4 w-24" />
          <Skeleton className="mb-4 h-3 w-36" />
          <Skeleton className="chart-adaptive w-full rounded-xl" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  )
}

export function BacktestRunningSkeleton() {
  return (
    <div className="animate-fade-in">
      <div className="glass-panel flex min-h-[280px] flex-col items-center justify-center p-8 sm:min-h-[320px]">
        <Skeleton className="mb-5 h-14 w-14 rounded-full" />
        <Skeleton className="h-5 w-44" />
        <Skeleton className="mt-2 h-4 w-64" />
        <div className="mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="skeleton-shimmer h-full w-1/3 rounded-full" />
        </div>
        <p className="mt-4 text-sm text-slate-500">Running simulation…</p>
      </div>
    </div>
  )
}

export function OnboardingTourSkeleton() {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#070b14]/90 backdrop-blur-md sm:items-center sm:p-4">
      <div className="glass-panel w-full max-w-xl animate-fade-in rounded-t-2xl p-5 sm:rounded-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-12 rounded-lg" />
        </div>
        <Skeleton className="mb-5 h-16 w-16 rounded-2xl" />
        <Skeleton className="h-7 w-48" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        <Skeleton className="mt-8 h-11 w-full rounded-xl" />
      </div>
    </div>
  )
}
