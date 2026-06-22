import { createClient } from "@/lib/supabase/server";
import { BONUS, normalizeAns, looseMatch } from "@/lib/bonus";
import { computePoints } from "@/lib/scoring";
import { dayId, todayId } from "@/lib/utils";

/** Récupère le 1er pool dont l'utilisateur est membre (MVP = un seul pool). */
export async function getCurrentPool() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("pool_members")
    .select("pool_id, is_admin, pools(*)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Le typage des jointures Supabase est approximatif sans types générés :
  const row = data as unknown as
    | { is_admin: boolean; pools: Record<string, any> | null }
    | null;
  if (!row?.pools) return null;
  return { ...row.pools, is_admin: row.is_admin, user_id: user.id } as Record<
    string,
    any
  > & { id: string; name: string; buy_in_cents: number; is_admin: boolean; user_id: string };
}

/** Matchs d'un pool + le prono de l'utilisateur courant pour chacun. */
export async function getMatchesWithPredictions(poolId: string, userId: string) {
  const supabase = await createClient();

  // Les deux requêtes en parallèle (au lieu de l'une après l'autre) → 1 aller-retour gagné.
  const [{ data: matches }, { data: preds }] = await Promise.all([
    supabase.from("matches").select("*").eq("pool_id", poolId).order("kickoff", { ascending: true }),
    supabase.from("predictions").select("match_id, pred_a, pred_b, joker").eq("user_id", userId),
  ]);

  const byMatch = new Map((preds ?? []).map((p) => [p.match_id, p]));

  return (matches ?? []).map((m) => ({
    ...m,
    pred_a: byMatch.get(m.id)?.pred_a ?? null,
    pred_b: byMatch.get(m.id)?.pred_b ?? null,
    joker: byMatch.get(m.id)?.joker ?? false,
  }));
}

/** Classement trié. */
export async function getLeaderboard(poolId: string) {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("v_leaderboard")
      .select("*")
      .eq("pool_id", poolId)
      .order("total_points", { ascending: false })
      .order("exact_count", { ascending: false })
      .order("display_name", { ascending: true }); // départage stable
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error("[getLeaderboard]", err);
    return [];
  }
}

/** Équipes du tournoi (depuis les matchs de poule) — pour les questions bonus. */
export async function getTeams(poolId: string): Promise<{ code: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select("team_a, team_a_code, team_b, team_b_code")
    .eq("pool_id", poolId)
    .eq("stage", "group");
  const map = new Map<string, string>();
  for (const m of data ?? []) {
    if (m.team_a && !map.has(m.team_a)) map.set(m.team_a, m.team_a_code ?? "");
    if (m.team_b && !map.has(m.team_b)) map.set(m.team_b, m.team_b_code ?? "");
  }
  return [...map.entries()]
    .map(([name, code]) => ({ name, code }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** Réponses bonus de l'utilisateur + s'il a verrouillé. */
export async function getUserBonus(poolId: string, userId: string) {
  const supabase = await createClient();
  const [{ data: answers }, { data: member }] = await Promise.all([
    supabase.from("bonus_answers").select("question_key, answer").eq("pool_id", poolId).eq("user_id", userId),
    supabase.from("pool_members").select("bonus_validated").eq("pool_id", poolId).eq("user_id", userId).maybeSingle(),
  ]);
  const map: Record<string, string> = {};
  for (const a of answers ?? []) map[a.question_key] = a.answer;
  return { answers: map, validated: !!member?.bonus_validated };
}

/** Bonnes réponses bonus du pool (saisies par l'orga). */
export async function getBonusResults(poolId: string): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("bonus_results").select("question_key, answer").eq("pool_id", poolId);
  const map: Record<string, string> = {};
  for (const r of data ?? []) map[r.question_key] = r.answer;
  return map;
}

/** Points bonus par joueur (réponse == bonne réponse connue). */
async function getBonusPointsByUser(poolId: string): Promise<Record<string, number>> {
  const supabase = await createClient();
  const [{ data: answers }, { data: results }] = await Promise.all([
    supabase.from("bonus_answers").select("user_id, question_key, answer").eq("pool_id", poolId),
    supabase.from("bonus_results").select("question_key, answer").eq("pool_id", poolId),
  ]);
  const correctRaw = new Map((results ?? []).map((r) => [r.question_key, r.answer]));
  const qByKey = new Map(BONUS.map((b) => [b.key as string, b]));
  const pts: Record<string, number> = {};
  for (const a of answers ?? []) {
    const q = qByKey.get(a.question_key);
    const right = correctRaw.get(a.question_key);
    if (!q || right == null) continue;
    // Buteur : tolérant aux fautes ; équipes : code exact.
    const ok = q.kind === "text" ? looseMatch(a.answer, right) : normalizeAns(a.answer) === normalizeAns(right);
    if (ok) pts[a.user_id] = (pts[a.user_id] ?? 0) + q.points;
  }
  return pts;
}

/** Récap du jour : matchs du pool terminés AUJOURD'HUI + points gagnés par joueur. */
export async function getTodayRecap(poolId: string) {
  const supabase = await createClient();
  const today = todayId();
  const { data: matchRows } = await supabase
    .from("matches")
    .select("id, score_a, score_b, kickoff")
    .eq("pool_id", poolId)
    .eq("status", "finished");
  const todayMatches = (matchRows ?? []).filter((m) => dayId(m.kickoff) === today);
  const pointsToday: Record<string, { pts: number; exact: number }> = {};
  if (todayMatches.length === 0) return { count: 0, pointsToday };

  const ids = todayMatches.map((m) => m.id);
  const byMatch = new Map(todayMatches.map((m) => [m.id, m]));
  const { data: preds } = await supabase
    .from("predictions")
    .select("user_id, match_id, pred_a, pred_b, joker")
    .in("match_id", ids);
  for (const p of preds ?? []) {
    const m = byMatch.get(p.match_id);
    if (!m) continue;
    const pts = computePoints(p.pred_a, p.pred_b, m.score_a, m.score_b) * (p.joker ? 2 : 1);
    const e = (pointsToday[p.user_id] ??= { pts: 0, exact: 0 });
    e.pts += pts;
    if (m.score_a != null && p.pred_a === m.score_a && p.pred_b === m.score_b) e.exact++;
  }
  return { count: todayMatches.length, pointsToday };
}

/** Classement = points de matchs + points bonus, retrié. */
export async function getLeaderboardWithBonus(poolId: string) {
  const [rows, bonus] = await Promise.all([getLeaderboard(poolId), getBonusPointsByUser(poolId)]);
  return rows
    .map((r) => {
      const bp = bonus[r.user_id] ?? 0;
      return { ...r, bonus_points: bp, total_points: (r.total_points ?? 0) + bp };
    })
    .sort(
      (a, b) =>
        b.total_points - a.total_points ||
        b.exact_count - a.exact_count ||
        a.display_name.localeCompare(b.display_name)
    );
}
