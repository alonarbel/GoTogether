export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-[--color-night-950] border border-[--color-mist-500] overflow-hidden animate-pulse">
      <div className="aspect-[5/3] bg-gradient-to-br from-[--color-night-800] via-[--color-night-700] to-[--color-night-800]" />
      <div className="p-5 space-y-3.5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-20 rounded-full bg-[--color-night-900]" />
          <div className="h-2.5 w-24 rounded-full bg-[--color-night-900]" />
        </div>
        <div className="h-6 w-3/4 rounded-md bg-[--color-night-900]" />
        <div className="h-3 w-full rounded-md bg-[--color-night-900]" />
        <div className="h-3 w-2/3 rounded-md bg-[--color-night-900]" />
        <div className="h-px w-full bg-[--color-night-900] mt-2" />
        <div className="flex justify-between">
          <div className="h-3 w-20 rounded-full bg-[--color-night-900]" />
          <div className="h-3 w-16 rounded-full bg-[--color-night-900]" />
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
