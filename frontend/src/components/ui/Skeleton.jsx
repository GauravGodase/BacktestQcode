export function Skeleton({ className = '', as: Tag = 'div' }) {
  return <Tag className={`skeleton-shimmer rounded-lg ${className}`} aria-hidden="true" />
}

export function SkeletonText({ lines = 3, className = '' }) {
  const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/4']
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${widths[i % widths.length]}`} />
      ))}
    </div>
  )
}
