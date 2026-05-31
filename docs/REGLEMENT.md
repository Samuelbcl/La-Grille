# Règlement du Concours de Pronostics — « La Grille »

> Règles officielles du concours (transmises par l'organisateur historique).
> Elles sont implémentées dans `supabase/schema.sql` (fonction `compute_points`)
> et reflétées côté app dans `src/lib/scoring.ts`.

## Principe

Chaque participant verse une **mise identique**. Le participant ayant le **plus de
points** à la fin de la compétition remporte **l'intégralité de la cagnotte**.

## Barème des points

| Phase | Score exact | Bon vainqueur |
|---|---|---|
| Phase de groupes | 5 pts | 2 pts |
| 16es de finale | 6 pts | 3 pts |
| 8es de finale | 8 pts | 4 pts |
| Quarts de finale | 12 pts | 6 pts |
| Demi-finales | 18 pts | 9 pts |
| Finale | 30 pts | 15 pts |

- **Score exact** : le score pronostiqué correspond exactement au résultat réel.
- **Bon vainqueur** : le bon résultat (victoire / nul / défaite) mais avec un score faux.

## Règles complémentaires

- 🎁 **Bonus +1** : si *un seul* des deux scores d'équipe est correct.
  Le calcul retient toujours le **meilleur cas** : score exact > bon vainqueur >
  +1 (un score correct) > 0. Le bonus ne s'applique donc que lorsqu'on a manqué
  le bon vainqueur mais deviné juste l'un des deux scores.
- ❌ **Match annulé / mauvaises équipes** : si le match pronostiqué n'a finalement
  pas lieu (mauvaises équipes qualifiées en phase finale), **aucun point** n'est attribué.
- ⏰ **Date limite** : tout pronostic doit être envoyé **avant le coup d'envoi** du
  match pour être pris en compte (verrouillage automatique dans l'app).
- 🤝 **Égalité finale** : en cas d'égalité au classement final, la cagnotte est
  **partagée** entre les participants concernés.

## Correspondance technique (phases)

| Phase | `stage` en base |
|---|---|
| Phase de groupes | `group` |
| 16es de finale | `r32` |
| 8es de finale | `r16` |
| Quarts de finale | `qf` |
| Demi-finales | `sf` |
| Finale | `final` |

> Note : seule la phase de groupes (72 matchs) est chargée pour l'instant. Les
> phases finales seront ajoutées une fois les qualifiés connus ; leur barème
> ci-dessus est déjà géré par `compute_points`.
