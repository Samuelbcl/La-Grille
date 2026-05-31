// Génère src/data/matches.ts à partir du calendrier officiel CDM 2026
// (tirage du 5 déc. 2025). Données recoupées sur Wikipédia (page par groupe) +
// Yahoo Sports / DAZN / Sky Sports / ESPN. Heures converties en UTC.
//
//   node scripts/build-matches.mjs
//
// Trie les 72 matchs par coup d'envoi, attribue match_no 1→72, normalise les
// noms de stades, et écrit le fichier TypeScript prêt à l'emploi.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "data", "matches.ts");

// Compositions confirmées des 12 groupes (noms FR + code drapeau ISO alpha-2).
const GROUPS = {
  A: ["Mexique", "Afrique du Sud", "Corée du Sud", "Tchéquie"],
  B: ["Canada", "Bosnie-Herzégovine", "Qatar", "Suisse"],
  C: ["Brésil", "Maroc", "Haïti", "Écosse"],
  D: ["États-Unis", "Paraguay", "Australie", "Turquie"],
  E: ["Allemagne", "Curaçao", "Côte d'Ivoire", "Équateur"],
  F: ["Pays-Bas", "Japon", "Suède", "Tunisie"],
  G: ["Belgique", "Égypte", "Iran", "Nouvelle-Zélande"],
  H: ["Espagne", "Cap-Vert", "Arabie saoudite", "Uruguay"],
  I: ["France", "Sénégal", "Irak", "Norvège"],
  J: ["Argentine", "Algérie", "Autriche", "Jordanie"],
  K: ["Portugal", "RD Congo", "Ouzbékistan", "Colombie"],
  L: ["Angleterre", "Croatie", "Ghana", "Panama"],
};

// Stade -> libellé normalisé "Stade, Ville".
const VENUE = {
  azteca: "Estadio Azteca, Mexico",
  akron: "Estadio Akron, Guadalajara",
  bbva: "Estadio BBVA, Monterrey",
  mercedes: "Mercedes-Benz Stadium, Atlanta",
  bmo: "BMO Field, Toronto",
  levis: "Levi's Stadium, San Francisco",
  sofi: "SoFi Stadium, Los Angeles",
  bcplace: "BC Place, Vancouver",
  lumen: "Lumen Field, Seattle",
  metlife: "MetLife Stadium, New York/New Jersey",
  gillette: "Gillette Stadium, Boston",
  lincoln: "Lincoln Financial Field, Philadelphie",
  hardrock: "Hard Rock Stadium, Miami",
  nrg: "NRG Stadium, Houston",
  arrowhead: "Arrowhead Stadium, Kansas City",
  att: "AT&T Stadium, Dallas",
};

// code drapeau par équipe (déduit, vérifié à la main).
const CODE = {
  Mexique: "mx", "Afrique du Sud": "za", "Corée du Sud": "kr", Tchéquie: "cz",
  Canada: "ca", "Bosnie-Herzégovine": "ba", Qatar: "qa", Suisse: "ch",
  Brésil: "br", Maroc: "ma", Haïti: "ht", Écosse: "gb",
  "États-Unis": "us", Paraguay: "py", Australie: "au", Turquie: "tr",
  Allemagne: "de", Curaçao: "cw", "Côte d'Ivoire": "ci", Équateur: "ec",
  "Pays-Bas": "nl", Japon: "jp", Suède: "se", Tunisie: "tn",
  Belgique: "be", Égypte: "eg", Iran: "ir", "Nouvelle-Zélande": "nz",
  Espagne: "es", "Cap-Vert": "cv", "Arabie saoudite": "sa", Uruguay: "uy",
  France: "fr", Sénégal: "sn", Irak: "iq", Norvège: "no",
  Argentine: "ar", Algérie: "dz", Autriche: "at", Jordanie: "jo",
  Portugal: "pt", "RD Congo": "cd", Ouzbékistan: "uz", Colombie: "co",
  Angleterre: "gb", Croatie: "hr", Ghana: "gh", Panama: "pa",
};

// Les 72 matchs : [groupe, kickoff UTC, clé stade, équipe A, équipe B].
const RAW = [
  // Groupe A
  ["A", "2026-06-11T19:00:00Z", "azteca", "Mexique", "Afrique du Sud"],
  ["A", "2026-06-12T02:00:00Z", "akron", "Corée du Sud", "Tchéquie"],
  ["A", "2026-06-18T16:00:00Z", "mercedes", "Tchéquie", "Afrique du Sud"],
  ["A", "2026-06-19T01:00:00Z", "akron", "Mexique", "Corée du Sud"],
  ["A", "2026-06-25T01:00:00Z", "azteca", "Tchéquie", "Mexique"],
  ["A", "2026-06-25T01:00:00Z", "bbva", "Afrique du Sud", "Corée du Sud"],
  // Groupe B
  ["B", "2026-06-12T19:00:00Z", "bmo", "Canada", "Bosnie-Herzégovine"],
  ["B", "2026-06-13T19:00:00Z", "levis", "Qatar", "Suisse"],
  ["B", "2026-06-18T19:00:00Z", "sofi", "Suisse", "Bosnie-Herzégovine"],
  ["B", "2026-06-18T22:00:00Z", "bcplace", "Canada", "Qatar"],
  ["B", "2026-06-24T19:00:00Z", "bcplace", "Suisse", "Canada"],
  ["B", "2026-06-24T19:00:00Z", "lumen", "Bosnie-Herzégovine", "Qatar"],
  // Groupe C
  ["C", "2026-06-13T22:00:00Z", "metlife", "Brésil", "Maroc"],
  ["C", "2026-06-14T01:00:00Z", "gillette", "Haïti", "Écosse"],
  ["C", "2026-06-19T22:00:00Z", "gillette", "Écosse", "Maroc"],
  ["C", "2026-06-20T00:30:00Z", "lincoln", "Brésil", "Haïti"],
  ["C", "2026-06-24T22:00:00Z", "hardrock", "Écosse", "Brésil"],
  ["C", "2026-06-24T22:00:00Z", "mercedes", "Maroc", "Haïti"],
  // Groupe D
  ["D", "2026-06-13T01:00:00Z", "sofi", "États-Unis", "Paraguay"],
  ["D", "2026-06-14T04:00:00Z", "bcplace", "Australie", "Turquie"],
  ["D", "2026-06-19T19:00:00Z", "lumen", "États-Unis", "Australie"],
  ["D", "2026-06-20T03:00:00Z", "levis", "Turquie", "Paraguay"],
  ["D", "2026-06-26T02:00:00Z", "sofi", "Turquie", "États-Unis"],
  ["D", "2026-06-26T02:00:00Z", "levis", "Paraguay", "Australie"],
  // Groupe E
  ["E", "2026-06-14T17:00:00Z", "nrg", "Allemagne", "Curaçao"],
  ["E", "2026-06-14T23:00:00Z", "lincoln", "Côte d'Ivoire", "Équateur"],
  ["E", "2026-06-20T20:00:00Z", "bmo", "Allemagne", "Côte d'Ivoire"],
  ["E", "2026-06-21T00:00:00Z", "arrowhead", "Équateur", "Curaçao"],
  ["E", "2026-06-25T20:00:00Z", "lincoln", "Curaçao", "Côte d'Ivoire"],
  ["E", "2026-06-25T20:00:00Z", "metlife", "Équateur", "Allemagne"],
  // Groupe F
  ["F", "2026-06-14T20:00:00Z", "att", "Pays-Bas", "Japon"],
  ["F", "2026-06-15T02:00:00Z", "bbva", "Suède", "Tunisie"],
  ["F", "2026-06-20T17:00:00Z", "nrg", "Pays-Bas", "Suède"],
  ["F", "2026-06-21T04:00:00Z", "bbva", "Tunisie", "Japon"],
  ["F", "2026-06-25T23:00:00Z", "att", "Japon", "Suède"],
  ["F", "2026-06-25T23:00:00Z", "arrowhead", "Tunisie", "Pays-Bas"],
  // Groupe G
  ["G", "2026-06-15T19:00:00Z", "lumen", "Belgique", "Égypte"],
  ["G", "2026-06-16T01:00:00Z", "sofi", "Iran", "Nouvelle-Zélande"],
  ["G", "2026-06-21T19:00:00Z", "sofi", "Belgique", "Iran"],
  ["G", "2026-06-22T01:00:00Z", "bcplace", "Nouvelle-Zélande", "Égypte"],
  ["G", "2026-06-27T03:00:00Z", "lumen", "Égypte", "Iran"],
  ["G", "2026-06-27T03:00:00Z", "bcplace", "Nouvelle-Zélande", "Belgique"],
  // Groupe H
  ["H", "2026-06-15T16:00:00Z", "mercedes", "Espagne", "Cap-Vert"],
  ["H", "2026-06-15T22:00:00Z", "hardrock", "Arabie saoudite", "Uruguay"],
  ["H", "2026-06-21T16:00:00Z", "mercedes", "Espagne", "Arabie saoudite"],
  ["H", "2026-06-21T22:00:00Z", "hardrock", "Uruguay", "Cap-Vert"],
  ["H", "2026-06-27T00:00:00Z", "nrg", "Cap-Vert", "Arabie saoudite"],
  ["H", "2026-06-27T00:00:00Z", "akron", "Uruguay", "Espagne"],
  // Groupe I
  ["I", "2026-06-16T19:00:00Z", "metlife", "France", "Sénégal"],
  ["I", "2026-06-16T22:00:00Z", "gillette", "Irak", "Norvège"],
  ["I", "2026-06-22T21:00:00Z", "lincoln", "France", "Irak"],
  ["I", "2026-06-23T00:00:00Z", "metlife", "Norvège", "Sénégal"],
  ["I", "2026-06-26T19:00:00Z", "gillette", "Norvège", "France"],
  ["I", "2026-06-26T19:00:00Z", "bmo", "Sénégal", "Irak"],
  // Groupe J
  ["J", "2026-06-17T01:00:00Z", "arrowhead", "Argentine", "Algérie"],
  ["J", "2026-06-17T04:00:00Z", "levis", "Autriche", "Jordanie"],
  ["J", "2026-06-22T17:00:00Z", "att", "Argentine", "Autriche"],
  ["J", "2026-06-23T03:00:00Z", "levis", "Jordanie", "Algérie"],
  ["J", "2026-06-28T02:00:00Z", "att", "Jordanie", "Argentine"],
  ["J", "2026-06-28T02:00:00Z", "arrowhead", "Algérie", "Autriche"],
  // Groupe K
  ["K", "2026-06-17T17:00:00Z", "nrg", "Portugal", "RD Congo"],
  ["K", "2026-06-18T02:00:00Z", "azteca", "Ouzbékistan", "Colombie"],
  ["K", "2026-06-23T17:00:00Z", "nrg", "Portugal", "Ouzbékistan"],
  ["K", "2026-06-24T02:00:00Z", "akron", "Colombie", "RD Congo"],
  ["K", "2026-06-27T23:30:00Z", "hardrock", "Colombie", "Portugal"],
  ["K", "2026-06-27T23:30:00Z", "mercedes", "RD Congo", "Ouzbékistan"],
  // Groupe L
  ["L", "2026-06-17T20:00:00Z", "att", "Angleterre", "Croatie"],
  ["L", "2026-06-17T23:00:00Z", "bmo", "Ghana", "Panama"],
  ["L", "2026-06-23T20:00:00Z", "gillette", "Angleterre", "Ghana"],
  ["L", "2026-06-23T23:00:00Z", "bmo", "Panama", "Croatie"],
  ["L", "2026-06-27T21:00:00Z", "metlife", "Panama", "Angleterre"],
  ["L", "2026-06-27T21:00:00Z", "lincoln", "Croatie", "Ghana"],
];

// Validation : 72 matchs, chaque groupe = 6 matchs = toutes les paires, chaque équipe 3 matchs.
function validate() {
  const errs = [];
  if (RAW.length !== 72) errs.push(`Total = ${RAW.length}, attendu 72`);
  for (const [g, teams] of Object.entries(GROUPS)) {
    const ms = RAW.filter((m) => m[0] === g);
    if (ms.length !== 6) errs.push(`Groupe ${g} = ${ms.length} matchs (attendu 6)`);
    const count = Object.fromEntries(teams.map((t) => [t, 0]));
    for (const m of ms) {
      for (const t of [m[3], m[4]]) {
        if (!(t in count)) errs.push(`Groupe ${g}: équipe inconnue "${t}"`);
        else count[t]++;
      }
    }
    for (const [t, c] of Object.entries(count))
      if (c !== 3) errs.push(`Groupe ${g}: ${t} joue ${c} matchs (attendu 3)`);
  }
  for (const m of RAW) {
    for (const t of [m[3], m[4]]) if (!CODE[t]) errs.push(`Pas de code drapeau pour "${t}"`);
    if (!VENUE[m[2]]) errs.push(`Stade inconnu "${m[2]}"`);
  }
  if (errs.length) {
    console.error("❌ Validation échouée :\n" + errs.join("\n"));
    process.exit(1);
  }
  console.log("✓ Validation OK : 72 matchs, 12 groupes complets, chaque équipe joue 3 fois.");
}

validate();

// Tri chronologique (puis groupe, puis équipe A) -> match_no 1..72.
const sorted = [...RAW].sort((x, y) =>
  x[1] < y[1] ? -1 : x[1] > y[1] ? 1 : x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : x[3] < y[3] ? -1 : 1
);

const q = (s) => JSON.stringify(s); // gère accents et apostrophes proprement

const entries = sorted
  .map(([g, kickoff, venueKey, a, b], i) => {
    return `  {
    match_no: ${i + 1},
    stage: "group",
    group_label: ${q(g)},
    kickoff: ${q(kickoff)},
    venue: ${q(VENUE[venueKey])},
    team_a: ${q(a)},
    team_a_code: ${q(CODE[a])},
    team_b: ${q(b)},
    team_b_code: ${q(CODE[b])},
  },`;
  })
  .join("\n");

const groupsLiteral = Object.entries(GROUPS)
  .map(([g, teams]) => `  ${g}: [${teams.map(q).join(", ")}],`)
  .join("\n");

const file = `/**
 * Données des matchs de la Coupe du Monde 2026 — PHASE DE POULES (72 matchs).
 *
 * Format 2026 : 48 équipes, 12 groupes (A→L) de 4, 72 matchs de poule.
 * Compétition du 11 juin au 19 juillet 2026 (USA / Canada / Mexique).
 *
 * Source : tirage au sort officiel du 5 décembre 2025, calendrier recoupé sur
 * Wikipédia (page par groupe) + Yahoo Sports / DAZN / Sky Sports / ESPN.
 * Les HORAIRES sont en UTC. Points de vigilance pris en compte :
 *   • le Mexique n'applique pas l'heure d'été (CST = UTC-6 toute l'année) ;
 *   • l'AT&T Stadium (Dallas) est en zone Centre (CDT = UTC-5) ;
 *   • certains coups d'envoi nocturnes basculent au lendemain en UTC.
 * Penser à les revérifier sur https://www.fifa.com/fr avant la compétition.
 *
 * ⚠️ Fichier GÉNÉRÉ par scripts/build-matches.mjs — ne pas éditer à la main :
 *    modifie le script puis relance \`node scripts/build-matches.mjs\`.
 *
 * La phase à élimination directe (Round of 32, etc.) n'est pas encore incluse :
 * les équipes ne seront connues qu'à la fin des poules.
 */

export type Stage = "group" | "r32" | "r16" | "qf" | "sf" | "final";

export interface SeedMatch {
  match_no: number;
  stage: Stage;
  group_label: string | null;
  kickoff: string; // ISO 8601, UTC
  venue: string;
  team_a: string;
  team_a_code: string | null; // code drapeau ISO alpha-2, ex: "fr"
  team_b: string;
  team_b_code: string | null;
}

/** Les 12 groupes (compositions issues du tirage du 5 décembre 2025). */
export const GROUPS: Record<string, string[]> = {
${groupsLiteral}
};

/** Les 72 matchs de poule, triés par coup d'envoi (match_no 1 = match d'ouverture). */
export const SEED_MATCHES: SeedMatch[] = [
${entries}
];
`;

writeFileSync(OUT, file);
console.log(`✓ ${OUT} écrit (${sorted.length} matchs).`);
