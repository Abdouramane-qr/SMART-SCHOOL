# Design System

This project uses a single source of truth for colors and component styling.
Only the tokens defined in `resources/css/app.css` may be used.

## Palette

### Light
- App background: `--light-app` (200 27% 96%)
- Card surface: `--light-card` (0 0% 100%)
- Main text: `--light-text` (222 47% 11%)
- Muted text: `--light-muted-text` (0 0% 35%)
- Border: `--light-border` (0 0% 70%)
- Brand primary: `--brand-primary` (215 98% 56%)

### Dark
- App background: `--dark-app` (222 47% 11%)
- Card surface: `--dark-card` (217 33% 17%)
- Main text: `--dark-text` (210 40% 98%)
- Muted text: `--dark-muted-text` (0 0% 70%)
- Border: `--dark-border` (215 25% 27%)
- Brand primary: `--brand-primary` (215 98% 56%)

### Semantic tokens
- `bg-app` → `--bg-app`
- `bg-card` → `--bg-card`
- `text-main` → `--text-main`

## Buttons
- Primary: `bg-primary text-primary-foreground` with `hover:bg-primary-hover`.
- Secondary/outline: `bg-card text-main` with `border` using `border-border`.
- Destructive: `bg-destructive text-destructive-foreground`.
- Do not use arbitrary colors (no `bg-blue-*`, `text-red-*`, or hex values).

## Cards
- Base: `bg-card text-card-foreground border border-border shadow-sm`.
- Elevated sections can use `bg-surface` but should still respect `border-border`.
- Avoid custom background colors per card.

## Text
- Default: `text-main`.
- Muted/supporting: `text-muted-foreground`.
- Links/accents: `text-primary` with hover/focus states.

## Constraint
- No colors outside the system. Use tokens and Tailwind classes mapped to
  the variables in `resources/css/app.css`.
