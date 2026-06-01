import Link from "next/link";
import { getCurrentPool, getMatchesWithPredictions } from "@/lib/queries";
import { MatchCard } from "@/components/MatchCard";
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
          Crée ton groupe de pronos, ou rejoins celui de tes potes avec un code.
        </p>
        <div className="mx-auto max-w-xs space-y-2">
          <Link
            href="/admin"
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-accent font-semibold text-accent-fg shadow-card active:scale-[0.98] transition"
          >
            Créer un groupe
          </Link>
          <Link
            href="/admin"
            className="flex h-12 w-full items-center justify-center rounded-2xl border border-border bg-surface-2 font-semibold active:scale-[0.98] transition"
          >
            Rejoindre avec un code
          </Link>
        </div>
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
      <header className="glass sticky top-0 z-30 px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3 border-b border-border">
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
            Aucun match pour l&apos;instant. L&apos;organisateur peut les charger dans <b>Gérer</b>.
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
      </div>
    </>
  );
}
