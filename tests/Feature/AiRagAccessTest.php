<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\Matiere;
use App\Models\Note;
use App\Models\School;
use App\Models\Timetable;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * @group rag
 */
class AiRagAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('RAG views require PostgreSQL.');
        }

        foreach (['admin', 'enseignant', 'eleve'] as $role) {
            Role::firstOrCreate(['name' => $role]);
        }
    }

    public function test_admin_sees_only_aggregated_data(): void
    {
        $school = School::create(['name' => 'Test School', 'code' => 'TS1']);
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
            'name' => 'Classe A',
            'level' => 'L1',
        ]);

        $matiere = Matiere::create([
            'school_id' => $school->id,
            'name' => 'Math',
            'code' => 'MATH',
            'coefficient' => 1,
        ]);

        $teacherUser = User::factory()->create();
        Enseignant::create([
            'school_id' => $school->id,
            'first_name' => 'Teach',
            'last_name' => 'Er',
            'email' => 'teach@example.com',
            'phone' => '000000000',
            'user_id' => $teacherUser->id,
        ]);

        $studentUser = User::factory()->create();
        $student = Eleve::create([
            'school_id' => $school->id,
            'classe_id' => $classe->id,
            'first_name' => 'Jane',
            'last_name' => 'Secret',
            'gender' => 'F',
            'birth_date' => '2010-01-01',
            'user_id' => $studentUser->id,
        ]);

        Note::create([
            'eleve_id' => $student->id,
            'matiere_id' => $matiere->id,
            'class_id' => $classe->id,
            'academic_year_id' => $year->id,
            'value' => 12.5,
            'term' => 'T1',
            'evaluation_date' => '2025-10-01',
        ]);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/ai-assistant', [
            'messages' => [
                ['role' => 'user', 'content' => 'Resume des stats.'],
            ],
        ]);

        $response->assertOk();
        $content = (string) data_get($response->json(), 'data.content');

        $this->assertStringContainsString('School stats:', $content);
        $this->assertStringNotContainsString('Jane Secret', $content);
    }

    public function test_teacher_only_sees_assigned_classes(): void
    {
        $school = School::create(['name' => 'Test School', 'code' => 'TS2']);
        $year = AcademicYear::create([
            'school_id' => $school->id,
            'name' => '2025-2026',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_active' => true,
        ]);

        $classeA = Classe::create([
            'school_id' => $school->id,
            'academic_year_id' => $year->id,
            'name' => 'Classe A',
            'level' => 'L1',
        ]);

        $classeB = Classe::create([
            'school_id' => $school->id,
            'academic_year_id' => $year->id,
            'name' => 'Classe B',
            'level' => 'L2',
        ]);

        $matiere = Matiere::create([
            'school_id' => $school->id,
            'name' => 'Math',
            'code' => 'MATH',
            'coefficient' => 1,
        ]);

        $teacherUser = User::factory()->create();
        $teacher = Enseignant::create([
            'school_id' => $school->id,
            'first_name' => 'Teach',
            'last_name' => 'One',
            'email' => 'teach1@example.com',
            'phone' => '000000001',
            'user_id' => $teacherUser->id,
        ]);
        $teacher->classes()->attach($classeA->id);

        $otherTeacherUser = User::factory()->create();
        $otherTeacher = Enseignant::create([
            'school_id' => $school->id,
            'first_name' => 'Teach',
            'last_name' => 'Two',
            'email' => 'teach2@example.com',
            'phone' => '000000002',
            'user_id' => $otherTeacherUser->id,
        ]);
        $otherTeacher->classes()->attach($classeB->id);

        $studentA = Eleve::create([
            'school_id' => $school->id,
            'classe_id' => $classeA->id,
            'first_name' => 'Student',
            'last_name' => 'A',
            'gender' => 'M',
            'birth_date' => '2010-01-02',
        ]);

        $studentB = Eleve::create([
            'school_id' => $school->id,
            'classe_id' => $classeB->id,
            'first_name' => 'Student',
            'last_name' => 'B',
            'gender' => 'F',
            'birth_date' => '2010-01-03',
        ]);

        Note::create([
            'eleve_id' => $studentA->id,
            'matiere_id' => $matiere->id,
            'class_id' => $classeA->id,
            'academic_year_id' => $year->id,
            'value' => 14,
            'term' => 'T1',
        ]);

        Note::create([
            'eleve_id' => $studentB->id,
            'matiere_id' => $matiere->id,
            'class_id' => $classeB->id,
            'academic_year_id' => $year->id,
            'value' => 8,
            'term' => 'T1',
        ]);

        Timetable::create([
            'school_id' => $school->id,
            'academic_year_id' => $year->id,
            'class_id' => $classeA->id,
            'matiere_id' => $matiere->id,
            'day_of_week' => 1,
            'start_time' => '08:00',
            'end_time' => '09:00',
        ]);

        $teacherUser->assignRole('enseignant');
        Sanctum::actingAs($teacherUser);

        $response = $this->postJson('/api/ai-assistant', [
            'messages' => [
                ['role' => 'user', 'content' => 'Analyse des classes.'],
            ],
        ]);

        $response->assertOk();
        $content = (string) data_get($response->json(), 'data.content');

        $this->assertStringContainsString('Classe A', $content);
        $this->assertStringNotContainsString('Classe B', $content);
    }

    public function test_student_sees_only_own_data(): void
    {
        $school = School::create(['name' => 'Test School', 'code' => 'TS3']);
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
            'name' => 'Classe C',
            'level' => 'L3',
        ]);

        $matiere = Matiere::create([
            'school_id' => $school->id,
            'name' => 'History',
            'code' => 'HIS',
            'coefficient' => 1,
        ]);

        $studentUser = User::factory()->create();
        $student = Eleve::create([
            'school_id' => $school->id,
            'classe_id' => $classe->id,
            'first_name' => 'Alex',
            'last_name' => 'Student',
            'gender' => 'M',
            'birth_date' => '2010-02-01',
            'user_id' => $studentUser->id,
        ]);

        $otherUser = User::factory()->create();
        $otherStudent = Eleve::create([
            'school_id' => $school->id,
            'classe_id' => $classe->id,
            'first_name' => 'Chris',
            'last_name' => 'Other',
            'gender' => 'F',
            'birth_date' => '2010-02-02',
            'user_id' => $otherUser->id,
        ]);

        Note::create([
            'eleve_id' => $student->id,
            'matiere_id' => $matiere->id,
            'class_id' => $classe->id,
            'academic_year_id' => $year->id,
            'value' => 15,
            'term' => 'T1',
        ]);

        Note::create([
            'eleve_id' => $otherStudent->id,
            'matiere_id' => $matiere->id,
            'class_id' => $classe->id,
            'academic_year_id' => $year->id,
            'value' => 9,
            'term' => 'T1',
        ]);

        Timetable::create([
            'school_id' => $school->id,
            'academic_year_id' => $year->id,
            'class_id' => $classe->id,
            'matiere_id' => $matiere->id,
            'day_of_week' => 2,
            'start_time' => '10:00',
            'end_time' => '11:00',
        ]);

        $studentUser->assignRole('eleve');
        Sanctum::actingAs($studentUser);

        $response = $this->postJson('/api/ai-assistant', [
            'messages' => [
                ['role' => 'user', 'content' => 'Explique mes notes.'],
            ],
        ]);

        $response->assertOk();
        $content = (string) data_get($response->json(), 'data.content');

        $this->assertStringContainsString('Alex Student', $content);
        $this->assertStringNotContainsString('Chris Other', $content);
    }
}
