<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\Matiere;
use App\Models\Note;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AccessControlTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_cannot_create_note(): void
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

        Permission::findOrCreate('note.view');
        $role = Role::findOrCreate('eleve');
        $role->syncPermissions(['note.view']);

        $user = User::factory()->create();
        $user->assignRole('eleve');
        $user->setAttribute('school_id', $school->id);

        $response = $this->actingAs($user)->postJson('/api/notes', [
            'eleve_id' => $student->id,
            'matiere_id' => $subject->id,
            'class_id' => $classe->id,
            'academic_year_id' => $year->id,
            'term' => 'T1',
            'value' => 15,
        ]);

        $response->assertForbidden();
    }

    public function test_parent_cannot_delete_note(): void
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
            'first_name' => 'Leo',
            'last_name' => 'Parent',
            'gender' => 'M',
            'birth_date' => '2012-02-01',
        ]);
        $subject = Matiere::create([
            'school_id' => $school->id,
            'name' => 'History',
            'code' => 'HIST',
        ]);
        $note = Note::create([
            'school_id' => $school->id,
            'eleve_id' => $student->id,
            'matiere_id' => $subject->id,
            'class_id' => $classe->id,
            'academic_year_id' => $year->id,
            'term' => 'T1',
            'value' => 12,
        ]);

        Permission::findOrCreate('note.view');
        $role = Role::findOrCreate('parent');
        $role->syncPermissions(['note.view']);

        $user = User::factory()->create();
        $user->assignRole('parent');
        $user->setAttribute('school_id', $school->id);

        $response = $this->actingAs($user)->deleteJson("/api/notes/{$note->id}");

        $response->assertForbidden();
    }

    public function test_teacher_cannot_create_timetable(): void
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

        Permission::findOrCreate('timetable.view');
        $role = Role::findOrCreate('enseignant');
        $role->syncPermissions(['timetable.view']);

        $user = User::factory()->create();
        $user->assignRole('enseignant');
        $user->setAttribute('school_id', $school->id);

        $response = $this->actingAs($user)->postJson('/api/timetable', [
            'class_id' => $classe->id,
            'subject_id' => $subject->id,
            'day_of_week' => 1,
            'start_time' => '08:00',
            'end_time' => '09:00',
            'school_year_id' => $year->id,
        ]);

        $response->assertForbidden();
    }

    public function test_non_admin_cannot_list_roles(): void
    {
        Permission::findOrCreate('role.view_any');
        $role = Role::findOrCreate('admin');
        $role->syncPermissions(['role.view_any']);

        $user = User::factory()->create();
        $response = $this->actingAs($user)->getJson('/api/roles');

        $response->assertForbidden();
    }

    public function test_accessing_other_school_note_is_forbidden(): void
    {
        $schoolA = School::create(['name' => 'School A', 'code' => 'A', 'is_active' => true]);
        $schoolB = School::create(['name' => 'School B', 'code' => 'B', 'is_active' => false]);
        $year = AcademicYear::create([
            'school_id' => $schoolB->id,
            'name' => '2025-2026',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_active' => true,
        ]);
        $classe = Classe::create([
            'school_id' => $schoolB->id,
            'academic_year_id' => $year->id,
            'name' => '6B',
            'level' => '6eme',
            'capacity' => 30,
        ]);
        $student = Eleve::create([
            'school_id' => $schoolB->id,
            'classe_id' => $classe->id,
            'first_name' => 'Sam',
            'last_name' => 'Other',
            'gender' => 'M',
            'birth_date' => '2012-03-01',
        ]);
        $subject = Matiere::create([
            'school_id' => $schoolB->id,
            'name' => 'Science',
            'code' => 'SCI',
        ]);
        $note = Note::create([
            'school_id' => $schoolB->id,
            'eleve_id' => $student->id,
            'matiere_id' => $subject->id,
            'class_id' => $classe->id,
            'academic_year_id' => $year->id,
            'term' => 'T1',
            'value' => 11,
        ]);

        Permission::findOrCreate('note.view');
        $role = Role::findOrCreate('admin_ecole');
        $role->syncPermissions(['note.view']);

        $user = User::factory()->create();
        $user->assignRole('admin_ecole');
        $user->setAttribute('school_id', $schoolA->id);

        $response = $this->actingAs($user)->getJson("/api/notes/{$note->id}");

        $response->assertForbidden();
    }
}
