/**
 * Barème « La Grille » — miroir TypeScript de compute_points() SQL.
 *
 * Cumulatif, identique à toutes les phases :
 *   • Bon vainqueur (1/N/2)  : +2
 *   • Score exact (en plus)  : +5   → un score exact rapporte 7
 *   • Mauvais vainqueur / pas de prono : 0
 * (Règlement complet : docs/REGLEMENT.md)
 */
export const POINTS = { exact: 7, outcome: 2 };

/** Nombre de jokers (×2 sur un match) par joueur pour tout le tournoi. */
export const JOKERS_MAX = 2;

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);

export function computePoints(
  predA: number,
  predB: number,
  realA: number | null,
  realB: number | null
): number {
  if (realA === null || realB === null) return 0;
  if (predA === realA && predB === realB) return POINTS.exact;
  if (sign(predA - predB) === sign(realA - realB)) return POINTS.outcome;
  return 0;
}

/**
 * Bonus « équipe qualifiée » (matchs à élimination directe) : +1 si l'équipe
 * pronostiquée comme qualifiée ('a'|'b') est bien celle qui passe (prolongation
 * et tirs au but compris). Miroir du calcul SQL (vue v_prediction_scores).
 * NB : le ×2 du joker est appliqué par l'appelant, comme pour les points de score.
 */
export function qualifierBonus(
  predQualifier: string | null | undefined,
  realQualified: string | null | undefined
): number {
  if (!predQualifier || !realQualified) return 0;
  return predQualifier === realQualified ? 1 : 0;
}

/**
 * Score à AFFICHER pour un match (résultat réel : prolongation / tirs au but inclus)
 * + la mention adéquate. ⚠️ Les POINTS, eux, restent calculés sur score_a/score_b
 * (le score à 90 min). `reg` = rappel du score à 90 min quand il diffère du final.
 */
export function displayResult(m: {
  score_a: number | null;
  score_b: number | null;
  final_a?: number | null;
  final_b?: number | null;
  pens_a?: number | null;
  pens_b?: number | null;
}): { a: number | null; b: number | null; note: string | null; reg: string | null } {
  const hasFinal = m.final_a != null && m.final_b != null;
  const a = hasFinal ? m.final_a! : m.score_a;
  const b = hasFinal ? m.final_b! : m.score_b;
  const hasPens = m.pens_a != null && m.pens_b != null;
  const note = hasPens ? `t.a.b. ${m.pens_a}–${m.pens_b}` : hasFinal ? "a.p." : null;
  // Rappel du score à 90 min (base des points) dès qu'il y a eu prolongation ou tab.
  const reg = note ? `${m.score_a ?? "–"}–${m.score_b ?? "–"}` : null;
  return { a, b, note, reg };
}

export type PredictionOutcome = "exact" | "correct" | "wrong" | "pending";

export function outcomeOf(
  predA: number,
  predB: number,
  realA: number | null,
  realB: number | null
): PredictionOutcome {
  if (realA === null || realB === null) return "pending";
  if (predA === realA && predB === realB) return "exact";
  if (sign(predA - predB) === sign(realA - realB)) return "correct";
  return "wrong";
}
