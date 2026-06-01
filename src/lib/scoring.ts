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
