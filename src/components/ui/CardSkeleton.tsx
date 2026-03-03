export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-gray-900/60 border border-white/5 overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="h-44 bg-gray-800/80" />
      <div className="p-4 space-y-3">
        {/* Badge + title */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded-full bg-gray-800" />
          <div className="h-5 w-24 rounded-full bg-gray-800" />
        </div>
        <div className="h-5 w-3/4 rounded-lg bg-gray-800" />
        <div className="h-4 w-full rounded-lg bg-gray-800/60" />
        <div className="h-4 w-2/3 rounded-lg bg-gray-800/60" />
        {/* Bar */}
        <div className="h-2 w-full rounded-full bg-gray-800 mt-2" />
        <div className="flex justify-between">
          <div className="h-4 w-20 rounded bg-gray-800" />
          <div className="h-4 w-16 rounded bg-gray-800" />
        </div>
      </div>
    </div>
  )
}

export function CardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
