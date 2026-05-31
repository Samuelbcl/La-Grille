import Link from "next/link";
import { getCurrentPool, getMatchesWithPredictions } from "@/lib/queries";
import { MatchCard } from "@/components/MatchCard";
import { dayKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const pool = await getCurrentPool();

  if (!pool) {
    return (
      <div className="px-6 pt-24 text-center">
        <div className="text-5xl mb-4">⚽️</div>
        <h1 className="text-2xl font-bold">Bienvenue !</h1>
        <p className="text-muted mt-2">
          Tu n'es encore dans aucun pool. Crée-le ou rejoins celui de tes potes
          depuis l'onglet <b>Gérer</b>.
        </p>
        <Link href="/admin" className="text-accent font-semibold mt-4 inline-block">
          Aller à Gérer →
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

  const pendingCount = matches.filter(
    (m) => new Date(m.kickoff) > new Date() && m.pred_a == null
  ).length;

  return (
    <>
      <header className="glass sticky top-0 z-30 px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3 border-b border-border">
        <div className="flex items-baseline justify-between">
          <h1 className="text-[22px] font-bold tracking-tight">{pool.name}</h1>
          <Link href="/regles" className="text-sm text-accent font-medium">
            Règles
          </Link>
        </div>
        {pendingCount > 0 && (
          <p className="text-[13px] text-warning font-medium mt-0.5">
            {pendingCount} match{pendingCount > 1 ? "s" : ""} à pronostiquer
          </p>
        )}
      </header>

      <div className="px-4 py-4 space-y-6">
        {matches.length === 0 && (
          <p className="text-center text-muted pt-16">
            Aucun match pour l'instant. L'organisateur peut les ajouter dans <b>Gérer</b>.
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
