import Link from "next/link";
import { getCurrentPool, getMatchesWithPredictions } from "@/lib/queries";
import { MatchCard } from "@/components/MatchCard";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { dayKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CalendrierPage() {
  const pool = await getCurrentPool();

  if (!pool) {
    return (
      <div className="px-6 pt-24 text-center">
        <div className="text-5xl mb-4">⚽️</div>
        <h1 className="text-2xl font-bold">Bienvenue !</h1>
        <p className="text-muted mt-2 mb-6">
          Crée ton groupe de pronos, ou rejoins celui de tes potes avec un code,
          depuis l&apos;onglet <b>Groupe</b>.
        </p>
        <Link
          href="/admin"
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-6 font-semibold text-accent-fg shadow-card active:scale-[0.98] transition"
        >
          Créer ou rejoindre un groupe →
        </Link>
      </div>
    );
  }

  const matches = await getMatchesWithPredictions(pool.id, pool.user_id);

  // Regroupe par jour
  const days = new Map<string, typeof matches>();
  for (const m of matches) {
    const k = dayKey(m.kickoff);
    if (!days.has(k)) days.set(k, []);
    days.get(k)!.push(m);
  }

  return (
    <>
      <RealtimeRefresh poolId={pool.id} />
      <header className="app-header sticky top-0 z-30 px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-[22px] font-bold tracking-tight">{pool.name}</h1>
          <Link href="/regles" className="text-sm text-accent font-medium">
            Règles
          </Link>
        </div>
        <p className="text-[13px] text-muted">Calendrier &amp; résultats</p>
      </header>

      <div className="px-4 py-4 space-y-6">
        {matches.length === 0 && (
          <p className="text-center text-muted pt-16">
            Aucun match pour l&apos;instant. L&apos;organisateur peut les charger dans <b>Groupe</b>.
          </p>
        )}
        {[...days.entries()].map(([day, list]) => (
          <section key={day}>
            <h2 className="px-1 mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
              {day}
            </h2>
            <div className="space-y-2.5">
              {list.map((m) => (
                <MatchCard key={m.id} m={m} userId={pool.user_id} />
              ))}
            </div>
          </section>
        ))}

        {matches.length > 0 && !matches.some((m) => m.stage !== "group") && (
          <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-5 text-center">
            <div className="mb-1 text-3xl">🏆</div>
            <p className="font-semibold">Phase finale — bientôt</p>
            <p className="mt-0.5 text-[13px] text-muted">
              16es de finale → finale. Les affiches apparaîtront ici <b>automatiquement</b> dès la fin
              des poules.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
