<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StudentImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_students_returns_errors_with_details(): void
    {
        Role::findOrCreate('admin');

        $school = School::create([
            'name' => 'Smart School',
            'code' => 'SS',
            'is_active' => true,
        ]);

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

        $user = User::factory()->create();
        $user->assignRole('admin');

        $csv = implode("\n", [
            'first_name;last_name;gender;birth_date;class_name;academic_year',
            "Jean;Dupont;M;2012-05-10;{$classe->name};{$academicYear->name}",
            ";SansPrenom;F;2012-06-11;{$classe->name};{$academicYear->name}",
        ]);

        $file = UploadedFile::fake()->createWithContent('students.csv', $csv);

        $response = $this->actingAs($user)->postJson("/api/import/students?school_id={$school->id}", [
            'file' => $file,
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.imported', 1);
        $response->assertJsonPath('data.errors.0.row', 3);

        $this->assertTrue(Eleve::query()->where('first_name', 'Jean')->exists());
    }
}
