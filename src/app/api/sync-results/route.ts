import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Synchro auto des résultats : lit les matchs terminés du Mondial 2026 sur
 * football-data.org et écrit les scores dans la base (toutes les ligues/pools).
 * Appelé par un cron (GitHub Actions) avec l'en-tête Authorization: Bearer <CRON_SECRET>.
 *
 * Variables d'env nécessaires (côté serveur Vercel) :
 *   FOOTBALL_DATA_TOKEN          (token football-data.org)
 *   SUPABASE_SERVICE_ROLE_KEY    (clé service_role Supabase — écrit en contournant la RLS)
 *   CRON_SECRET                  (secret partagé avec le robot)
 *   NEXT_PUBLIC_SUPABASE_URL     (déjà présent)
 */

// Code FIFA (tla football-data.org) -> nom FR exact utilisé dans src/data/matches.ts
const TLA_FR: Record<string, string> = {
  ALG: "Algérie", ARG: "Argentine", AUS: "Australie", AUT: "Autriche", BEL: "Belgique",
  BIH: "Bosnie-Herzégovine", BRA: "Brésil", CAN: "Canada", CIV: "Côte d'Ivoire",
  COD: "RD Congo", COL: "Colombie", CPV: "Cap-Vert", CRO: "Croatie", CUW: "Curaçao",
  CZE: "Tchéquie", ECU: "Équateur", EGY: "Égypte", ENG: "Angleterre", ESP: "Espagne",
  FRA: "France", GER: "Allemagne", GHA: "Ghana", HAI: "Haïti", IRN: "Iran", IRQ: "Irak",
  JOR: "Jordanie", JPN: "Japon", KOR: "Corée du Sud", KSA: "Arabie saoudite", MAR: "Maroc",
  MEX: "Mexique", NED: "Pays-Bas", NOR: "Norvège", NZL: "Nouvelle-Zélande", PAN: "Panama",
  PAR: "Paraguay", POR: "Portugal", QAT: "Qatar", RSA: "Afrique du Sud", SCO: "Écosse",
  SEN: "Sénégal", SUI: "Suisse", SWE: "Suède", TUN: "Tunisie", TUR: "Turquie",
  URY: "Uruguay", USA: "États-Unis", UZB: "Ouzbékistan",
};

const pairKey = (x: string, y: string) => [x, y].sort().join("|");

export async function GET(request: Request) {
  // --- Auth (secret partagé) ---
  const secret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("secret") ??
    "";
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const token = process.env.FOOTBALL_DATA_TOKEN;
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !supaUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Config manquante : FOOTBALL_DATA_TOKEN / SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL" },
      { status: 500 }
    );
  }

  // --- 1) Tous les matchs du Mondial depuis football-data.org (l'API fait foi) ---
  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches",
    { headers: { "X-Auth-Token": token }, cache: "no-store" }
  );
  if (!res.ok) {
    return NextResponse.json({ error: `football-data.org a répondu ${res.status}` }, { status: 502 });
  }
  const data = await res.json();

  // --- 2) Index par paire d'équipes (phase de poules) : état + score ---
  const apiByPair = new Map<
    string,
    { home: string; away: string; finished: boolean; hs: number | null; as: number | null }
  >();
  for (const m of data.matches ?? []) {
    if (m.stage !== "GROUP_STAGE") continue;
    const home = TLA_FR[m.homeTeam?.tla];
    const away = TLA_FR[m.awayTeam?.tla];
    if (!home || !away) continue;
    const hs = m.score?.fullTime?.home;
    const as = m.score?.fullTime?.away;
    const isFinished = m.status === "FINISHED" && hs != null && as != null;
    apiByPair.set(pairKey(home, away), { home, away, finished: isFinished, hs, as });
  }

  // --- 3) Nos matchs de poule (tous pools confondus) ---
  const admin = createClient(supaUrl, serviceKey, { auth: { persistSession: false } });
  const { data: rows, error } = await admin
    .from("matches")
    .select("id, team_a, team_b, score_a, score_b, status")
    .eq("stage", "group");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // --- 4) Réconciliation : l'API fait foi (remplit OU réinitialise) ---
  let filled = 0;
  let reset = 0;
  for (const r of rows ?? []) {
    const result = apiByPair.get(pairKey(r.team_a, r.team_b));
    if (!result) continue;

    if (result.finished) {
      const scoreA = r.team_a === result.home ? result.hs : result.as;
      const scoreB = r.team_a === result.home ? result.as : result.hs;
      if (r.status === "finished" && r.score_a === scoreA && r.score_b === scoreB) continue; // déjà à jour
      const { error: upErr } = await admin
        .from("matches")
        .update({ score_a: scoreA, score_b: scoreB, status: "finished" })
        .eq("id", r.id);
      if (!upErr) filled++;
    } else if (r.status === "finished" || r.score_a !== null || r.score_b !== null) {
      // L'API dit que le match n'est pas (encore) joué → on annule un résultat erroné.
      const { error: upErr } = await admin
        .from("matches")
        .update({ score_a: null, score_b: null, status: "scheduled" })
        .eq("id", r.id);
      if (!upErr) reset++;
    }
  }

  return NextResponse.json({
    ok: true,
    resultatsApiFinis: [...apiByPair.values()].filter((v) => v.finished).length,
    nosMatchsPoule: rows?.length ?? 0,
    scoresRemplis: filled,
    matchsReinitialises: reset,
  });
}
