import { getCurrentPool, getLeaderboard } from "@/lib/queries";
import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

const medals = ["🥇", "🥈", "🥉"];

export default async function ClassementPage() {
  const pool = await getCurrentPool();
  if (!pool) {
    return <div className="px-6 pt-24 text-center text-muted">Rejoins un pool pour voir le classement.</div>;
  }

  const rows = await getLeaderboard(pool.id);
  const pot = (rows.length * pool.buy_in_cents) / 100;

  return (
    <>
      <header className="glass sticky top-0 z-30 px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3 border-b border-border">
        <h1 className="text-[22px] font-bold tracking-tight">Classement</h1>
        <p className="text-[13px] text-muted">
          {rows.length} joueur{rows.length > 1 ? "s" : ""} · cagnotte {pot} €
        </p>
      </header>

      <div className="px-4 py-4 space-y-2">
        {rows.length === 0 && (
          <div className="text-center text-muted pt-16">
            <Trophy className="mx-auto mb-3 text-muted" size={32} />
            Le classement s'affichera dès les premiers résultats.
          </div>
        )}
        {rows.map((r, i) => (
          <div
            key={r.user_id}
            className="flex items-center gap-3 rounded-2xl bg-surface border border-border shadow-card px-4 py-3"
          >
            <span className="w-7 text-center text-lg font-bold tabular-nums">
              {medals[i] ?? i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{r.display_name}</p>
              <p className="text-[12px] text-muted">
                {r.exact_count} exact{r.exact_count > 1 ? "s" : ""} · {r.correct_count} bon
                {r.correct_count > 1 ? "s" : ""} résultat{r.correct_count > 1 ? "s" : ""}
              </p>
            </div>
            <span className="text-xl font-bold tabular-nums">{r.total_points}</span>
            <span className="text-[11px] text-muted -ml-1">pts</span>
          </div>
        ))}
      </div>
    </>
  );
}
