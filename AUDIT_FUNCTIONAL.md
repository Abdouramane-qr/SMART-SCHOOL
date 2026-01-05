# Audit Fonctionnel Global (React + Filament + API)

Date: 2026-01-06  
Scope: React (app), Filament (admin), APIs Laravel  
Règles: aucun changement de code, focus UX/perf, contexte réseau instable.

## Synthèse par module

| Module | Actions manuelles répétitives | Dépendances humaines inutiles | Doublons React/Filament | Statut | Priorité |
| --- | --- | --- | --- | --- | --- |
| Élèves | Création unitaire, paiements saisis un par un, révision manuelle des statuts | Lien compte utilisateur si création via React (pas obligatoire) | Oui (React + Filament) | AMÉLIORABLE | Moyenne |
| Classes | Création/édition unitaire, affectations manuelles | Choix manuel année scolaire / classe | Oui (React + Filament) | AMÉLIORABLE | Moyenne |
| Notes | Saisie individuelle des notes, peu d’automatisation | Dépendance enseignants pour saisie exhaustive | Oui (React + Filament) | AMÉLIORABLE | Moyenne |
| Absences | Saisie individuelle, export manuel | Validation/justification manuelle | Oui (React + Filament) | AMÉLIORABLE | Moyenne |
| Paiements | Saisie unitaire, reçus générés manuellement | Contrôle humain pour cohérence status | Oui (React + Filament) | AMÉLIORABLE | Moyenne |
| Emplois du temps | Création unitaire des créneaux | Planification manuelle sans aide | React (principal) | AMÉLIORABLE | Basse |
| Messages | Envoi manuel, rafraîchissement par polling | Aucun blocage, dépendance utilisateur | React (principal) | OK | Basse |
| Dashboard | Multiples appels (stats, paiements, dépenses) | Aucun blocage, dépend des settings finance | React + Filament dashboard | AMÉLIORABLE | Basse |

## Observations clés
- Les modules “gestion” existent dans React et Filament: c’est logique si React = opérationnel, Filament = administratif.  
- Le risque principal est **la double saisie** (création dans React sans compte utilisateur associé).  
- Les flux sont globalement utilisables mais **très manuels** (saisies unitaires), ce qui peut être lourd en contexte réseau instable.

## Recommandations (sans implémentation)
- Clarifier l’ownership: créer dans Filament pour tout ce qui touche aux comptes, React pour l’usage quotidien.  
- Prévoir des outils d’import/batch quand la migration sera terminée.  
- Limiter les appels répétés côté dashboard en réseau faible (cache côté API déjà présent).
