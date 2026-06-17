import { createClient } from "@/lib/supabase/server";

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
