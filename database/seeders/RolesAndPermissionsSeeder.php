<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'eleve.view_any', 'eleve.view', 'eleve.create', 'eleve.update', 'eleve.delete',
            'classe.view_any', 'classe.view', 'classe.create', 'classe.update', 'classe.delete',
            'paiement.view_any', 'paiement.view', 'paiement.create', 'paiement.update', 'paiement.delete',
            'note.view_any', 'note.view', 'note.create', 'note.update', 'note.delete',
            'absence.view_any', 'absence.view', 'absence.create', 'absence.update', 'absence.delete',
            'asset.view_any', 'asset.view', 'asset.create', 'asset.update', 'asset.delete',
            'enseignant.view_any', 'enseignant.view', 'enseignant.create', 'enseignant.update', 'enseignant.delete',
            'salary.view_any', 'salary.view', 'salary.create', 'salary.update', 'salary.delete',
            'teacher_audit.view_any', 'teacher_audit.view',
            'user.view_any', 'user.view', 'user.create', 'user.update', 'user.delete',
            'role.view_any', 'role.view', 'role.create', 'role.update', 'role.delete',
            'academic_year.view_any', 'academic_year.view', 'academic_year.create', 'academic_year.update', 'academic_year.delete',
            'classroom.view_any', 'classroom.view', 'classroom.create', 'classroom.update', 'classroom.delete',
            'matiere.view_any', 'matiere.view', 'matiere.create', 'matiere.update', 'matiere.delete',
            'finance_setting.view_any', 'finance_setting.view', 'finance_setting.create', 'finance_setting.update', 'finance_setting.delete',
            'parent.view_any', 'parent.view', 'parent.create', 'parent.update', 'parent.delete',
            'school.view_any', 'school.view', 'school.create', 'school.update', 'school.delete',
            'message.view_any', 'message.view', 'message.create', 'message.update', 'message.delete',
            'timetable.view_any', 'timetable.view', 'timetable.create', 'timetable.update', 'timetable.delete',
            'expense.view_any', 'expense.view', 'expense.create', 'expense.update', 'expense.delete',
            'enrollment.view_any', 'enrollment.view', 'enrollment.create', 'enrollment.update', 'enrollment.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $roles = [
            'admin',
            'super_admin',
            'admin_ecole',
            'comptable',
            'enseignant',
            'eleve',
            'parent',
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        $superAdmin = Role::where('name', 'super_admin')->first();
        if ($superAdmin) {
            $superAdmin->syncPermissions($permissions);
        }

        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $admin->syncPermissions($permissions);
        }

        $adminEcole = Role::where('name', 'admin_ecole')->first();
        if ($adminEcole) {
            $adminEcole->syncPermissions($permissions);
        }

        $comptable = Role::where('name', 'comptable')->first();
        if ($comptable) {
            $comptable->syncPermissions([
                'eleve.view_any', 'eleve.view',
                'paiement.view_any', 'paiement.view', 'paiement.create', 'paiement.update', 'paiement.delete',
                'expense.view_any', 'expense.view', 'expense.create', 'expense.update', 'expense.delete',
            ]);
        }

        $enseignant = Role::where('name', 'enseignant')->first();
        if ($enseignant) {
            $enseignant->syncPermissions([
                'eleve.view_any', 'eleve.view',
                'classe.view_any', 'classe.view',
                'note.view_any', 'note.view', 'note.create', 'note.update',
                'absence.view_any', 'absence.view', 'absence.create', 'absence.update',
                'timetable.view_any', 'timetable.view',
                'message.view_any', 'message.view', 'message.create', 'message.update',
            ]);
        }

        $eleve = Role::where('name', 'eleve')->first();
        if ($eleve) {
            $eleve->syncPermissions([
                'note.view_any', 'note.view',
                'absence.view_any', 'absence.view',
                'paiement.view_any', 'paiement.view',
                'timetable.view_any', 'timetable.view',
                'message.view_any', 'message.view', 'message.create',
            ]);
        }

        $parent = Role::where('name', 'parent')->first();
        if ($parent) {
            $parent->syncPermissions([
                'note.view_any', 'note.view',
                'absence.view_any', 'absence.view',
                'paiement.view_any', 'paiement.view',
                'timetable.view_any', 'timetable.view',
                'message.view_any', 'message.view', 'message.create',
            ]);
        }

        $email = env('SUPER_ADMIN_EMAIL', 'superadmin@smartschool.local');
        $password = env('SUPER_ADMIN_PASSWORD', 'ChangeMe123!');

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => 'Super Admin',
                'password' => Hash::make($password),
            ]
        );

        if (! $user->hasRole('super_admin')) {
            $user->assignRole('super_admin');
        }
    }
}
