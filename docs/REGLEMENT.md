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

## Règles complémentaires

- ⏰ **Date limite** : tout pronostic doit être envoyé **avant le coup d'envoi** du
  match (verrouillage automatique dans l'app).
- 🤝 **Égalité finale** : en cas d'égalité au classement final, ex æquo.

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
