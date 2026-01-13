<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\Note;
use App\Models\Paiement;
use App\Support\CacheKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function summary(Request $request)
    {
        $schoolId = $this->resolveSchoolId($request);
        $academicYearId = $request->integer('academic_year_id');

        $key = CacheKey::key('stats:summary', $schoolId, $academicYearId);
        $tags = CacheKey::tags($schoolId, $academicYearId);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $data = $cache->remember($key, now()->addMinutes(10), function () use ($schoolId, $academicYearId) {
            $paiementsQuery = Paiement::query();
            $absencesQuery = Absence::query();
            $notesQuery = Note::query();

            if ($schoolId) {
                $paiementsQuery->where('school_id', $schoolId);
                $absencesQuery->where('school_id', $schoolId);
                $notesQuery->where('school_id', $schoolId);
            }

            if ($academicYearId) {
                $paiementsQuery->whereHas('eleve.classe', function ($builder) use ($academicYearId) {
                    $builder->where('academic_year_id', $academicYearId);
                });

                $absencesQuery->whereHas('eleve.classe', function ($builder) use ($academicYearId) {
                    $builder->where('academic_year_id', $academicYearId);
                });

                $notesQuery->where('academic_year_id', $academicYearId);
            }

            $paymentsByStatus = (clone $paiementsQuery)
                ->select('status', DB::raw('COUNT(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status')
                ->toArray();

            $averageNote = (clone $notesQuery)->avg('value');

            return [
                'payments_by_status' => $paymentsByStatus,
                'absences_total' => $absencesQuery->count(),
                'notes_average' => $averageNote !== null ? (float) $averageNote : null,
            ];
        });

        return response()->json(['data' => $data]);
    }
}
