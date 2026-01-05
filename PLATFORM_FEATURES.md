# Smart School Hub - Fonctionnalites (Documentation)

## Vue d'ensemble
Plateforme de gestion scolaire (React + Laravel + Filament) avec separation claire:
- Filament: back-office administratif.
- React: usage quotidien (workflows metiers).

## Modules React (usage quotidien)
### Dashboard
- Vue par role: admin, enseignant, eleve, parent.
- Indicateurs clefs et raccourcis.

### Eleves
- Liste + fiche eleve.
- Acces aux absences, notes, paiements d'un eleve.
- ID eleve auto (initiale ecole + annee + increment).

### Classes
- Consultation des classes et effectifs.
- Navigation vers eleves et emploi du temps.

### Emploi du temps
- Grille hebdomadaire.
- Consultation pour roles non admin.
- Edition reservee aux admins (via droits).

### Absences
- Suivi et creation d'absences.
- Filtre par eleve / classe.

### Notes
- Suivi et creation des notes.
- Moyennes et ponderations cote backend.

### Finances
- Suivi revenus / depenses / soldes.
- Exports PDF/Excel.
- Devise alignee sur `default_currency`.

### Messages
- Communication interne.

### Personnel (Staff)
- Liste enseignants.
- Salaires.
- Audits enseignants.

### Assets
- Suivi inventaire.

### IA Assistant
- Aide contextuelle (endpoint local).

### Profil
- Infos utilisateur.

## Modules Filament (back-office)
### Administration
- Utilisateurs & roles (source de verite: spatie/laravel-permission).
- Permissions scopees par role.

### Referentiels
- Annees scolaires.
- Matieres.
- Salles / classes / classrooms.

### Gestion scolaire
- CRUD administratif: eleves, classes, absences, paiements, notes, assets.
- Audits enseignants.
- Parametres finance.

## Auth & Roles
- Acces Filament reserve a: admin, super_admin.
- Tous les autres roles utilisent React.
- Permissions scopees par role (pas de permissions directes utilisateur).
- Normalisation comptes existants: `php artisan users:normalize-permissions`.

## Parcours utilisateur (resume)
### Admin
- Gère les referentiels et l'administration via Filament.
- Suit l'usage quotidien via React (dashboard + operations).

### Enseignant
- Acces a ses classes / notes / absences / emploi du temps.
- Dashboard enseignant (consultation).

### Parent
- Suivi des enfants: notes, absences, paiements, emploi du temps.

### Eleve
- Vue personnelle: notes, absences, emploi du temps.

### Comptable
- Acces finances, paiements, depenses (React).

## Automatisations & coherence
- ID eleve auto (initiale ecole + annee + increment).
- Cache tagge par ecole + annee, invalide sur create/update/delete.
- Devise React alignee sur `default_currency` (XOF, USD, EUR, DH).
- Deduction automatique school_id/academic_year_id pour notes, absences, emploi du temps.

## APIs principales (Laravel)
### Auth
- POST `/api/login`
- POST `/api/register`
- POST `/api/logout`
- GET `/api/me`

### Scolarite
- Eleves: `/api/eleves`
- Classes: `/api/classes`
- Notes: `/api/notes`
- Absences: `/api/absences`
- Emploi du temps: `/api/timetable`
- Matieres: `/api/subjects`
- Salles: `/api/classrooms`
- Annees scolaires: `/api/school-years`

### Finances
- Paiements: `/api/paiements`
- Depenses: `/api/expenses`
- Salaires: `/api/salaries`
- Stats: `/api/finance/stats`
- Parametres finance: `/api/finance/settings`

### Communication & Admin
- Messages: `/api/messages`
- Utilisateurs: `/api/users`
- Roles: `/api/roles`
- User roles: `/api/user-roles`
- Audits enseignants: `/api/teacher-audits`

## Donnees & conventions
- `academic_year_id` mappe sur l'annee scolaire active.
- `school_id` derive de l'utilisateur ou de la classe/eleve.
- Devise: `default_currency` dans Parametres finance.

## UX & performance (priorites)
- Reduire la saisie manuelle (prefill, deductions).
- UX claire pour utilisateurs non techniques.
- Compatible reseaux instables (payloads limites, pagination, caches).

## Zone "documentation" (a copier/coller)
### Presentation
Smart School Hub est une plateforme de gestion scolaire qui separe l'administration (Filament) de l'usage quotidien (React). Les roles sont strictement scopes pour limiter les erreurs et simplifier le travail.

### Raison de la separation
- Filament: configuration et operations administratives.
- React: experience utilisateur rapide pour les operations du quotidien.

### Principes clefs
- Moins de saisie manuelle.
- Donnees deduites automatiquement (ecole, annee, devise).
- Interface lisible sur petits ecrans.

## Tests
- Backend: `php artisan test`.
- Frontend: `npm run test`.
