# Smart School Hub (Laravel + React)

Plateforme de gestion scolaire (administration + application metier) en cours de migration vers Laravel + Filament + React (Vite).

## Structure
- Laravel backend + Filament admin: `SMART_SCHOOL/`
- React app: `SMART_SCHOOL/resources/js`
- Vite entry: `SMART_SCHOOL/resources/js/main.tsx`
- Routes backend: `SMART_SCHOOL/routes/*.php`

## Demarrer
Depuis `SMART_SCHOOL/`:

```bash
composer install
npm install
php artisan key:generate
php artisan migrate
composer run dev
```

`composer run dev` lance:
- Laravel server (http://127.0.0.1:8000)
- Vite dev server (http://127.0.0.1:5173)
- Queue + logs

## Acces
- App React: `http://127.0.0.1:8000`
- Filament (back-office): `http://127.0.0.1:8000/admin`

## Filament vs React
Voir `README_STRUCTURE.md` pour la repartition exacte.

## Notes
- Migration en cours: pas de nouvelles fonctionnalites sans validation.
- Parametres locaux: `.env` (utiliser le prefixe `VITE_` pour le front).
