import { MatchCardSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Chargement de l'accueil : squelette de la liste des matchs (pas d'écran vide). */
export default function Loading() {
  return (
    <>
      <header className="glass sticky top-0 z-30 px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3 border-b border-border">
        <Skeleton className="h-6 w-44" />
      </header>
      <div className="px-4 py-4 space-y-6">
        {[0, 1].map((s) => (
          <section key={s}>
            <Skeleton className="ml-1 mb-2 h-3 w-28" />
            <div className="space-y-2.5">
              {[0, 1, 2].map((c) => (
                <MatchCardSkeleton key={c} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
