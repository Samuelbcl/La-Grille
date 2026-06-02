import { MatchCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <header className="app-header sticky top-0 z-30 px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3">
        <Skeleton className="mb-1.5 h-6 w-28" />
        <Skeleton className="h-3 w-40" />
      </header>
      <div className="px-4 py-4 space-y-6">
        {[0, 1].map((s) => (
          <section key={s}>
            <Skeleton className="ml-1 mb-2 h-3 w-28" />
            <div className="space-y-2.5">
              {[0, 1].map((c) => (
                <MatchCardSkeleton key={c} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
