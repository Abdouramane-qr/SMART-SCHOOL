# Audit Roles & Permissions (Seeder Source)

Source de verite: `SMART_SCHOOL/database/seeders/RolesAndPermissionsSeeder.php`.

## Roles -> Permissions

### super_admin
- toutes les permissions definies dans le seeder (liste complete).

### admin
- toutes les permissions definies dans le seeder (liste complete).

### admin_ecole
- toutes les permissions definies dans le seeder (liste complete).

### comptable
- eleve.view_any
- eleve.view
- paiement.view_any
- paiement.view
- paiement.create
- paiement.update
- paiement.delete
- expense.view_any
- expense.view
- expense.create
- expense.update
- expense.delete

### enseignant
- eleve.view_any
- eleve.view
- classe.view_any
- classe.view
- note.view_any
- note.view
- note.create
- note.update
- absence.view_any
- absence.view
- absence.create
- absence.update
- timetable.view_any
- timetable.view
- message.view_any
- message.view
- message.create
- message.update

### eleve
- note.view_any
- note.view
- absence.view_any
- absence.view
- paiement.view_any
- paiement.view
- timetable.view_any
- timetable.view
- message.view_any
- message.view
- message.create

### parent
- note.view_any
- note.view
- absence.view_any
- absence.view
- paiement.view_any
- paiement.view
- timetable.view_any
- timetable.view
- message.view_any
- message.view
- message.create

## Etat DB (permission:show)
Impossible d'executer `php artisan permission:show` (SQLSTATE[08006] sur pgsql). Refaire l'audit dynamique des que la DB est accessible.
