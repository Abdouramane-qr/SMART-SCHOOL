# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds Laravel models, controllers, policies, and Filament resources.
- `routes/` contains backend route definitions (web/api/admin).
- `resources/js/` is the React app (Vite). Key entry points: `resources/js/main.tsx` and `resources/js/App.tsx`.
- `resources/js/pages/` contains top-level screens (PascalCase files like `Dashboard.tsx`).
- `database/` stores migrations, factories, and seeders; roles/permissions live in `database/seeders/RolesAndPermissionsSeeder.php`.
- `tests/` contains Laravel Feature and Unit tests; React tests live under `resources/js/**`.

## Build, Test, and Development Commands
- `composer install` installs PHP dependencies.
- `npm install` installs frontend dependencies.
- `composer run dev` starts Laravel (`:8000`), Vite (`:5173`), queue, and logs via `concurrently`.
- `composer run setup` bootstraps env, DB migrations, and builds assets.
- `npm run build` produces the Vite production bundle.
- `composer run test` or `php artisan test` runs backend tests.
- `npm run test` runs Vitest for React.

## Coding Style & Naming Conventions
- `.editorconfig` enforces 4-space indentation, LF, and final newlines.
- PHP follows Laravel conventions; use `vendor/bin/pint` for formatting when needed.
- React/TS files live in `resources/js/`; import alias `@/` maps to `resources/js`.
- Use PascalCase for page/components files and keep folder names aligned with existing domains (e.g., `resources/js/components/students`).

## Testing Guidelines
- Backend: PHPUnit suites in `tests/Feature` and `tests/Unit`; tests use `.env.testing` and a dedicated `*_test` DB.
- Frontend: Vitest with jsdom; tests must match `resources/js/**/*.test.ts(x)` and use setup at `resources/js/test/setup.ts`.

## Commit & Pull Request Guidelines
- Git history shows short, descriptive subjects, sometimes with a date suffix (e.g., `Update 08-01-2025 ...`). Keep commits concise and scoped.
- PRs should include a summary, testing notes, and screenshots for UI changes. Link related issues when applicable.

## Configuration & Access Notes
- Local configuration lives in `.env` (use `VITE_` prefix for frontend env vars).
- Admin UI is Filament at `/admin`; main app is React at `/` (see `README_STRUCTURE.md` for the split).
