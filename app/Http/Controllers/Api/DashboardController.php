<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\Note;
use App\Models\Paiement;
use App\Support\CacheKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $schoolId = $request->integer('school_id');
        $academicYearId = $request->integer('academic_year_id');

        $key = CacheKey::key('dashboard:summary', $schoolId, $academicYearId);
        $tags = CacheKey::tags($schoolId, $academicYearId);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $data = $cache->remember($key, now()->addMinutes(10), function () use ($schoolId, $academicYearId) {
            $elevesQuery = Eleve::query();
            $classesQuery = Classe::query();
            $paiementsQuery = Paiement::query();
            $absencesQuery = Absence::query();
            $notesQuery = Note::query();

            if ($schoolId) {
                $elevesQuery->where('school_id', $schoolId);
                $classesQuery->where('school_id', $schoolId);
                $paiementsQuery->where('school_id', $schoolId);
                $absencesQuery->where('school_id', $schoolId);
                $notesQuery->where('school_id', $schoolId);
            }

            if ($academicYearId) {
                $elevesQuery->whereHas('classe', function ($builder) use ($academicYearId) {
                    $builder->where('academic_year_id', $academicYearId);
                });

                $classesQuery->where('academic_year_id', $academicYearId);

                $paiementsQuery->whereHas('eleve.classe', function ($builder) use ($academicYearId) {
                    $builder->where('academic_year_id', $academicYearId);
                });

                $absencesQuery->whereHas('eleve.classe', function ($builder) use ($academicYearId) {
                    $builder->where('academic_year_id', $academicYearId);
                });

                $notesQuery->where('academic_year_id', $academicYearId);
            }

            $totalPaid = (clone $paiementsQuery)
                ->selectRaw('COALESCE(SUM(COALESCE(paid_amount, amount)), 0) as total')
                ->value('total');

            return [
                'total_eleves' => $elevesQuery->count(),
                'total_classes' => $classesQuery->count(),
                'total_paiements' => $paiementsQuery->count(),
                'total_absences' => $absencesQuery->count(),
                'total_notes' => $notesQuery->count(),
                'total_paid' => (float) $totalPaid,
            ];
        });

        return response()->json(['data' => $data]);
    }
}
