<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Filament\Panel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class RolesPermissionsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_comptable_permissions_are_scoped(): void
    {
        $role = Role::findByName('comptable');

        $this->assertTrue($role->hasPermissionTo('paiement.create'));
        $this->assertTrue($role->hasPermissionTo('expense.view_any'));
        $this->assertFalse($role->hasPermissionTo('note.create'));
    }

    public function test_enseignant_permissions_are_scoped(): void
    {
        $role = Role::findByName('enseignant');

        $this->assertTrue($role->hasPermissionTo('note.create'));
        $this->assertTrue($role->hasPermissionTo('absence.update'));
        $this->assertFalse($role->hasPermissionTo('paiement.create'));
    }

    public function test_parent_permissions_are_scoped(): void
    {
        $role = Role::findByName('parent');

        $this->assertTrue($role->hasPermissionTo('note.view_any'));
        $this->assertTrue($role->hasPermissionTo('message.create'));
        $this->assertFalse($role->hasPermissionTo('message.update'));
    }

    public function test_filament_access_is_admin_only(): void
    {
        $panel = Panel::make();

        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $this->assertTrue($admin->canAccessPanel($panel));

        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super_admin');
        $this->assertTrue($superAdmin->canAccessPanel($panel));

        $comptable = User::factory()->create();
        $comptable->assignRole('comptable');
        $this->assertFalse($comptable->canAccessPanel($panel));

        $enseignant = User::factory()->create();
        $enseignant->assignRole('enseignant');
        $this->assertFalse($enseignant->canAccessPanel($panel));
    }
}
