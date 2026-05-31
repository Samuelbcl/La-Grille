/** Bloc « fantôme » qui pulse, pour les écrans de chargement. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-2 ${className}`} />;
}

/** Carte de match fantôme (reprend la forme d'une MatchCard). */
export function MatchCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface border border-border shadow-card p-4 space-y-3">
      <Skeleton className="h-3 w-32" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-5 w-6" />
      </div>
      <div className="h-px bg-border" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-5 w-6" />
      </div>
    </div>
  );
}

/** Ligne de classement fantôme. */
export function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface border border-border shadow-card px-4 py-3">
      <Skeleton className="h-7 w-7 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-8" />
    </div>
  );
}
