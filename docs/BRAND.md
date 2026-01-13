# SMART-SCHOOL Branding Guide

Version: 1.0
Scope: React app + Filament admin

## Vision & identite
SMART-SCHOOL est une experience scolaire moderne, claire et fiable. L'identite visuelle doit inspirer confiance, stabilite et efficacite, avec un accent sur la lisibilite et la coherence entre l'app principale et l'admin.

Principes:
- Clarte avant decoration.
- Couleurs utiles et semantiques.
- Texte lisible et hierarchie nette.
- Interface sobre, admin-first.

## Palette & typographies

### Couleur principale
- SMART-SCHOOL Blue: #217EFD
- HSL: 215 98% 56%

### Typographies
- Sans: Source Sans 3 (UI de base)
- Display: Source Serif 4 (titres, accent editorial)

## Regles UI/UX

### Usage des couleurs
- Utiliser `primary` pour les actions principales.
- Utiliser `secondary` ou `muted` pour les actions secondaires.
- Utiliser `destructive` uniquement pour les actions irreversibles.
- Ne pas utiliser `warning` comme couleur de texte principale.

### Etats et accesibilite
- Focus visible obligatoire sur tous les elements interactifs.
- Contraste minimum recommande: 4.5:1 pour le texte.
- Ne pas utiliser seulement la couleur pour signaler un statut; ajouter une icone ou un libelle.

### Ton visuel
- Admin-first: propre, compact, sans effets excessifs.
- Laisser respirer les cards et tables (espacement consistant).
- Garder les alertes courtes et actionnables.

## Tokens & mapping technique

### Definition des tokens
Source: `resources/css/app.css`

Base:
- `--light-*`, `--dark-*`
- `--bg-app`, `--bg-card`, `--text-main`, `--text-muted`

Brand:
- `--brand-primary: 215 98% 56%`
- `--brand-background: var(--light-app)`
- `--brand-neutral: 214 18% 72%`
- `--brand-white: 0 0% 100%`

Semantiques:
- `--primary`, `--secondary`, `--accent`
- `--success`, `--warning`, `--info`, `--destructive`
- `--border`, `--input`, `--ring`

Effets:
- `--gradient-primary`, `--gradient-card`
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-blue`

### Mapping Tailwind
Source: `tailwind.config.js`

- `primary`, `secondary`, `muted`, `background`, `foreground`
- `success`, `warning`, `info`, `destructive`
- `border`, `input`, `ring`
- `brand.*` (primary/background/neutral/white)

### Filament
Themes:
- `resources/css/filament/theme.css`
- `resources/css/filament/admin/theme.css`

Notes:
- Les overrides sont volontairement minimalistes.
- Activation requise en retirant le bloc de commentaire.

## Bonnes pratiques / interdits

Bonnes pratiques:
- Centraliser toute couleur via les tokens HSL.
- Utiliser les variantes Tailwind mappees (`bg-primary`, `text-muted-foreground`).
- Respecter les roles semantiques des composants (success/info/warning/destructive).
- Verifier le contraste en light et dark.

Interdits:
- Introduire une nouvelle couleur sans token.
- Utiliser des valeurs RGB/HEX dans le CSS app.
- Melanger des styles libres dans l'admin Filament.
- Utiliser `brand-neutral` comme couleur de texte principale sur fond clair.

## References
- React entrypoints: `resources/js/main.tsx`, `resources/js/App.tsx`
- Filament panel: `app/Providers/Filament/AdminPanelProvider.php`
- Status mapping: `resources/shared/statuses.json`
