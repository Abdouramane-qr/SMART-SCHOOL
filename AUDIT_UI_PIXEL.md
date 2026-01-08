# Audit UI Pixel Check (React + Filament)

Date: 2026-01-06  
Objectif: verifier page par page la coherence visuelle (buttons, couleurs, typographie, branding) et la logique UI.

## React

### Dashboard
- Buttons: OK (variants unifies).
- Badges/statuts: OK (mapping status centralise via `statuses.json`).
- Typo/branding: OK (Source Sans 3, tokens POPSPACE).
- Risque: aucun bloqueur detecte.

### Eleves
- Tables/cartes: OK (fond surface + hover background).
- Actions: OK (primary/secondary/destructive).
- Statuts: OK (badges conformes).

### Classes
- Tables/filters: OK.
- Actions: OK (boutons uniformes).

### Notes
- Tables: OK.
- Couleurs notes: OK (utilise warning/success, destructif reserve aux suppressions).

### Absences
- Badges: OK (status map centralise pour success/warning/destructive).
- Actions: OK.

### Finances
- Stats: OK (couleurs tokens).
- Badges paiement: OK (status map centralise).

## Filament
- Theme: OK (couleurs POPSPACE + Source Sans 3).
- Dashboard: OK (KPI + graphique mensuel).
- Badges statut paiements/assets/absences: OK (mapping centralise StatusMap).
- Navigation/typographie: OK.

## Points d'attention (mineurs)
- Plusieurs pages React gardent des classes `text-success/text-warning` pour des indicateurs (ok, mais doivent rester alignees sur tokens).
- Pagination front encore large (`per_page=1000`) impacte la perception visuelle (skeletons plus longs).

## Conclusion
Coherence visuelle React + Filament validee. Aucun blocage UI detecte.
