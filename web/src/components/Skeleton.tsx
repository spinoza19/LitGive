export function CardSkeleton() {
  return (
    <div className="card animate-pulse space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-3/4 rounded bg-border" />
          <div className="h-3 w-1/3 rounded bg-border" />
        </div>
        <div className="h-5 w-16 rounded-full bg-border" />
      </div>
      <div className="h-3 w-full rounded bg-border" />
      <div className="h-3 w-5/6 rounded bg-border" />
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-1/3 rounded bg-border" />
          <div className="h-3 w-1/4 rounded bg-border" />
        </div>
        <div className="h-1.5 w-full rounded bg-border" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="card animate-pulse space-y-2">
      <div className="h-3 w-16 rounded bg-border" />
      <div className="h-7 w-24 rounded bg-border" />
    </div>
  );
}
