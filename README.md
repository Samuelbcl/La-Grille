# ⚽️ La Grille

Application mobile (PWA) de **pronostics entre potes** pour la Coupe du Monde 2026.
Remplace le tableau Excel : interface épurée façon iOS, et surtout **classement
calculé automatiquement** dès qu'un résultat est saisi.

- **Stack** : Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth)
- **Format CDM 2026** : 48 équipes, 12 groupes (A→L), 72 matchs de poule, du 11 juin au 19 juillet.

---

## 🚀 Démarrage (10 min)

### 1. Installer les dépendances
```bash
npm install
```

### 2. Créer un projet Supabase
1. Va sur [supabase.com](https://supabase.com) → **New project** (gratuit).
2. Une fois créé : **SQL Editor** → **New query** → colle tout le contenu de
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**. Ça crée les tables, la
   sécurité (RLS), le calcul des points et le classement.
3. **Project Settings → API** : récupère `Project URL` et la clé `anon public`.

### 3. Configurer les variables d'environnement
```bash
cp .env.example .env.local
```
Puis remplis `.env.local` avec ton URL et ta clé anon.

### 4. Activer la connexion par e-mail
Dans Supabase : **Authentication → Providers → Email** → active **"Email"** et,
pour le dev, désactive *"Confirm email"* si tu veux tester plus vite (la connexion
se fait par lien magique).

### 5. Lancer
```bash
npm run dev
```
Ouvre [http://localhost:3000](http://localhost:3000).

---

## 📱 Première utilisation

1. **Connexion** : entre prénom + e-mail → tu reçois un lien magique.
2. Onglet **Gérer** → **Créer un pool** (tu deviens l'organisateur).
3. **Importer les matchs** (charge les fixtures pré-remplis de `src/data/matches.ts`).
4. Partage le **code d'invitation** à tes potes → ils rejoignent depuis *Gérer*.
5. Tout le monde **pronostique** depuis l'onglet *Matchs*.
6. Toi (organisateur) **saisis les vrais résultats** dans *Gérer* → le **classement
   se met à jour tout seul**.

---

## 🧮 Règles de points (barème par phase)

| Phase | Score exact | Bon vainqueur |
|---|---|---|
| Phase de groupes | **5** | **2** |
| 16es de finale | **6** | **3** |
| 8es de finale | **8** | **4** |
| Quarts de finale | **12** | **6** |
| Demi-finales | **18** | **9** |
| Finale | **30** | **15** |

- **+1 bonus** si un seul des deux scores d'équipe est correct (au mieux : exact > bon vainqueur > +1 > 0).
- Si le match pronostiqué n'a pas lieu (mauvaises équipes qualifiées) → 0 point.
- Égalité au classement final → cagnotte partagée.

Règlement complet : [`docs/REGLEMENT.md`](docs/REGLEMENT.md). La logique vit dans la
fonction SQL `compute_points()` + la vue `v_leaderboard` (voir `schema.sql`), avec un
miroir TypeScript dans [`src/lib/scoring.ts`](src/lib/scoring.ts).

---

## 🗂️ Structure

```
src/
├── app/                  écrans (App Router)
│   ├── page.tsx          accueil — matchs par jour
│   ├── match/[id]/       saisie d'un prono (sélecteur de score)
│   ├── classement/       classement automatique
│   ├── admin/            créer/rejoindre pool, importer matchs, saisir résultats, paiements
│   ├── login/            connexion par lien magique
│   └── regles/           règles
├── components/           MatchCard, ScorePicker, BottomNav, ui/
├── lib/
│   ├── supabase/         clients browser + server
│   ├── queries.ts        requêtes serveur
│   ├── scoring.ts        calcul des points (miroir du SQL)
│   └── utils.ts          drapeaux, dates, cn()
├── data/matches.ts       fixtures CDM 2026 (à compléter)
└── types/database.types.ts
supabase/schema.sql       LE schéma à exécuter dans Supabase
```

---

## 📅 Le calendrier (72 matchs de poule)

`src/data/matches.ts` contient désormais **les 72 matchs de la phase de poules**
(tirage officiel du 5 décembre 2025), triés par coup d'envoi, avec stades et
**horaires en UTC**. Le fichier est généré par [`scripts/build-matches.mjs`](scripts/build-matches.mjs) :
pour corriger une donnée, édite le script puis relance `node scripts/build-matches.mjs`
(il revalide que chaque groupe a 6 matchs et que chaque équipe en joue 3).
Ensuite, re-clique sur *Importer les matchs* dans l'admin — l'import est idempotent
grâce à la clé `(pool_id, match_no)`.

> Les horaires restent à **revérifier sur [fifa.com](https://www.fifa.com/fr)** juste
> avant la compétition (la FIFA peut ajuster quelques créneaux). La phase à élimination
> directe sera ajoutée une fois les qualifiés connus.

---

## 📦 Déploiement

Le plus simple : [Vercel](https://vercel.com) (gratuit, fait par les créateurs de
Next.js). Connecte le repo, ajoute les 2 variables d'env, deploy. Tes potes ouvrent
l'URL sur leur iPhone → **Partager → Sur l'écran d'accueil** = appli installée.

---

Voir [`CLAUDE.md`](CLAUDE.md) pour continuer le dev avec Claude Code.
