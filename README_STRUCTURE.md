# Structure & Repartition (Filament vs React)

## Filament (back-office admin)
Resources disponibles:
- Eleves (`EleveResource`)
- Classes (`ClasseResource`)
- Absences (`AbsenceResource`)
- Notes (`NoteResource`)
- Paiements (`PaiementResource`)
- Utilisateurs (`UserResource`)
- Roles (`RoleResource`)
- Matieres (`MatiereResource`)
- Annees scolaires (`AcademicYearResource`)
- Salles (`ClassroomResource`)
- Ecoles (`SchoolResource`)
- Inventaire (`AssetResource`)
- Enseignants (`TeacherResource`)
- Salaires (`SalaryResource`)
- Audits enseignants (`TeacherAuditResource`)
- Parametres finance (`FinanceSettingResource`)
- Parents (`ParentResource`)

Usage recommande:
- CRUD administratifs et parametres systeme.
- Gestion des utilisateurs/roles.
- Configuration des donnees de reference (matieres, annees, salles).

Acces:
- URL: `/admin`
- Requis: role `super_admin` (voir `App\\Models\\User::canAccessPanel`).

## React (app principale)
Pages disponibles (dossier `resources/js/pages`):
- Dashboard, Students, Classes, Grades, Absences, Timetable, Messages, Finances
- Subjects, SchoolYears, Classrooms, Assets, Staff, UserManagement (legacy, rediriges vers Filament)
- Profile, Auth, Settings, NotFound

Usage recommande:
- Experiences metier quotidiennes, multi-roles, UX riche.
- Dashboards par role + workflows.
- IA Assistant et interactions temps reel.

Notes:
- Les ecrans de gestion (Subjects, SchoolYears, Classrooms, Assets, Staff, UserManagement, Settings) ne sont plus exposes dans le menu React.
- Les routes React pour ces ecrans redirigent automatiquement vers `/admin`.

## Regle generale
- Filament = administration/CRUD systeme.
- React = application operationnelle et parcours utilisateur.
