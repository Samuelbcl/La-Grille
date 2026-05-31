import { getCurrentPool, getMatchesWithPredictions } from "@/lib/queries";
import { MatchCard } from "@/components/MatchCard";
import { isToday } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Header() {
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <header className="glass sticky top-0 z-30 px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3 border-b border-border">
      <h1 className="text-[22px] font-bold tracking-tight">Aujourd&apos;hui</h1>
      <p className="text-[13px] text-muted capitalize">{today}</p>
    </header>
  );
}

export default async function AujourdhuiPage() {
  const pool = await getCurrentPool();
  if (!pool) {
    return (
      <>
        <Header />
        <p className="px-6 pt-16 text-center text-muted">
          Rejoins un pool depuis l&apos;onglet <b>Gérer</b> pour voir tes matchs.
        </p>
      </>
    );
  }

  const matches = await getMatchesWithPredictions(pool.id, pool.user_id);
  const now = Date.now();
  const todayMatches = matches.filter((m) => isToday(m.kickoff));
  const toPredict = matches
    .filter((m) => new Date(m.kickoff).getTime() > now && m.pred_a == null)
    .slice(0, 8);
  const nothing = todayMatches.length === 0 && toPredict.length === 0;

  return (
    <>
      <Header />
      <div className="px-4 py-4 space-y-6">
        {nothing ? (
          <p className="pt-12 text-center text-muted">
            Aucun match à pronostiquer pour le moment ⚽️
          </p>
        ) : (
          <>
            {todayMatches.length > 0 && (
              <section>
                <h2 className="px-1 mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
                  Matchs du jour
                </h2>
                <div className="space-y-2.5">
                  {todayMatches.map((m) => (
                    <MatchCard key={m.id} m={m} userId={pool.user_id} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="px-1 mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
                À pronostiquer
              </h2>
              {toPredict.length > 0 ? (
                <div className="space-y-2.5">
                  {toPredict.map((m) => (
                    <MatchCard key={m.id} m={m} userId={pool.user_id} />
                  ))}
                </div>
              ) : (
                <p className="px-1 text-sm text-muted">Tout est pronostiqué, bravo ! 🎉</p>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
