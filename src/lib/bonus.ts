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

/** Deadline des pronos bonus : mercredi 24 juin 20h59 (Paris) = 18h59 UTC (juste avant les matchs de 21h). */
export const BONUS_DEADLINE = "2026-06-24T18:59:00Z";

/**
 * Accès EXCEPTIONNEL après la deadline (ex : un pote qui a oublié de remplir).
 * Mettre son id utilisateur ici débloque le formulaire pour LUI SEUL.
 * ⚠️ À vider (et restaurer la policy RLS standard) une fois qu'il a rempli.
 */
export const BONUS_OVERRIDE: string[] = [];

/** Vrai si la deadline est passée (pronos bonus clôturés), sauf accès exceptionnel. */
export function bonusLocked(userId?: string | null): boolean {
  if (userId && BONUS_OVERRIDE.includes(userId)) return false;
  return Date.now() >= new Date(BONUS_DEADLINE).getTime();
}

/** Libellé lisible de la deadline (heure de Paris). */
export function bonusDeadlineLabel(): string {
  return new Date(BONUS_DEADLINE).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Date courte de la deadline (ex: "23/06"). */
export function bonusDeadlineShort(): string {
  return new Date(BONUS_DEADLINE).toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
  });
}

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
