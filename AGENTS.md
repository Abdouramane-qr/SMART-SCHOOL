# Repository Guidelines

## Project Overview
Laravel 12 + React (Breeze) + Vite + Tailwind. Auth is provided by Laravel Breeze with Inertia.

## Local Development
- `composer install`
- `npm install`
- `php artisan migrate`
- `php artisan serve`
- `npm run dev`

## Database
PostgreSQL is required. Configure `.env` with `DB_CONNECTION=pgsql` and the local port (this environment uses `5433`). Database name: `smart_school`.

## Migration Notice
No new features should be added until the backend migration from Supabase to Laravel is completed. Limit work to setup, audits, and migration tasks.

## Migration Progress
- Base schema created: schools, academic_years, classes, eleves, parents, enseignants, matieres, paiements, notes, absences, and pivot tables.
- Eloquent relations wired for core entities (eleve, classe, paiement, note, absence).
- Filament installed with Admin panel; resources added for eleves, classes, paiements, notes, absences.
- Roles and permissions seeded via spatie/laravel-permission (super_admin, admin_ecole, comptable, enseignant).
- API routes (Sanctum) added for eleves, classes, paiements, notes, absences; dashboard and stats endpoints added with Redis tag caching (par ecole et annee scolaire).
- Champs additionnels pour compatibilite migration: eleves (student_id, full_name, address, parent_*), paiements (paid_amount, payment_type, due_date, notes).
- Auth SPA: endpoints API login/register/logout + /me (roles/permissions) + users/roles management (spatie).
- IA locale: endpoint `POST /api/ai-assistant` (reponse locale placeholder).
- Nouvelles tables/API pour migration: enrollments, expenses, salaries, assets, messages, finance_settings, audit_teachers, plus champs enseignants/classes/absences/paiements.
- Ajouts schema: `classrooms`, `timetables`, extension `notes` (class_id, grade_type, weight, description, evaluation_date) et profils users (address, avatar_url).
- Nouvelles APIs: `subjects`, `classrooms`, `timetable` avec ressources JSON alignees front.
