<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Absence;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\Expense;
use App\Models\Matiere;
use App\Models\Note;
use App\Models\Paiement;
use App\Models\ParentModel;
use App\Models\Salary;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * @group rag
 */
class AiRagEndToEndTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('RAG views require PostgreSQL.');
        }

        foreach (['admin', 'comptable', 'enseignant', 'eleve', 'parent'] as $role) {
            Role::firstOrCreate(['name' => $role]);
        }
    }

    public function test_admin_role_receives_school_overview_and_audit_logs(): void
    {
        ['school' => $school, 'year' => $year, 'class' => $class, 'matiere' => $matiere] = $this->seedBaseSchool();

        $teacherUser = User::factory()->create();
        $teacher = Enseignant::create([
            'school_id' => $school->id,
            'first_name' => 'Teach',
            'last_name' => 'Admin',
            'email' => 'teach-admin@example.com',
            'phone' => '000000000',
            'user_id' => $teacherUser->id,
        ]);

        $student = $this->createStudent($school, $class, 'Jane', 'Secret');

        Note::create([
            'eleve_id' => $student->id,
            'matiere_id' => $matiere->id,
            'class_id' => $class->id,
            'academic_year_id' => $year->id,
            'value' => 12.5,
            'term' => 'T1',
        ]);

        Absence::create([
            'school_id' => $school->id,
            'eleve_id' => $student->id,
            'date' => now()->toDateString(),
        ]);

        Paiement::create([
            'school_id' => $school->id,
            'eleve_id' => $student->id,
            'amount' => 200,
            'paid_amount' => 200,
            'payment_date' => now()->toDateString(),
            'status' => 'paye',
            'method' => 'cash',
        ]);

        Expense::create([
            'school_id' => $school->id,
            'category' => 'Utilities',
            'description' => 'Electricity',
            'amount' => 150,
            'expense_date' => now()->toDateString(),
        ]);

        Salary::create([
            'school_id' => $school->id,
            'teacher_id' => $teacher->id,
            'amount' => 300,
            'payment_date' => now()->toDateString(),
            'month' => now()->format('m'),
            'year' => (int) now()->format('Y'),
            'bonus' => 0,
            'deductions' => 0,
            'net_amount' => 300,
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

        $this->assertStringContainsString('School overview:', $content);
        $this->assertStringNotContainsString('Jane Secret', $content);

        $this->assertAuditLogged($admin);
    }

    public function test_accountant_role_receives_payment_status_summary(): void
    {
        ['school' => $school, 'year' => $year, 'class' => $class] = $this->seedBaseSchool();

        $student = $this->createStudent($school, $class, 'Paul', 'Account');

        Paiement::create([
            'school_id' => $school->id,
            'eleve_id' => $student->id,
            'amount' => 120,
            'paid_amount' => 0,
            'payment_date' => now()->toDateString(),
            'status' => 'en_retard',
            'method' => 'cash',
        ]);

        Paiement::create([
            'school_id' => $school->id,
            'eleve_id' => $student->id,
            'amount' => 120,
            'paid_amount' => 120,
            'payment_date' => now()->toDateString(),
            'status' => 'paye',
            'method' => 'cash',
        ]);

        $accountant = User::factory()->create();
        $accountant->assignRole('comptable');
        Sanctum::actingAs($accountant);

        $response = $this->postJson('/api/ai-assistant', [
            'messages' => [
                ['role' => 'user', 'content' => 'Etat des paiements.'],
            ],
        ]);

        $response->assertOk();
        $content = (string) data_get($response->json(), 'data.content');

        $this->assertStringContainsString('Payment status:', $content);
        $this->assertStringContainsString('en_retard=', $content);

        $this->assertAuditLogged($accountant);
    }

    public function test_teacher_role_only_sees_assigned_class_data(): void
    {
        ['school' => $school, 'year' => $year] = $this->seedBaseSchool();

        $classeA = $this->createClass($school, $year, 'Classe A', 'L1');
        $classeB = $this->createClass($school, $year, 'Classe B', 'L2');
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

        $studentA = $this->createStudent($school, $classeA, 'Student', 'A');
        $studentB = $this->createStudent($school, $classeB, 'Student', 'B');

        Note::create([
            'eleve_id' => $studentA->id,
            'matiere_id' => $matiere->id,
            'class_id' => $classeA->id,
            'academic_year_id' => $year->id,
            'value' => 8,
            'term' => 'T1',
        ]);

        Note::create([
            'eleve_id' => $studentB->id,
            'matiere_id' => $matiere->id,
            'class_id' => $classeB->id,
            'academic_year_id' => $year->id,
            'value' => 7,
            'term' => 'T1',
        ]);

        Absence::create([
            'school_id' => $school->id,
            'eleve_id' => $studentA->id,
            'date' => now()->toDateString(),
        ]);

        Absence::create([
            'school_id' => $school->id,
            'eleve_id' => $studentB->id,
            'date' => now()->toDateString(),
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

        $this->assertStringContainsString('Class Classe A', $content);
        $this->assertStringNotContainsString('Classe B', $content);

        $this->assertAuditLogged($teacherUser);
    }

    public function test_student_role_only_sees_own_records(): void
    {
        ['school' => $school, 'year' => $year, 'class' => $class, 'matiere' => $matiere] = $this->seedBaseSchool();

        $studentUser = User::factory()->create();
        $student = Eleve::create([
            'school_id' => $school->id,
            'classe_id' => $class->id,
            'first_name' => 'Alex',
            'last_name' => 'Student',
            'gender' => 'M',
            'birth_date' => '2010-02-01',
            'user_id' => $studentUser->id,
        ]);

        $otherUser = User::factory()->create();
        $otherStudent = Eleve::create([
            'school_id' => $school->id,
            'classe_id' => $class->id,
            'first_name' => 'Chris',
            'last_name' => 'Other',
            'gender' => 'F',
            'birth_date' => '2010-02-02',
            'user_id' => $otherUser->id,
        ]);

        Note::create([
            'eleve_id' => $student->id,
            'matiere_id' => $matiere->id,
            'class_id' => $class->id,
            'academic_year_id' => $year->id,
            'value' => 15,
            'term' => 'T1',
        ]);

        Note::create([
            'eleve_id' => $otherStudent->id,
            'matiere_id' => $matiere->id,
            'class_id' => $class->id,
            'academic_year_id' => $year->id,
            'value' => 9,
            'term' => 'T1',
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

        $this->assertStringContainsString('Student Alex Student', $content);
        $this->assertStringNotContainsString('Chris Other', $content);

        $this->assertAuditLogged($studentUser);
    }

    public function test_parent_role_only_sees_children_data(): void
    {
        ['school' => $school, 'year' => $year, 'class' => $class, 'matiere' => $matiere] = $this->seedBaseSchool();

        $parentUser = User::factory()->create();
        $parent = ParentModel::create([
            'school_id' => $school->id,
            'first_name' => 'Parent',
            'last_name' => 'One',
            'phone' => '000000003',
            'email' => 'parent1@example.com',
            'user_id' => $parentUser->id,
        ]);

        $child = $this->createStudent($school, $class, 'Child', 'One');
        $parent->eleves()->attach($child->id);

        Note::create([
            'eleve_id' => $child->id,
            'matiere_id' => $matiere->id,
            'class_id' => $class->id,
            'academic_year_id' => $year->id,
            'value' => 11,
            'term' => 'T1',
        ]);

        $otherParentUser = User::factory()->create();
        $otherParent = ParentModel::create([
            'school_id' => $school->id,
            'first_name' => 'Parent',
            'last_name' => 'Two',
            'phone' => '000000004',
            'email' => 'parent2@example.com',
            'user_id' => $otherParentUser->id,
        ]);

        $otherChild = $this->createStudent($school, $class, 'Child', 'Other');
        $otherParent->eleves()->attach($otherChild->id);

        Note::create([
            'eleve_id' => $otherChild->id,
            'matiere_id' => $matiere->id,
            'class_id' => $class->id,
            'academic_year_id' => $year->id,
            'value' => 9,
            'term' => 'T1',
        ]);

        $parentUser->assignRole('parent');
        Sanctum::actingAs($parentUser);

        $response = $this->postJson('/api/ai-assistant', [
            'messages' => [
                ['role' => 'user', 'content' => 'Resume scolaire.'],
            ],
        ]);

        $response->assertOk();
        $content = (string) data_get($response->json(), 'data.content');

        $this->assertStringContainsString('Child One', $content);
        $this->assertStringNotContainsString('Child Other', $content);

        $this->assertAuditLogged($parentUser);
    }

    public function test_rate_limiting_is_enforced_for_admin_role(): void
    {
        $this->seedBaseSchool();

        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        for ($i = 0; $i < 30; $i++) {
            $this->postJson('/api/ai-assistant', [
                'messages' => [
                    ['role' => 'user', 'content' => 'Ping'],
                ],
            ])->assertOk();
        }

        $response = $this->postJson('/api/ai-assistant', [
            'messages' => [
                ['role' => 'user', 'content' => 'Ping'],
            ],
        ]);

        $response->assertOk();
        $content = (string) data_get($response->json(), 'data.content');

        $this->assertStringContainsString("limite d'utilisation", $content);

        $rateLog = DB::table('ai_audit_logs')
            ->where('user_id', $admin->id)
            ->orderByDesc('id')
            ->first();

        $this->assertNotNull($rateLog);
        $this->assertSame('rate_limited', $rateLog->status);
        $this->assertNotEmpty($rateLog->correlation_id ?? null);
    }

    private function seedBaseSchool(): array
    {
        $school = School::create(['name' => 'Test School', 'code' => 'TS1']);
        $year = AcademicYear::create([
            'school_id' => $school->id,
            'name' => '2025-2026',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_active' => true,
        ]);

        $class = $this->createClass($school, $year, 'Classe A', 'L1');

        $matiere = Matiere::create([
            'school_id' => $school->id,
            'name' => 'Math',
            'code' => 'MATH',
            'coefficient' => 1,
        ]);

        return [
            'school' => $school,
            'year' => $year,
            'class' => $class,
            'matiere' => $matiere,
        ];
    }

    private function createClass(School $school, AcademicYear $year, string $name, string $level): Classe
    {
        return Classe::create([
            'school_id' => $school->id,
            'academic_year_id' => $year->id,
            'name' => $name,
            'level' => $level,
        ]);
    }

    private function createStudent(School $school, Classe $class, string $first, string $last): Eleve
    {
        return Eleve::create([
            'school_id' => $school->id,
            'classe_id' => $class->id,
            'first_name' => $first,
            'last_name' => $last,
            'gender' => 'M',
            'birth_date' => '2010-01-01',
        ]);
    }

    private function assertAuditLogged(User $user): void
    {
        $record = DB::table('ai_audit_logs')
            ->where('user_id', $user->id)
            ->orderByDesc('id')
            ->first();

        $this->assertNotNull($record);
        $this->assertNotEmpty($record->correlation_id ?? null);
        $this->assertNotEmpty($record->document_ids ?? null);
        $this->assertNull($record->question);
        $this->assertNull($record->queries);
    }
}
