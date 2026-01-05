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
