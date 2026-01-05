# Audit Cohérence Filament / React

Date: 2026-01-06  
Objectif: éviter doublons et confusion (CRUD système = Filament, usage quotidien = React).  
Règle: aucun changement de code.

## Vérification des redirections React → Filament

Écrans React redirigés vers `/admin`:
- `/users` → Filament Utilisateurs
- `/subjects` → Filament Matières
- `/school-years` → Filament Années scolaires
- `/classrooms` → Filament Salles
- `/assets` → Filament Inventaire
- `/staff` → Filament Enseignants
- `/settings` → Filament Paramètres

Statut: OK (déjà en place)  
Action: SKIP

## Conclusion
La séparation CRUD système (Filament) vs usage quotidien (React) est cohérente et déjà appliquée via redirections.
Contrôle d'accès harmonisé par permissions (Spatie) côté Filament et React.
