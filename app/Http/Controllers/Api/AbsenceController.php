<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AbsenceResource;
use App\Models\Absence;
use App\Models\AcademicYear;
use App\Support\CacheKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AbsenceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $schoolId = $request->integer('school_id') ?: $request->user()?->school_id;
        $academicYearId = $request->integer('academic_year_id');
        if (empty($academicYearId) && ! empty($schoolId)) {
            $academicYearId = AcademicYear::query()
                ->where('school_id', $schoolId)
                ->where('is_active', true)
                ->value('id');
        }
        $perPage = $request->integer('per_page') ?: 15;
        $page = $request->integer('page') ?: 1;

        $studentIds = collect(explode(',', (string) $request->string('student_ids')))
            ->map(fn ($value) => (int) trim($value))
            ->filter();
        $keyParts = [$perPage, $page, $request->integer('eleve_id')];
        if ($studentIds->isNotEmpty()) {
            $keyParts[] = $studentIds->implode(',');
        }
        $key = CacheKey::key('absences:index', $schoolId, $academicYearId, $keyParts);
        $tags = CacheKey::tags($schoolId, $academicYearId);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $result = $cache->remember($key, now()->addMinutes(5), function () use ($request, $perPage, $studentIds) {
            $query = Absence::query()
                ->select([
                    'id',
                    'school_id',
                    'eleve_id',
                    'classe_id',
                    'academic_year_id',
                    'date',
                    'absence_date',
                    'absence_type',
                    'is_justified',
                    'justified',
                    'reason',
                    'duration_minutes',
                    'created_at',
                    'updated_at',
                ])
                ->with([
                    'eleve:id,student_id,full_name,first_name,last_name',
                    'classe:id,name,level',
                ])
                ->orderByDesc('date')
                ->orderByDesc('id');

            if (! empty($schoolId)) {
                $query->where('school_id', $schoolId);
            }

            if (! empty($academicYearId)) {
                $yearId = $academicYearId;
                $query->whereHas('eleve.classe', function ($builder) use ($yearId) {
                    $builder->where('academic_year_id', $yearId);
                });
            }

            if ($request->filled('eleve_id')) {
                $query->where('eleve_id', $request->integer('eleve_id'));
            }

            if ($studentIds->isNotEmpty()) {
                $query->whereIn('eleve_id', $studentIds->all());
            }

            if ($request->filled('class_id')) {
                $query->where('classe_id', $request->integer('class_id'));
            }

            return $query->paginate($perPage);
        });

        return AbsenceResource::collection($result);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'eleve_id' => ['required', 'integer', 'exists:eleves,id'],
            'class_id' => ['nullable', 'integer', 'exists:classes,id'],
            'school_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'absence_date' => ['required', 'date'],
            'absence_type' => ['nullable', 'string', 'max:20'],
            'justified' => ['sometimes', 'boolean'],
            'reason' => ['nullable', 'string', 'max:255'],
            'duration_minutes' => ['sometimes', 'integer', 'min:0'],
        ], [
            'eleve_id.required' => "L'eleve est obligatoire.",
            'absence_date.required' => "La date d'absence est obligatoire.",
            'absence_date.date' => "La date d'absence est invalide.",
            'duration_minutes.min' => 'La duree doit etre positive.',
        ]);

        $payload = $validated;
        $payload['classe_id'] = $validated['class_id'] ?? null;
        $payload['academic_year_id'] = $validated['school_year_id'] ?? null;
        $payload['date'] = $validated['absence_date'];
        $payload['is_justified'] = $validated['justified'] ?? false;

        if (empty($payload['school_id'])) {
            $payload['school_id'] = $request->user()?->school_id;
        }
        $payload['created_by'] = $request->user()?->id;

        $absence = Absence::create($payload);
        $academicYearId = $absence->academic_year_id ?? $absence->eleve?->classe?->academic_year_id;
        Cache::tags(CacheKey::tags($absence->school_id, $academicYearId))->flush();

        return new AbsenceResource($absence->load([
            'eleve:id,student_id,full_name,first_name,last_name',
            'classe:id,name,level',
        ]));
    }

    /**
     * Display the specified resource.
     */
    public function show(Absence $absence)
    {
        $schoolId = $absence->school_id;
        $academicYearId = $absence->eleve?->classe?->academic_year_id;
        $key = CacheKey::key('absences:show', $schoolId, $academicYearId, [$absence->id]);
        $tags = CacheKey::tags($schoolId, $academicYearId);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $resource = $cache->remember($key, now()->addMinutes(5), function () use ($absence) {
            return $absence->load([
                'eleve:id,student_id,full_name,first_name,last_name',
                'classe:id,name,level',
            ]);
        });

        return new AbsenceResource($resource);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Absence $absence)
    {
        $validated = $request->validate([
            'school_id' => ['sometimes', 'integer', 'exists:schools,id'],
            'eleve_id' => ['sometimes', 'integer', 'exists:eleves,id'],
            'class_id' => ['sometimes', 'nullable', 'integer', 'exists:classes,id'],
            'school_year_id' => ['sometimes', 'nullable', 'integer', 'exists:academic_years,id'],
            'absence_date' => ['sometimes', 'date'],
            'absence_type' => ['sometimes', 'nullable', 'string', 'max:20'],
            'justified' => ['sometimes', 'boolean'],
            'reason' => ['sometimes', 'nullable', 'string', 'max:255'],
            'duration_minutes' => ['sometimes', 'integer', 'min:0'],
        ], [
            'absence_date.date' => "La date d'absence est invalide.",
            'duration_minutes.min' => 'La duree doit etre positive.',
        ]);

        if (array_key_exists('class_id', $validated)) {
            $validated['classe_id'] = $validated['class_id'];
            unset($validated['class_id']);
        }
        if (array_key_exists('school_year_id', $validated)) {
            $validated['academic_year_id'] = $validated['school_year_id'];
            unset($validated['school_year_id']);
        }
        if (array_key_exists('absence_date', $validated)) {
            $validated['date'] = $validated['absence_date'];
        }
        if (array_key_exists('justified', $validated)) {
            $validated['is_justified'] = $validated['justified'];
        }

        $absence->update($validated);
        $academicYearId = $absence->academic_year_id ?? $absence->eleve?->classe?->academic_year_id;
        Cache::tags(CacheKey::tags($absence->school_id, $academicYearId))->flush();

        return new AbsenceResource($absence->load([
            'eleve:id,student_id,full_name,first_name,last_name',
            'classe:id,name,level',
        ]));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Absence $absence)
    {
        $schoolId = $absence->school_id;
        $academicYearId = $absence->eleve?->classe?->academic_year_id;
        $absence->delete();

        Cache::tags(CacheKey::tags($schoolId, $academicYearId))->flush();

        return response()->noContent();
    }
}
