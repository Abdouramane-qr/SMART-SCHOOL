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
- SKIP: pas de calcul automatique de moyenne côté API.
- PROPOSER (backend): calculer les moyennes par élève/matière à la volée via `Resource` ou `Query` (event/observer possible mais pas requis si calcul ad hoc).

### Absences
- SKIP: filtres et export existants.
- PROPOSER (backend): auto‐déduire `school_year_id` depuis la classe si absent lors du store/update.

### Paiements
- SKIP: `school_id` et `amount` auto‐déduits dans `PaiementController` si absents.
- PROPOSER (backend): déduire automatiquement le `status` (payé/partiel/en retard) à partir de `amount` et `paid_amount`.

### Emplois du temps
- SKIP: aucune automatisation critique détectée.
- PROPOSER (backend): déduire `school_year_id` depuis la classe si besoin pour filtrage.

### Messages
- SKIP: lecture marquée côté API + polling côté React.
- PROPOSER (backend): marquer automatiquement les messages lus lors du fetch inbox (optionnelle).

### Dashboard
- SKIP: stats financières calculées côté API (`FinanceController`) + cache par école/année.
- PROPOSER (backend): réutiliser les paramètres finance (devise/taux/TVA) dans la réponse stats pour éviter recalcul côté client.

## Résumé
- Automatisations déjà en place: calculs financiers, totaux élèves, déduction `school_id`/`amount` sur paiements.
- Automatisations manquantes (backend uniquement): statuts paiements, liaisons année scolaire, moyennes notes.
