<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EnrollmentResource;
use App\Models\Enrollment;
use App\Support\CacheKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class EnrollmentController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $request->integer('school_id');
        $academicYearId = $request->integer('school_year_id') ?: $request->integer('academic_year_id');
        $perPage = $request->integer('per_page');
        $page = $request->integer('page') ?: 1;

        $keyParts = [$perPage ?: 'all', $page, $request->integer('class_id'), $request->integer('student_id')];
        $key = CacheKey::key('enrollments:index', $schoolId, $academicYearId, $keyParts);
        $tags = CacheKey::tags($schoolId, $academicYearId);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $result = $cache->remember($key, now()->addMinutes(5), function () use ($request, $perPage, $academicYearId) {
            $query = Enrollment::query()
                ->with(['eleve', 'classe'])
                ->orderByDesc('created_at');

            if ($request->filled('class_id')) {
                $query->where('classe_id', $request->integer('class_id'));
            }

            if ($request->filled('student_id')) {
                $query->where('eleve_id', $request->integer('student_id'));
            }

            if ($academicYearId) {
                $query->where('academic_year_id', $academicYearId);
            }

            return $perPage ? $query->paginate($perPage) : $query->get();
        });

        return EnrollmentResource::collection($result);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => ['required', 'integer', 'exists:eleves,id'],
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'school_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'enrollment_date' => ['nullable', 'date'],
        ]);

        $enrollment = Enrollment::create([
            'eleve_id' => $validated['student_id'],
            'classe_id' => $validated['class_id'],
            'academic_year_id' => $validated['school_year_id'],
            'enrollment_date' => $validated['enrollment_date'] ?? now()->toDateString(),
        ]);

        Cache::tags(CacheKey::tags(null, $validated['school_year_id']))->flush();

        return new EnrollmentResource($enrollment->load(['eleve', 'classe']));
    }

    public function destroy(Enrollment $enrollment)
    {
        $academicYearId = $enrollment->academic_year_id;
        $enrollment->delete();

        Cache::tags(CacheKey::tags(null, $academicYearId))->flush();

        return response()->noContent();
    }
}
