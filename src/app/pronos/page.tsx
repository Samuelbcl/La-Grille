import Link from "next/link";
import { getCurrentPool, getMatchesWithPredictions, getUserBonus } from "@/lib/queries";
import { MatchCard } from "@/components/MatchCard";
import { JOKERS_MAX } from "@/lib/scoring";
import { BONUS, BONUS_TOTAL, bonusLocked } from "@/lib/bonus";
import { dayKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PronosPage() {
  const pool = await getCurrentPool();

  if (!pool) {
    return (
      <>
        <header className="app-header sticky top-0 z-30 px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3">
          <h1 className="text-[22px] font-bold tracking-tight">Pronos</h1>
        </header>
        <p className="px-6 pt-16 text-center text-muted">
          Rejoins un groupe depuis l&apos;onglet <b>Groupe</b> pour commencer à pronostiquer.
        </p>
      </>
    );
  }

  const matches = await getMatchesWithPredictions(pool.id, pool.user_id);
  const now = Date.now();
  const upcoming = matches.filter((m) => new Date(m.kickoff).getTime() > now);
  const pending = upcoming.filter((m) => m.pred_a == null).length;
  const jokersLeft = JOKERS_MAX - matches.filter((m) => m.joker).length;
  const bonus = await getUserBonus(pool.id, pool.user_id);
  const bonusComplete = BONUS.every((b) => bonus.answers[b.key]);
  const bonusClosed = bonusLocked();
  const bonusLabel = bonusClosed
    ? "🔒 Clôturés"
    : bonusComplete
      ? "Répondu ✅ · modifiable jusqu'au 24/06"
      : `${BONUS_TOTAL} pts en jeu — à remplir avant le 24/06`;

  // Regroupe par jour (les matchs sont déjà triés par coup d'envoi).
  const days = new Map<string, typeof upcoming>();
  for (const m of upcoming) {
    const k = dayKey(m.kickoff);
    if (!days.has(k)) days.set(k, []);
    days.get(k)!.push(m);
  }

  return (
    <>
      <header className="app-header sticky top-0 z-30 px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-[22px] font-bold tracking-tight">Pronos</h1>
          <span className="shrink-0 text-[12px] font-semibold text-warning">
            🃏 {jokersLeft}/{JOKERS_MAX}
          </span>
        </div>
        <p className="text-[13px]">
          {pending > 0 ? (
            <span className="font-semibold text-warning">{pending} match{pending > 1 ? "s" : ""} à pronostiquer</span>
          ) : (
            <span className="text-muted">Tout est pronostiqué 🎉</span>
          )}
        </p>
      </header>

      <div className="px-4 py-4 space-y-6">
        <Link
          href="/bonus"
          className="flex items-center justify-between gap-2 rounded-2xl border border-accent bg-surface p-4 shadow-card active:scale-[0.99] transition"
        >
          <span className="min-w-0">
            <span className="block font-semibold">🎯 Pronos bonus</span>
            <span className="block text-[12px] text-muted">{bonusLabel}</span>
          </span>
          <span className="shrink-0 text-accent font-medium">→</span>
        </Link>

        {upcoming.length === 0 ? (
          <p className="pt-12 text-center text-muted">Aucun match à venir pour le moment ⚽️</p>
        ) : (
          [...days.entries()].map(([day, list]) => (
            <section key={day}>
              <h2 className="px-1 mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
                {day}
              </h2>
              <div className="space-y-2.5">
                {list.map((m) => (
                  <MatchCard key={m.id} m={m} userId={pool.user_id} editable jokersLeft={jokersLeft} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
