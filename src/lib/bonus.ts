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

/** Distance d'édition (Levenshtein) entre deux chaînes. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/**
 * Comparaison TOLÉRANTE pour les noms (meilleur buteur) : on accepte une faute
 * d'orthographe. Vrai si égalité, inclusion (« Mbappé » dans « Kylian Mbappé »),
 * ou un mot suffisamment proche (distance d'édition ≈ 1 faute par ~3 lettres).
 */
export function looseMatch(a: string, b: string): boolean {
  const na = normalizeAns(a);
  const nb = normalizeAns(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const ta = na.split(" ").filter((t) => t.length >= 3);
  const tb = nb.split(" ").filter((t) => t.length >= 3);
  for (const x of ta) {
    for (const y of tb) {
      const tol = Math.max(1, Math.round(Math.max(x.length, y.length) * 0.34));
      if (levenshtein(x, y) <= tol) return true;
    }
  }
  return false;
}
