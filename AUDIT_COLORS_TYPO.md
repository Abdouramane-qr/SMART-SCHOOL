# Audit Couleurs & Typographie

Date: 2026-01-06  
Objectif: vérifier l’alignement React / Filament et appliquer une base visuelle unique.

## Constat initial (avant alignement)
- **Police React**: mix de deux polices (`Source Sans 3` + `Fraunces` via `.font-display`).
- **Police Filament**: Inter (par défaut Filament).
- **Couleurs React**: palette bleue/cyan personnalisée non alignée sur Indigo/Cyan/Emerald/Amber/Red/Slate.
- **Thème Filament**: mode sombre par défaut, couleur primaire Amber.
- **Effets**: gradients + ombres marquées dans plusieurs composants.

## Divergences restantes (après alignement)
- **Titres métier**: quelques indicateurs (ex: valeur moyenne sur dashboard) restent en `text-3xl` par choix de lisibilité.

## Alignements appliqués
- **Palette unique**: Indigo/Cyan/Emerald/Amber/Red + Neutral Slate, fond Slate 50.
- **Typographie unique**: `Source Sans 3` pour React + Filament.
- **Titres**: H1 standardisés (26–28px) sur les pages React.
- **Effets**: gradients retirés et ombres réduites (`shadow-sm`/`shadow-md`).
- **Filament**: thème clair par défaut + couleurs alignées + CSS de thème (fond + radius).
