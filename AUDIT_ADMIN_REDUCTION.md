# Audit Réduction Travail Administratif

Date: 2026-01-06  
Objectif: réduire la saisie manuelle sans nouveau workflow.  
Règle: aucun changement de code.

## Vérifications

| Point | État actuel | Statut | Action |
| --- | --- | --- | --- |
| Paiements → statut auto (payé/partiel/en retard) | Automatisé via modèle Paiement | OK | SKIP |
| Absences → par défaut “présent” | Non applicable (seules absences sont enregistrées) | OK | SKIP |
| Notes → moyenne auto | Non automatique (calcul ponctuel côté UI/API si besoin) | AMÉLIORABLE | PROPOSER (backend calc) |
| Classes → élèves liés automatiquement par année | Non automatique (via enrollments) | AMÉLIORABLE | PROPOSER (backend auto-link) |
| Assets → dépense auto | Automatisé via AssetService + FinanceService | OK | SKIP |

## Résumé
Paiements et assets ont déjà réduit la saisie manuelle via automatisations backend.  
Les optimisations restantes sont **backend-only** (déductions automatiques) pour limiter la saisie manuelle.
