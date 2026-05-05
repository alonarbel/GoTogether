export function CardSkeleton() {
  return (
    <div className="rounded-md bg-[--color-ink-850] border border-[rgba(255,255,255,.04)] overflow-hidden animate-pulse">
      <div className="aspect-[5/3] bg-[--color-ink-800]" />
      <div className="p-5 space-y-3.5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-20 rounded-sm bg-[--color-ink-800]" />
          <div className="h-2.5 w-24 rounded-sm bg-[--color-ink-800]" />
        </div>
        <div className="h-6 w-3/4 rounded-sm bg-[--color-ink-800]" />
        <div className="h-3 w-full rounded-sm bg-[--color-ink-800]" />
        <div className="h-3 w-2/3 rounded-sm bg-[--color-ink-800]" />
        <div className="h-px w-full bg-[--color-ink-800] mt-2" />
        <div className="flex justify-between">
          <div className="h-3 w-20 rounded-sm bg-[--color-ink-800]" />
          <div className="h-3 w-16 rounded-sm bg-[--color-ink-800]" />
        </div>
      </div>
    </div>
  )
}

export function CardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
