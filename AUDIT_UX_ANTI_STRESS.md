# Audit UX anti-erreur & anti-stress

Date: 2026-01-06  
Objectif: réduire les erreurs humaines, surtout en contexte réseau/matériel faibles.  
Règle: aucune modification de code, analyse uniquement.

## Résumé par formulaire

| Module | Champs obligatoires clairs | Valeurs par défaut intelligentes | Confirmation actions critiques | Statut | Action |
| --- | --- | --- | --- | --- | --- |
| Élèves (Filament) | Oui (required) | Partiel (school_id auto, user_id requis) | Oui (delete) | OK | SKIP |
| Élèves (React) | Partiel (modales) | Partiel | Oui (delete) | AMÉLIORABLE | PROPOSER |
| Classes (Filament) | Oui | Partiel | Oui (delete) | OK | SKIP |
| Classes (React) | Partiel | Partiel | Oui (delete) | AMÉLIORABLE | PROPOSER |
| Notes (Filament) | Oui | Partiel | Oui (delete) | OK | SKIP |
| Notes (React) | Partiel | Partiel | Oui (delete) | AMÉLIORABLE | PROPOSER |
| Absences (Filament) | Oui | Partiel (school_id) | Oui (delete) | OK | SKIP |
| Absences (React) | Oui (required) | Date par défaut | Oui (delete) | OK | SKIP |
| Paiements (Filament) | Oui | Partiel | Oui (delete) | OK | SKIP |
| Paiements (React) | Partiel | Partiel | Oui (delete) | AMÉLIORABLE | PROPOSER |
| Emplois du temps | Partiel | Partiel | Oui (delete) | AMÉLIORABLE | PROPOSER |
| Messages | Oui (compose) | N/A | Oui (delete) | OK | SKIP |
| Auth | Oui | N/A | N/A | OK | SKIP |

## Constats clés
- Les actions critiques ont déjà des confirmations (suppression) dans la majorité des modules.
- Les validations backend existent dans les contrôleurs Laravel (paiements, notes, absences), mais côté React certains champs ne sont pas toujours explicites.
- Les valeurs par défaut “intelligentes” sont partiellement présentes (school_id, date absence).

## Propositions (backend uniquement)
Sans nouveau workflow ni UI:
- Renforcer la validation backend avec messages simples (“Montant manquant”, “Année scolaire non sélectionnée”).
- Déduire automatiquement `school_id` et `academic_year_id` quand possible (déjà partiellement fait).
- Normaliser les messages d’erreur API pour éviter les codes techniques.
