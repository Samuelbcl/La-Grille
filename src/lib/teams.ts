/**
 * Couleurs par sélection nationale (pour le fond des avatars « aux couleurs de
 * ton équipe »). `code` = code drapeau (flagcdn) déjà utilisé dans l'app.
 * `from`/`to` = dégradé du fond.
 */
export type TeamColor = { code: string; name: string; from: string; to: string };

export const TEAMS: TeamColor[] = [
  { code: "za", name: "Afrique du Sud", from: "#007749", to: "#ffb612" },
  { code: "dz", name: "Algérie", from: "#006233", to: "#d21034" },
  { code: "de", name: "Allemagne", from: "#1b1b1b", to: "#dd0000" },
  { code: "gb-eng", name: "Angleterre", from: "#cf142b", to: "#9e0f20" },
  { code: "sa", name: "Arabie saoudite", from: "#006c35", to: "#004d26" },
  { code: "ar", name: "Argentine", from: "#74acdf", to: "#3f74a8" },
  { code: "au", name: "Australie", from: "#00843d", to: "#ffcd00" },
  { code: "at", name: "Autriche", from: "#ed2939", to: "#a01f2a" },
  { code: "be", name: "Belgique", from: "#2b2b2b", to: "#f3c100" },
  { code: "ba", name: "Bosnie-Herzégovine", from: "#002395", to: "#f7d417" },
  { code: "br", name: "Brésil", from: "#009b3a", to: "#fede00" },
  { code: "ca", name: "Canada", from: "#d52b1e", to: "#9e2016" },
  { code: "cv", name: "Cap-Vert", from: "#003893", to: "#cf2027" },
  { code: "co", name: "Colombie", from: "#fcd116", to: "#003893" },
  { code: "kr", name: "Corée du Sud", from: "#cd2e3a", to: "#0047a0" },
  { code: "ci", name: "Côte d'Ivoire", from: "#f77f00", to: "#009e60" },
  { code: "hr", name: "Croatie", from: "#e6002e", to: "#b80025" },
  { code: "cw", name: "Curaçao", from: "#002b7f", to: "#f9e814" },
  { code: "gb-sct", name: "Écosse", from: "#005eb8", to: "#00386e" },
  { code: "eg", name: "Égypte", from: "#ce1126", to: "#1b1b1b" },
  { code: "ec", name: "Équateur", from: "#ffd100", to: "#003893" },
  { code: "es", name: "Espagne", from: "#aa151b", to: "#f1bf00" },
  { code: "us", name: "États-Unis", from: "#3c3b6e", to: "#b22234" },
  { code: "fr", name: "France", from: "#0055a4", to: "#002654" },
  { code: "gh", name: "Ghana", from: "#ce1126", to: "#006b3f" },
  { code: "ht", name: "Haïti", from: "#00209f", to: "#d21034" },
  { code: "iq", name: "Irak", from: "#ce1126", to: "#007a3d" },
  { code: "ir", name: "Iran", from: "#239f40", to: "#da0000" },
  { code: "jp", name: "Japon", from: "#bc002d", to: "#7a0020" },
  { code: "jo", name: "Jordanie", from: "#1b1b1b", to: "#ce1126" },
  { code: "ma", name: "Maroc", from: "#c1272d", to: "#006233" },
  { code: "mx", name: "Mexique", from: "#006847", to: "#ce1126" },
  { code: "no", name: "Norvège", from: "#ef2b2d", to: "#002868" },
  { code: "nz", name: "Nouvelle-Zélande", from: "#1b1b1b", to: "#00247d" },
  { code: "uz", name: "Ouzbékistan", from: "#0099b5", to: "#1eb53a" },
  { code: "pa", name: "Panama", from: "#005293", to: "#d21034" },
  { code: "py", name: "Paraguay", from: "#d52b1e", to: "#0038a8" },
  { code: "nl", name: "Pays-Bas", from: "#ff6200", to: "#c1440e" },
  { code: "pt", name: "Portugal", from: "#da291c", to: "#006600" },
  { code: "qa", name: "Qatar", from: "#8a1538", to: "#5c0e26" },
  { code: "cd", name: "RD Congo", from: "#007fff", to: "#f7d518" },
  { code: "sn", name: "Sénégal", from: "#00853f", to: "#fde21a" },
  { code: "se", name: "Suède", from: "#005293", to: "#fecb00" },
  { code: "ch", name: "Suisse", from: "#d52b1e", to: "#9e2016" },
  { code: "cz", name: "Tchéquie", from: "#11457e", to: "#d7141a" },
  { code: "tn", name: "Tunisie", from: "#e70013", to: "#a3000d" },
  { code: "tr", name: "Turquie", from: "#e30a17", to: "#a3000d" },
  { code: "uy", name: "Uruguay", from: "#5b92e5", to: "#2b5797" },
];

const BY_CODE: Record<string, TeamColor> = Object.fromEntries(TEAMS.map((t) => [t.code, t]));

export function teamByCode(code?: string | null): TeamColor | null {
  return code ? BY_CODE[code] ?? null : null;
}

// Reflet blanc en haut à gauche, commun à tous les avatars.
const HIGHLIGHT = "radial-gradient(circle at 30% 18%, rgba(255,255,255,0.22), transparent 60%)";
// Bleu « Coupe du Monde » par défaut (si aucune équipe choisie).
const DEFAULT_BG = "linear-gradient(145deg, #0a1f4d 0%, #1565e6 100%)";

/** Fond dégradé de l'avatar : couleurs de l'équipe choisie, sinon bleu par défaut. */
export function teamBackground(code?: string | null): string {
  const t = teamByCode(code);
  return t ? `${HIGHLIGHT}, linear-gradient(145deg, ${t.from} 0%, ${t.to} 100%)` : `${HIGHLIGHT}, ${DEFAULT_BG}`;
}
