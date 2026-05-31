/**
 * Barème « La Grille » — miroir TypeScript de la fonction SQL compute_points().
 * Sert à afficher les points côté client sans aller-retour serveur.
 *
 * Les points dépendent de la PHASE du match. Bonus +1 si un seul des deux scores
 * d'équipe est correct. On garde le meilleur cas : exact > bon vainqueur > +1 > 0.
 * (Règlement complet : docs/REGLEMENT.md)
 */
export type Stage = "group" | "r32" | "r16" | "qf" | "sf" | "final";

export interface Bareme {
  exact: number; // score exact
  outcome: number; // bon vainqueur (résultat juste, score faux)
}

/** Barème officiel par phase (score exact / bon vainqueur). */
export const BAREME: Record<string, Bareme> = {
  group: { exact: 5, outcome: 2 },
  r32: { exact: 6, outcome: 3 }, // 16es de finale
  r16: { exact: 8, outcome: 4 }, // 8es de finale
  qf: { exact: 12, outcome: 6 }, // quarts
  sf: { exact: 18, outcome: 9 }, // demi-finales
  final: { exact: 30, outcome: 15 },
};

export function stageBareme(stage: string | null | undefined): Bareme {
  return (stage ? BAREME[stage] : undefined) ?? BAREME.group;
}

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);

/** Points d'un prono (au mieux : exact > bon vainqueur > +1 si un score juste > 0). */
export function computePoints(
  predA: number,
  predB: number,
  realA: number | null,
  realB: number | null,
  stage: string = "group"
): number {
  if (realA === null || realB === null) return 0;
  const b = stageBareme(stage);
  if (predA === realA && predB === realB) return b.exact;
  if (sign(predA - predB) === sign(realA - realB)) return b.outcome;
  if (predA === realA || predB === realB) return 1; // un seul score correct
  return 0;
}

export type PredictionOutcome = "exact" | "correct" | "partial" | "wrong" | "pending";

export function outcomeOf(
  predA: number,
  predB: number,
  realA: number | null,
  realB: number | null
): PredictionOutcome {
  if (realA === null || realB === null) return "pending";
  if (predA === realA && predB === realB) return "exact";
  if (sign(predA - predB) === sign(realA - realB)) return "correct";
  if (predA === realA || predB === realB) return "partial";
  return "wrong";
}
