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
    public function __construct()
    {
        $this->authorizeResource(Enrollment::class, 'enrollment');
    }

    public function index(Request $request)
    {
        $schoolId = $this->resolveSchoolId($request);
        $academicYearId = $request->integer('school_year_id') ?: $request->integer('academic_year_id');
        $user = $request->user();
        $teacherClassIds = [];
        if ($user?->hasRole('enseignant')) {
            $teacherClassIds = $user->teacherClassIds();
            if (empty($teacherClassIds)) {
                $teacherClassIds = [0];
            }
        }
        $perPage = $request->integer('per_page');
        $page = $request->integer('page') ?: 1;

        $keyParts = [$perPage ?: 'all', $page, $request->integer('class_id'), $request->integer('student_id')];
        $key = CacheKey::key('enrollments:index', $schoolId, $academicYearId, $keyParts);
        $tags = CacheKey::tags($schoolId, $academicYearId);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $result = $cache->remember($key, now()->addMinutes(5), function () use ($request, $perPage, $academicYearId, $teacherClassIds, $schoolId) {
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

            if ($schoolId) {
                $query->whereHas('classe', function ($builder) use ($schoolId) {
                    $builder->where('school_id', $schoolId);
                });
            }

            if (! empty($teacherClassIds)) {
                $query->whereIn('classe_id', $teacherClassIds);
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

        $schoolId = $this->resolveSchoolId($request);
        $classe = \App\Models\Classe::query()->find($validated['class_id']);
        if ($classe && $classe->school_id !== $schoolId) {
            return response()->json(['message' => 'Accès refusé à cette classe.'], 403);
        }

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
