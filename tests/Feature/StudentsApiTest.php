<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\Paiement;
use App\Models\School;
use App\Models\User;
use App\Support\SchoolResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StudentsApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();

        $role = Role::findOrCreate('admin');
        $permissions = [
            'eleve.view_any',
            'eleve.view',
            'eleve.create',
            'eleve.update',
            'eleve.delete',
        ];
        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }
        $role->syncPermissions($permissions);
    }

    private function createActiveSchool(): School
    {
        $school = School::create([
            'name' => 'Ecole Test',
            'code' => 'TEST',
            'is_active' => true,
        ]);

        SchoolResolver::requireActiveId();
        return $school;
    }

    public function test_index_returns_totals_and_filters_by_query(): void
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        $school = $this->createActiveSchool();	

        $academicYear = AcademicYear::create([
            'school_id' => $school->id,
            'name' => '2025-2026',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_active' => true,
        ]);

        $classe = Classe::create([
            'school_id' => $school->id,
            'academic_year_id' => $academicYear->id,
            'name' => '6A',
            'level' => '6eme',
            'capacity' => 30,
        ]);

        $studentAlpha = Eleve::create([
            'school_id' => $school->id,
            'classe_id' => $classe->id,
            'student_id' => 'S-001',
            'first_name' => 'Alex',
            'last_name' => 'Alpha',
            'gender' => 'M',
            'birth_date' => '2012-01-01',
        ]);

        $studentBeta = Eleve::create([
            'school_id' => $school->id,
            'classe_id' => $classe->id,
            'student_id' => 'S-002',
            'first_name' => 'Bea',
            'last_name' => 'Beta',
            'gender' => 'F',
            'birth_date' => '2012-02-02',
        ]);

        Paiement::create([
            'school_id' => $school->id,
            'eleve_id' => $studentAlpha->id,
            'amount' => 120,
            'paid_amount' => 90,
            'payment_date' => '2026-01-15',
            'method' => 'cash',
            'status' => 'partiel',
        ]);

        Paiement::create([
            'school_id' => $school->id,
            'eleve_id' => $studentBeta->id,
            'amount' => 200,
            'paid_amount' => 200,
            'payment_date' => '2026-01-20',
            'method' => 'cash',
            'status' => 'paye',
        ]);

        $response = $this->actingAs($user)->getJson('/api/eleves?per_page=15');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
        $response->assertJsonPath('data.0.last_name', 'Alpha');
        $response->assertJsonPath('data.0.total_due', 120.0);
        $response->assertJsonPath('data.0.total_paid', 90.0);

        $filteredResponse = $this->actingAs($user)->getJson('/api/eleves?per_page=15&q=Beta');

        $filteredResponse->assertOk();
        $filteredResponse->assertJsonCount(1, 'data');
        $filteredResponse->assertJsonPath('data.0.last_name', 'Beta');
        $filteredResponse->assertJsonPath('data.0.total_paid', 200.0);
    }

    public function test_show_returns_student_profile_details(): void
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        $school = $this->createActiveSchool();

        $academicYear = AcademicYear::create([
            'school_id' => $school->id,
            'name' => '2025-2026',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_active' => true,
        ]);

        $classe = Classe::create([
            'school_id' => $school->id,
            'academic_year_id' => $academicYear->id,
            'name' => '6A',
            'level' => '6eme',
            'capacity' => 30,
        ]);

        $student = Eleve::create([
            'school_id' => $school->id,
            'classe_id' => $classe->id,
            'student_id' => 'S-100',
            'first_name' => 'Sara',
            'last_name' => 'Dia',
            'gender' => 'F',
            'birth_date' => '2012-03-10',
            'address' => 'Rue 1',
            'parent_name' => 'M. Dia',
            'parent_phone' => '+221000',
            'parent_email' => 'parent@example.com',
        ]);

        $response = $this->actingAs($user)->getJson("/api/eleves/{$student->id}");

        $response->assertOk();
        $response->assertJsonPath('data.birth_date', '2012-03-10');
        $response->assertJsonPath('data.parent_email', 'parent@example.com');
    }

    public function test_update_flushes_cached_index_data(): void
    {
        $school = $this->createActiveSchool();

        $academicYear = AcademicYear::create([
            'school_id' => $school->id,
            'name' => '2025-2026',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_active' => true,
        ]);

        $classe = Classe::create([
            'school_id' => $school->id,
            'academic_year_id' => $academicYear->id,
            'name' => '6A',
            'level' => '6eme',
            'capacity' => 30,
        ]);

        $student = Eleve::create([
            'school_id' => $school->id,
            'classe_id' => $classe->id,
            'student_id' => 'S-101',
            'first_name' => 'Kofi',
            'last_name' => 'Old',
            'gender' => 'M',
            'birth_date' => '2011-02-01',
        ]);

        $user = User::factory()->create();
        $user->assignRole('admin');

        $this->actingAs($user)->getJson("/api/eleves?per_page=15&school_id={$school->id}")->assertOk();

        $update = $this->actingAs($user)->putJson("/api/eleves/{$student->id}", [
            'last_name' => 'New',
        ]);

        $update->assertOk();

        $refetch = $this->actingAs($user)->getJson("/api/eleves?per_page=15&school_id={$school->id}");
        $refetch->assertOk();
        $refetch->assertJsonPath('data.0.last_name', 'New');
    }
}
