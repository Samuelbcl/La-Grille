/** Questions bonus de tournoi (gros points, attribués en phase finale). */
export type BonusKey = "winner" | "runnerup" | "topscorer";

export const BONUS: {
  key: BonusKey;
  label: string;
  hint: string;
  kind: "team" | "text";
  points: number;
}[] = [
  { key: "winner", label: "Vainqueur de la Coupe du Monde", hint: "L'équipe championne 🏆", kind: "team", points: 15 },
  { key: "runnerup", label: "Finaliste", hint: "L'équipe battue en finale", kind: "team", points: 8 },
  { key: "topscorer", label: "Meilleur buteur", hint: "Le Soulier d'Or du tournoi ⚽", kind: "text", points: 10 },
];

export const BONUS_TOTAL = BONUS.reduce((s, b) => s + b.points, 0);

/** Normalisation pour comparer les réponses (insensible casse/accents/espaces). */
export function normalizeAns(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
