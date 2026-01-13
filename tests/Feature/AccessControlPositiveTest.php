<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\Matiere;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AccessControlPositiveTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_note(): void
    {
        $school = School::create(['name' => 'School A', 'code' => 'A', 'is_active' => true]);
        $year = AcademicYear::create([
            'school_id' => $school->id,
            'name' => '2025-2026',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_active' => true,
        ]);
        $classe = Classe::create([
            'school_id' => $school->id,
            'academic_year_id' => $year->id,
            'name' => '6A',
            'level' => '6eme',
            'capacity' => 30,
        ]);
        $student = Eleve::create([
            'school_id' => $school->id,
            'classe_id' => $classe->id,
            'first_name' => 'Ana',
            'last_name' => 'Eleve',
            'gender' => 'F',
            'birth_date' => '2012-01-01',
        ]);
        $subject = Matiere::create([
            'school_id' => $school->id,
            'name' => 'Maths',
            'code' => 'MATH',
        ]);

        Permission::findOrCreate('note.create');
        $role = Role::findOrCreate('admin');
        $role->syncPermissions(['note.create']);

        $user = User::factory()->create();
        $user->assignRole('admin');

        $response = $this->actingAs($user)->postJson('/api/notes', [
            'school_id' => $school->id,
            'eleve_id' => $student->id,
            'matiere_id' => $subject->id,
            'class_id' => $classe->id,
            'academic_year_id' => $year->id,
            'term' => 'T1',
            'value' => 15,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.eleve_id', $student->id);
    }

    public function test_admin_can_create_timetable_entry(): void
    {
        $school = School::create(['name' => 'School A', 'code' => 'A', 'is_active' => true]);
        $year = AcademicYear::create([
            'school_id' => $school->id,
            'name' => '2025-2026',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_active' => true,
        ]);
        $classe = Classe::create([
            'school_id' => $school->id,
            'academic_year_id' => $year->id,
            'name' => '6A',
            'level' => '6eme',
            'capacity' => 30,
        ]);
        $subject = Matiere::create([
            'school_id' => $school->id,
            'name' => 'Maths',
            'code' => 'MATH',
        ]);

        Permission::findOrCreate('timetable.create');
        $role = Role::findOrCreate('admin');
        $role->syncPermissions(['timetable.create']);

        $user = User::factory()->create();
        $user->assignRole('admin');

        $response = $this->actingAs($user)->postJson('/api/timetable', [
            'school_id' => $school->id,
            'class_id' => $classe->id,
            'subject_id' => $subject->id,
            'day_of_week' => 1,
            'start_time' => '08:00',
            'end_time' => '09:00',
            'school_year_id' => $year->id,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.class_id', $classe->id);
    }

    public function test_admin_can_list_roles(): void
    {
        Permission::findOrCreate('role.view_any');
        $role = Role::findOrCreate('admin');
        $role->syncPermissions(['role.view_any']);

        $user = User::factory()->create();
        $user->assignRole('admin');

        $response = $this->actingAs($user)->getJson('/api/roles');

        $response->assertOk();
        $response->assertJsonPath('data.0', 'admin');
    }
}
