# CLAUDE.md — Contexte projet pour Claude Code

> Lis ce fichier avant toute modification. Il décrit le projet, les conventions et
> la roadmap pour que tu (Claude Code) restes cohérent.

## 🎯 Le projet en une phrase
App mobile (PWA) de pronostics entre amis pour la Coupe du Monde 2026 : chacun mise
10 €, pronostique les scores, et le **classement se calcule tout seul**. Elle remplace
un vieux tableau Excel pénible à mettre à jour.

## 🧱 Stack & principes
- **Next.js 15** (App Router, Server Components par défaut, `"use client"` seulement si interactif).
- **TypeScript strict**, alias `@/*` → `src/*`.
- **Tailwind** avec variables CSS (voir `globals.css`) — esthétique **épurée façon iOS** :
  fond clair, un seul accent (bleu `--accent`), coins arrondis 2xl, ombres douces,
  beaucoup de blanc. **Sobriété > décoration.** Pas de dégradés criards.
- **Supabase** : Postgres + Auth (lien magique e-mail) + RLS. Toute la logique métier
  sensible (points, anti-triche) vit **dans la base** (`supabase/schema.sql`), pas dans le client.
- Mobile-first, largeur max `max-w-md`, navigation par `BottomNav`.

## 🔑 Modèle de données (voir supabase/schema.sql)
- `profiles` — 1 par user (créé auto par trigger à l'inscription).
- `pools` — une ligue de pronos (réutilisable chaque compétition). Contient le barème
  (`points_exact`, `points_outcome`) et le `join_code`.
- `pool_members` — qui est dans quel pool (`is_admin`, `has_paid`).
- `matches` — fixtures (liés à un pool). `score_a/score_b` = résultat réel (null = pas joué).
- `predictions` — pronos (unique par match+user).
- Vues : `v_prediction_scores` (points par prono) et `v_leaderboard` (classement agrégé).
- Fonction `compute_points(pred_a, pred_b, real_a, real_b, stage)` = barème **par phase**
  (groupes 5/2 · 16es 6/3 · 8es 8/4 · quarts 12/6 · demies 18/9 · finale 30/15), + **bonus +1**
  si un seul score correct (au mieux). Règlement complet : `docs/REGLEMENT.md`. Miroir TS : `src/lib/scoring.ts`.

## 🔒 Règles de sécurité déjà en place (RLS)
- On ne modifie son prono **qu'avant le coup d'envoi**.
- On ne voit le prono des autres **qu'après le coup d'envoi** (anti-triche).
- Seul un `is_admin` du pool peut écrire les résultats (`matches`).
Ne contourne jamais ces règles côté client.

## ✅ État actuel (MVP fonctionnel)
Connexion · création/adhésion d'un pool · import matchs · saisie pronos · saisie
résultats · classement auto · suivi des paiements.

## 🛣️ Roadmap suggérée (par ordre de valeur)
1. **Compléter `src/data/matches.ts`** avec les 72 matchs de poule (horaires officiels FIFA).
2. **Realtime** : abonner le classement (`supabase.channel`) pour qu'il bouge en live.
3. **Page "résultats de la journée"** + notif push (web-push) la veille des matchs non pronostiqués.
4. **Drapeaux en images** (lib `flag-icons`) au lieu des emojis pour un rendu plus net.
5. **Phase finale** : gérer les pronos sur les matchs à élimination directe (prolong./tirs au but ?).
6. **Multi-pool** propre (sélecteur de pool) — le schéma le supporte déjà.
7. **Bonus différence de buts** (+1) en option de barème.
8. Régénérer les types : `npm run db:types` après tout changement de schéma.

## 🧭 Conventions de code
- Français pour l'UI et les commentaires.
- Composants présentationnels dans `components/`, primitives dans `components/ui/`.
- Requêtes serveur centralisées dans `lib/queries.ts`.
- Pas de `localStorage` pour des données critiques — tout passe par Supabase.
- Garde les fichiers courts et lisibles ; préfère plusieurs petits composants.

## ⚠️ Pièges connus
- Les horaires des matchs dans `data/matches.ts` sont **à vérifier** (placeholders UTC).
- `react@19 rc` + `next@15` : si une lib tierce râle sur les peer deps, installe avec `--legacy-peer-deps`.
- En prod, pense à activer la confirmation d'e-mail dans Supabase.
