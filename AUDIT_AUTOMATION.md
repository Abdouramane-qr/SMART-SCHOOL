# Audit Automatisation Passive (sans nouvelles fonctionnalités)

Date: 2026-01-06  
Scope: React + Filament + API Laravel  
Règle: aucune modification de code, uniquement analyse et propositions backend.

## Checklist par module

### Élèves
- SKIP: total payé / total dû calculés côté API (`EleveResource` calcule à partir des paiements chargés).
- SKIP: affichage solde déduit côté React si `total_paid/total_due` absents.
- PROPOSER (backend): recalculer `total_paid` / `total_due` dans un observer Paiement pour éviter toute dépendance au chargement des relations.

### Classes
- SKIP: aucune automatisation critique détectée (création/édition manuelle).
- PROPOSER (backend): remplir automatiquement `school_id` via user connecté (déjà fait dans Filament) et ajouter un observer pour valider `academic_year_id` si manquant.

### Notes
- APPLIQUÉ: déduction automatique `academic_year_id` et `school_id` via classe/élève si absents (`NoteController`).
- SKIP: pas de calcul automatique de moyenne côté API (pas demandé).
- PROPOSER (backend): calculer les moyennes par élève/matière à la volée via `Resource` ou `Query` (event/observer possible mais pas requis si calcul ad hoc).

### Absences
- APPLIQUÉ: déduction `school_id` / `academic_year_id` via modèle (Absence) + valeur par défaut année active en Filament.
- SKIP: filtres et export existants.

### Paiements
- APPLIQUÉ: `school_id` déduit via élève + `method` déduit via `payment_type` dans `FinanceService`.
- APPLIQUÉ: déduction automatique `status` dans le modèle Paiement.

### Dépenses / Salaires
- APPLIQUÉ: création via `FinanceService` + events pour invalider et préchauffer les stats.
- APPLIQUÉ: `school_id` salaire déduit via enseignant.

### Assets
- APPLIQUÉ: création automatique d’une dépense liée (`expense_id`) lors d’un achat d’asset.
- APPLIQUÉ: cycle de vie `actif/panne/vendu` + event `AssetStatusChanged`.

### Audit
- APPLIQUÉ: logs automatiques pour paiements, dépenses, salaires, assets (création/mise à jour/suppression).

### Emplois du temps
- APPLIQUÉ: déduction `school_id` / `academic_year_id` via modèle (Timetable).
- SKIP: aucune automatisation critique détectée.

### Messages
- SKIP: lecture marquée côté API + polling côté React.
- PROPOSER (backend): marquer automatiquement les messages lus lors du fetch inbox (optionnelle).

### Dashboard
- APPLIQUÉ: stats financières calculées côté API (`FinanceService`) + cache par école/année + warm via events.
- PROPOSER (backend): inclure les paramètres finance (devise/taux/TVA) dans la réponse stats pour éviter recalcul côté client.

## Résumé
- Automatisations déjà en place: calculs financiers centralisés, events cache + warm, dépenses auto pour assets, déductions `school_id`/`method`/`status` pour paiements, logs d’audit automatiques.
- Automatisations manquantes (backend uniquement): moyennes notes si besoin métier, auto-read des messages.
