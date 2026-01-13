<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
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
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MockProdDataCleanupSeeder extends Seeder
{
    public function run(): void
    {
        $prefix = 'MOCK_PROD_';
        $schoolIds = School::where('code', 'like', $prefix.'%')->pluck('id')->all();

        if (empty($schoolIds)) {
            return;
        }

        DB::transaction(function () use ($schoolIds): void {
            $classIds = Classe::whereIn('school_id', $schoolIds)->pluck('id')->all();
            $studentIds = Eleve::whereIn('school_id', $schoolIds)->pluck('id')->all();
            $teacherIds = Enseignant::whereIn('school_id', $schoolIds)->pluck('id')->all();
            $parentIds = ParentModel::whereIn('school_id', $schoolIds)->pluck('id')->all();

            if (! empty($classIds)) {
                DB::table('classe_enseignant')->whereIn('classe_id', $classIds)->delete();
            }

            if (! empty($parentIds) || ! empty($studentIds)) {
                DB::table('eleve_parent')
                    ->when(! empty($parentIds), fn ($query) => $query->whereIn('parent_id', $parentIds))
                    ->when(! empty($studentIds), fn ($query) => $query->orWhereIn('eleve_id', $studentIds))
                    ->delete();
            }

            Note::whereIn('eleve_id', $studentIds)->delete();
            Paiement::whereIn('school_id', $schoolIds)->delete();
            Expense::whereIn('school_id', $schoolIds)->delete();
            Salary::whereIn('school_id', $schoolIds)->delete();
            DB::table('absences')->whereIn('school_id', $schoolIds)->delete();
            DB::table('timetables')->whereIn('school_id', $schoolIds)->delete();

            Eleve::whereIn('id', $studentIds)->delete();
            Enseignant::whereIn('id', $teacherIds)->delete();
            ParentModel::whereIn('id', $parentIds)->delete();
            Classe::whereIn('id', $classIds)->delete();
            Matiere::whereIn('school_id', $schoolIds)->delete();
            AcademicYear::whereIn('school_id', $schoolIds)->delete();
            School::whereIn('id', $schoolIds)->delete();

            User::where('email', 'like', 'mock+prod_%@example.com')->delete();
        });
    }
}
