# Règlement du Concours de Pronostics — « La Grille »

> Règles officielles du concours (transmises par l'organisateur historique).
> Elles sont implémentées dans `supabase/schema.sql` (fonction `compute_points`)
> et reflétées côté app dans `src/lib/scoring.ts`.

## Principe

Chaque participant verse une **mise identique**. Le participant ayant le **plus de
points** à la fin de la compétition remporte **l'intégralité de la cagnotte**.

## Barème des points (identique à toutes les phases, cumulatif)

| Pronostic | Points |
|---|---|
| **Bon vainqueur** (victoire / nul / défaite) | **+2** |
| **Score exact** (en plus du bon vainqueur) | **+5** |
| → un **score exact** rapporte donc | **7 pts** |
| Mauvais vainqueur, ou oubli de parier | **0** |

- **Bon vainqueur** : le bon résultat (1 / N / 2), même avec un score faux → **2 pts**.
- **Score exact** : le score pronostiqué correspond exactement → **5 pts en plus**, soit **7 pts** au total.
- **Mauvais vainqueur ET mauvais score** : **0 point**.
- **Pas de pronostic** (oubli) : **0 point**.

## Phase finale (matchs à élimination directe)

À partir des 16es de finale (y compris la **petite finale** pour la 3e place) :

- 🕒 **Le prono de score est jugé sur le résultat à 90 minutes** (temps réglementaire,
  arrêts de jeu inclus). **La prolongation et les tirs au but ne comptent PAS** pour
  le prono de score. Ex. : un match 1-1 à 90 min puis gagné en prolongation/tab reste
  un **1-1** pour le barème (donc « nul » au sens du bon vainqueur).
- 🎯 **Bonus « qui se qualifie ? » (+1)** : en plus du score, on choisit l'équipe que
  l'on voit **passer au tour suivant** (A ou B — jamais de nul). Si c'est la bonne
  (qualification réelle, **prolongation / tirs au but compris**) → **+1 point**.
  - Ce **+1 s'additionne** aux points de score. Ex. : score exact à 90 min **+** bon
    qualifié = **7 + 1 = 8**.
  - Il est **indépendant** du score : on peut prendre **0** au score (mauvais vainqueur
    à 90 min) **et** gagner le **+1** si l'équipe choisie se qualifie quand même.
  - À la **finale**, le +1 = avoir trouvé le **champion** ; à la **petite finale**, le
    vainqueur du match.

## Carte joker (×2)

- Chaque joueur dispose de **2 jokers** pour tout le tournoi. Un joker posé sur un match
  **double tous les points de ce match** — score **et** bonus « qui se qualifie » inclus
  (donc le +1 devient **+2**). Le joker se verrouille au coup d'envoi.

## Règles complémentaires

- ⏰ **Date limite** : tout pronostic (score **et** choix du qualifié) doit être envoyé
  **avant le coup d'envoi** du match (verrouillage automatique dans l'app).
- 🤝 **Égalité finale** : en cas d'égalité au classement final, ex æquo.

## Correspondance technique (phases)

| Phase | `stage` en base |
|---|---|
| Phase de groupes | `group` |
| 16es de finale | `r32` |
| 8es de finale | `r16` |
| Quarts de finale | `qf` |
| Demi-finales | `sf` |
| Petite finale (3e place) | `third` |
| Finale | `final` |

> Note : seule la phase de groupes (72 matchs) est chargée pour l'instant. Les
> phases finales seront ajoutées une fois les qualifiés connus ; leur barème
> ci-dessus est déjà géré par `compute_points`.
