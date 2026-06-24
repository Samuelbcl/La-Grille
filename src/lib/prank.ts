/**
 * Blague d'intro : un GIF affiché UNE SEULE FOIS par appareil à l'ouverture de l'app.
 *
 * Workflow :
 *  1) enabled = false  → personne ne le voit. Toi seul peux le prévisualiser
 *     en ouvrant l'app avec « ?prank=1 » à la fin de l'URL (aperçu privé, rejouable).
 *  2) Quand tu valides → on passe enabled = true et on déploie : chaque pote le voit
 *     une fois à sa prochaine ouverture, puis plus jamais.
 *  3) Pour rejouer la blague plus tard → change `seenKey` (ex: -2026b).
 */
export const PRANK = {
  /** false = mode aperçu (personne ne le voit automatiquement). true = publié au groupe. */
  enabled: false,
  /** Clé localStorage « déjà vu ». La changer = rejouer la blague pour tout le monde. */
  seenKey: "lagrille:prank-ronaldo-2026",
  /** Fichier du GIF, à déposer dans public/. */
  gif: "/prank-ronaldo.gif",
  /** Petite vanne sous le GIF (laisse "" pour ne rien afficher). */
  caption: "😌 Calmez-vous.",
  /** Fermeture auto après X ms (0 = uniquement au tap). */
  autoCloseMs: 4500,
  /** Param d'URL pour l'aperçu privé : ouvre l'app avec ?prank=1 */
  previewParam: "prank",
};
