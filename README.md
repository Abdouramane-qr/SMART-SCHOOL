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
Vue fonctionnelle complete: `PLATFORM_FEATURES.md`.

## Roles & Permissions (source de verite)
- Gestion via `spatie/laravel-permission`.
- Seeder: `database/seeders/RolesAndPermissionsSeeder.php` (roles + permissions + super admin).
- Front React: controle d'acces par permissions (`/api/me` retourne `roles` + `permissions`).
- Filament: autorisation par policies (modeles mappes dans `AuthServiceProvider`).
- Les permissions sont scopees par role (pas de permissions directes utilisateur).
- Acces Filament reserve a `admin` et `super_admin` (tous les autres roles utilisent React).
- Normalisation comptes existants: `php artisan users:normalize-permissions --dry-run` puis sans `--dry-run`.
- Audit roles/permissions (source seeder): `SMART_SCHOOL/AUDIT_ROLES_PERMISSIONS.md`.

## Tests
- Backend: `php artisan test`
- Frontend: `npm run test`
- Les tests backend utilisent `.env.testing` (DB `*_test`). Assurer que la base existe et que l'utilisateur DB a les droits.

## Notes
- Migration en cours: pas de nouvelles fonctionnalites sans validation.
- Parametres locaux: `.env` (utiliser le prefixe `VITE_` pour le front).
- La devise affichee cote React suit `default_currency` (parametres finance). Codes supportes: `XOF`, `USD`, `EUR`, `DH`.
- Les APIs notes/absences/emploi du temps se basent par defaut sur l'ecole de l'utilisateur et l'annee scolaire active si aucun filtre n'est fourni.
