import { createClient } from "@/lib/supabase/server";
import { getCurrentPool, getLeaderboardWithBonus, getTodayRecap } from "@/lib/queries";
import { computeStandings, type MatchForStanding } from "@/lib/standings";
import { ClassementView, type LbRow } from "@/components/ClassementView";
import type { BracketMatch } from "@/components/BracketView";
import { ShareButton } from "@/components/ShareButton";

export const dynamic = "force-dynamic";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function ClassementPage() {
  const pool = await getCurrentPool();
  if (!pool) {
    return <div className="px-6 pt-24 text-center text-muted">Rejoins un groupe pour voir le classement.</div>;
  }

  const supabase = await createClient();
  const [players, { data: matchRows }, recap] = await Promise.all([
    getLeaderboardWithBonus(pool.id) as Promise<LbRow[]>,
    supabase
      .from("matches")
      .select("stage, match_no, group_label, team_a, team_a_code, team_b, team_b_code, score_a, score_b, status, kickoff, venue")
      .eq("pool_id", pool.id),
    getTodayRecap(pool.id),
  ]);

  const rows = matchRows ?? [];
  const standings = computeStandings(rows as MatchForStanding[]);
  const bracket = (rows as BracketMatch[]).filter((m) => m.stage && m.stage !== "group");

  // Évolution du jour : rang d'avant aujourd'hui (points - points du jour) vs rang actuel.
  const today = recap.pointsToday;
  const prevRank = new Map(
    [...players]
      .map((p) => ({ id: p.user_id, name: p.display_name, pts: p.total_points - (today[p.user_id]?.pts ?? 0) }))
      .sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name))
      .map((x, i) => [x.id, i] as const)
  );
  const deltas: Record<string, number> = {};
  players.forEach((p, i) => {
    deltas[p.user_id] = recap.count > 0 ? (prevRank.get(p.user_id) ?? i) - i : 0;
  });

  // Badges (cosmétiques) : leader · roi du score exact · meilleur du jour · lanterne rouge.
  const badges: Record<string, string[]> = {};
  const addBadge = (id: string, b: string) => {
    (badges[id] ??= []).push(b);
  };
  if (players[0]) addBadge(players[0].user_id, "leader");
  const exactKing = [...players].filter((p) => p.exact_count > 0).sort((a, b) => b.exact_count - a.exact_count)[0];
  if (exactKing) addBadge(exactKing.user_id, "exact");
  const dayBest = Object.entries(today)
    .filter(([, v]) => v.pts > 0)
    .sort((a, b) => b[1].pts - a[1].pts)[0];
  if (dayBest) addBadge(dayBest[0], "day");
  if (players.length > 2) addBadge(players[players.length - 1].user_id, "last");

  // Récap du jour : top 3 par points gagnés aujourd'hui.
  const recapTop = Object.entries(today)
    .map(([id, v]) => {
      const p = players.find((x) => x.user_id === id);
      return p ? { user_id: id, display_name: p.display_name, avatar_url: p.avatar_url, pts: v.pts } : null;
    })
    .filter((x): x is { user_id: string; display_name: string; avatar_url: string | null; pts: number } => !!x && x.pts > 0)
    .sort((a, b) => b.pts - a.pts || a.display_name.localeCompare(b.display_name));

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
        bracket={bracket}
        deltas={deltas}
        badges={badges}
        recap={{ count: recap.count, top: recapTop }}
      />
    </>
  );
}
