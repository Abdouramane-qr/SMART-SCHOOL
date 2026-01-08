# Audit Couleurs & Typographie

Date: 2026-01-06  
Objectif: vérifier l’alignement React / Filament et appliquer une base visuelle unique.

## Constat actuel
- **Police React**: `Source Sans 3` définie dans `resources/css/app.css`.
- **Police Filament**: `Source Sans 3` configurée côté Panel + thème Filament aligné.
- **Couleurs React**: palette POPSPACE appliquée via variables CSS (`primary`, `background`, `neutral`, `white`) + `surface`.
- **Couleurs Filament**: palette primaire + neutres alignés sur POPSPACE, états success/warning mappés sur la palette.
- **Effets**: gradients supprimés des dashboards, ombres et fonds simplifiés.

## Divergences restantes
- **Destructive**: rouge conservé pour suppression/critique uniquement (exception volontaire).
- **Lisibilité**: `muted-foreground` ajusté pour contraste (valeur hors palette strictement POPSPACE).

## Alignements appliqués
- **Tokens CSS**: POPSPACE centralisée dans `resources/css/app.css` + `tailwind.config.js`.
- **Filament**: thème admin aligné (couleurs + typographie) via `resources/css/filament/admin/theme.css` + `AdminPanelProvider`.
