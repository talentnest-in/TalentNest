export function JobCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-border animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-border rounded animate-pulse w-3/4" />
          <div className="h-4 bg-border rounded animate-pulse w-1/2" />
          <div className="flex gap-3">
            <div className="h-4 bg-border rounded animate-pulse w-20" />
            <div className="h-4 bg-border rounded animate-pulse w-20" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 bg-border rounded animate-pulse w-16" />
            <div className="h-6 bg-border rounded animate-pulse w-16" />
            <div className="h-6 bg-border rounded animate-pulse w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function JobsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}
