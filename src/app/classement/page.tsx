import { createClient } from "@/lib/supabase/server";
import { getCurrentPool, getLeaderboard, getPlayerReactions } from "@/lib/queries";
import { computeStandings, type MatchForStanding } from "@/lib/standings";
import { ClassementView, type LbRow } from "@/components/ClassementView";
import { ShareButton } from "@/components/ShareButton";

export const dynamic = "force-dynamic";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function ClassementPage() {
  const pool = await getCurrentPool();
  if (!pool) {
    return <div className="px-6 pt-24 text-center text-muted">Rejoins un groupe pour voir le classement.</div>;
  }

  const supabase = await createClient();
  const [players, { data: matchRows }, reactions] = await Promise.all([
    getLeaderboard(pool.id) as Promise<LbRow[]>,
    supabase
      .from("matches")
      .select("group_label, team_a, team_a_code, team_b, team_b_code, score_a, score_b, status")
      .eq("pool_id", pool.id),
    getPlayerReactions(pool.id, pool.user_id as string),
  ]);

  const standings = computeStandings((matchRows ?? []) as MatchForStanding[]);

  const shareText =
    `🏆 ${pool.name} — La Grille\n` +
    players
      .slice(0, 5)
      .map((r, i) => `${MEDALS[i] ?? `${i + 1}.`} ${r.display_name} — ${r.total_points} pts`)
      .join("\n") +
    `\nRejoins-nous 👇`;

  return (
    <>
      <header className="app-header sticky top-0 z-30 px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-bold tracking-tight">Classement</h1>
          {players.length > 0 && <ShareButton text={shareText} />}
        </div>
        <p className="text-[13px] text-muted">
          {players.length} joueur{players.length > 1 ? "s" : ""}
        </p>
      </header>

      <ClassementView
        players={players}
        standings={standings}
        me={pool.user_id as string}
        poolId={pool.id as string}
        reactions={reactions}
      />
    </>
  );
}
