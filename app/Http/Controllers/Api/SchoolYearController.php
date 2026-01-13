<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SchoolYearResource;
use App\Models\AcademicYear;
use App\Support\CacheKey;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SchoolYearController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(AcademicYear::class, 'school_year');
    }

    public function index(Request $request)
    {
        $schoolId = $this->resolveSchoolId($request);
        $key = CacheKey::key('school_years:index', $schoolId, null);
        $tags = CacheKey::tags($schoolId, null);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $result = $cache->remember($key, now()->addMinutes(5), function () use ($schoolId) {
            $query = AcademicYear::query()->orderByDesc('start_date');
            if ($schoolId) {
                $query->where('school_id', $schoolId);
            }
            return $query->get();
        });

        return SchoolYearResource::collection($result);
    }

    public function show(AcademicYear $schoolYear)
    {
        return new SchoolYearResource($schoolYear);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'name' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date'],
            'is_current' => ['nullable', 'boolean'],
        ]);

        $schoolId = $this->resolveSchoolId($request);
        $validated['school_id'] = $schoolId;

        if (empty($validated['school_id'])) {
            $validated['school_id'] = $request->user()?->school_id ?? School::query()->value('id');
        }

        $year = AcademicYear::create([
            'school_id' => $validated['school_id'] ?? null,
            'name' => $validated['name'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'is_active' => (bool) ($validated['is_current'] ?? false),
        ]);

        if (! empty($validated['is_current'])) {
            AcademicYear::query()
                ->where('id', '!=', $year->id)
                ->where('school_id', $year->school_id)
                ->update(['is_active' => false]);
        }

        Cache::tags(CacheKey::tags($year->school_id, null))->flush();

        return new SchoolYearResource($year);
    }

    public function update(Request $request, AcademicYear $schoolYear)
    {
        $validated = $request->validate([
            'school_id' => ['sometimes', 'integer', 'exists:schools,id'],
            'name' => ['sometimes', 'string', 'max:100'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date'],
            'is_current' => ['sometimes', 'boolean'],
        ]);

        $schoolId = $this->resolveSchoolId($request);
        $validated['school_id'] = $schoolId;

        if (array_key_exists('is_current', $validated)) {
            $validated['is_active'] = (bool) $validated['is_current'];
            unset($validated['is_current']);
        }

        $schoolYear->update($validated);

        if (! empty($validated['is_active'])) {
            AcademicYear::query()
                ->where('id', '!=', $schoolYear->id)
                ->where('school_id', $schoolYear->school_id)
                ->update(['is_active' => false]);
        }

        Cache::tags(CacheKey::tags($schoolYear->school_id, null))->flush();

        return new SchoolYearResource($schoolYear);
    }

    public function setCurrent(AcademicYear $schoolYear)
    {
        AcademicYear::query()
            ->where('school_id', $schoolYear->school_id)
            ->update(['is_active' => false]);

        $schoolYear->update(['is_active' => true]);

        Cache::tags(CacheKey::tags($schoolYear->school_id, null))->flush();

        return new SchoolYearResource($schoolYear);
    }

    public function destroy(AcademicYear $schoolYear)
    {
        if ($schoolYear->is_active) {
            return response()->json(['message' => "Impossible de supprimer l'année scolaire courante."], 422);
        }

        $schoolId = $schoolYear->school_id;
        $schoolYear->delete();

        Cache::tags(CacheKey::tags($schoolId, null))->flush();

        return response()->noContent();
    }
}
