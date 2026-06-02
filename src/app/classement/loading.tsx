import { LeaderboardRowSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Chargement du classement : squelette des lignes. */
export default function Loading() {
  return (
    <>
      <header className="app-header sticky top-0 z-30 px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3">
        <Skeleton className="mb-1.5 h-6 w-40" />
        <Skeleton className="h-3 w-24" />
      </header>
      <div className="px-4 py-4 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <LeaderboardRowSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
