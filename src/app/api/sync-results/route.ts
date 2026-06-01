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
  // --- Auth (secret partagé, en-tête Authorization uniquement) ---
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || provided !== secret) {
    console.error("[sync-results] tentative non autorisée", {
      ip: request.headers.get("x-forwarded-for") ?? "?",
    });
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

  // Étape (status) d'un match côté API : terminé / en cours / à venir.
  type St = "finished" | "live" | "scheduled";
  function apiState(m: { status?: string }, hs: number | null, as: number | null): St {
    if (m.status === "FINISHED" && hs != null && as != null) return "finished";
    if ((m.status === "IN_PLAY" || m.status === "PAUSED") && hs != null && as != null) return "live";
    return "scheduled";
  }

  // Phase finale : stage API -> notre code.
  const STAGE_MAP: Record<string, string> = {
    LAST_32: "r32",
    LAST_16: "r16",
    QUARTER_FINALS: "qf",
    SEMI_FINALS: "sf",
    FINAL: "final",
  };

  // --- 2) Index poules (par paire) + matchs de phase finale (équipes connues) ---
  const apiByPair = new Map<string, { home: string; away: string; st: St; hs: number | null; as: number | null }>();
  type Ko = { matchNo: number; stage: string; home: string; away: string; st: St; hs: number | null; as: number | null; kickoff: string; venue: string | null };
  const knockout: Ko[] = [];

  for (const m of data.matches ?? []) {
    const home = TLA_FR[m.homeTeam?.tla];
    const away = TLA_FR[m.awayTeam?.tla];
    const hs = m.score?.fullTime?.home ?? null;
    const as = m.score?.fullTime?.away ?? null;
    if (m.stage === "GROUP_STAGE") {
      if (!home || !away) continue;
      apiByPair.set(pairKey(home, away), { home, away, st: apiState(m, hs, as), hs, as });
    } else if (STAGE_MAP[m.stage] && home && away) {
      // matchs à élimination directe avec les DEUX équipes déterminées
      knockout.push({ matchNo: m.id, stage: STAGE_MAP[m.stage], home, away, st: apiState(m, hs, as), hs, as, kickoff: m.utcDate, venue: m.venue ?? null });
    }
  }

  // --- 3) Nos matchs de poule (tous pools confondus) ---
  const admin = createClient(supaUrl, serviceKey, { auth: { persistSession: false } });
  const { data: rows, error } = await admin
    .from("matches")
    .select("id, pool_id, team_a, team_a_code, team_b, team_b_code, score_a, score_b, status")
    .eq("stage", "group");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Code drapeau par équipe (réutilisé pour la phase finale) + liste des pools.
  const nameToCode = new Map<string, string | null>();
  const poolSet = new Set<string>();
  for (const r of rows ?? []) {
    poolSet.add(r.pool_id);
    if (!nameToCode.has(r.team_a)) nameToCode.set(r.team_a, r.team_a_code);
    if (!nameToCode.has(r.team_b)) nameToCode.set(r.team_b, r.team_b_code);
  }
  const poolIds = [...poolSet];

  // --- 4) Réconciliation des poules : l'API fait foi (terminé / en cours / à venir) ---
  let updated = 0;
  for (const r of rows ?? []) {
    const result = apiByPair.get(pairKey(r.team_a, r.team_b));
    if (!result) continue;
    let scoreA: number | null = null;
    let scoreB: number | null = null;
    let status = "scheduled";
    if (result.st === "finished" || result.st === "live") {
      scoreA = r.team_a === result.home ? result.hs : result.as;
      scoreB = r.team_a === result.home ? result.as : result.hs;
      status = result.st;
    }
    if (r.status === status && r.score_a === scoreA && r.score_b === scoreB) continue;
    const { error: upErr } = await admin
      .from("matches")
      .update({ score_a: scoreA, score_b: scoreB, status })
      .eq("id", r.id);
    if (!upErr) updated++;
  }

  // --- 5) Import auto de la phase finale (dès que les équipes sont connues) ---
  let koWritten = 0;
  for (const ko of knockout) {
    const finishedOrLive = ko.st === "finished" || ko.st === "live";
    for (const poolId of poolIds) {
      const { error: koErr } = await admin.from("matches").upsert(
        {
          pool_id: poolId,
          match_no: ko.matchNo,
          stage: ko.stage,
          group_label: null,
          kickoff: ko.kickoff,
          venue: ko.venue,
          team_a: ko.home,
          team_a_code: nameToCode.get(ko.home) ?? null,
          team_b: ko.away,
          team_b_code: nameToCode.get(ko.away) ?? null,
          score_a: finishedOrLive ? ko.hs : null,
          score_b: finishedOrLive ? ko.as : null,
          status: ko.st,
        },
        { onConflict: "pool_id,match_no" }
      );
      if (!koErr) koWritten++;
    }
  }

  return NextResponse.json({
    ok: true,
    pools: poolIds.length,
    poulesMisesAJour: updated,
    phaseFinaleDispo: knockout.length,
    phaseFinaleEcrite: koWritten,
  });
}
