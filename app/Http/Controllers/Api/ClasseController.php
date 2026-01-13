<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClasseResource;
use App\Models\Classe;
use App\Support\CacheKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ClasseController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Classe::class, 'classe');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $schoolId = $this->resolveSchoolId($request);
        $academicYearId = $request->integer('academic_year_id');
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
        $search = trim((string) $request->string('q'));

        $keyParts = [$perPage ?: 'all', $page];
        if ($search !== '') {
            $keyParts[] = $search;
        }

        $key = CacheKey::key('classes:index', $schoolId, $academicYearId, $keyParts);
        $tags = CacheKey::tags($schoolId, $academicYearId);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $result = $cache->remember($key, now()->addMinutes(5), function () use ($request, $perPage, $search, $teacherClassIds, $schoolId, $academicYearId) {
            $query = Classe::query()
                ->with(['school', 'academicYear'])
                ->orderBy('level')
                ->orderBy('name');

            if ($schoolId) {
                $query->where('school_id', $schoolId);
            }

            if ($academicYearId) {
                $query->where('academic_year_id', $academicYearId);
            }

            if ($search !== '') {
                $query->where(function ($builder) use ($search) {
                    $builder
                        ->where('name', 'ilike', "%{$search}%")
                        ->orWhere('level', 'ilike', "%{$search}%");
                });
            }

            if (! empty($teacherClassIds)) {
                $query->whereIn('id', $teacherClassIds);
            }

            return $perPage ? $query->paginate($perPage) : $query->get();
        });

        return ClasseResource::collection($result);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'school_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'name' => ['required', 'string', 'max:100'],
            'level' => ['nullable', 'string', 'max:100'],
            'capacity' => ['nullable', 'integer', 'min:1'],
        ]);

        $schoolId = $this->resolveSchoolId($request);
        $validated['school_id'] = $schoolId;

        if (empty($validated['school_id'])) {
            $validated['school_id'] = $request->user()?->school_id
                ?? \App\Models\School::query()->value('id');
        }

        if (empty($validated['academic_year_id']) && ! empty($validated['school_year_id'])) {
            $validated['academic_year_id'] = $validated['school_year_id'];
        }
        unset($validated['school_year_id']);

        $classe = Classe::create($validated);
        Cache::tags(CacheKey::tags($classe->school_id, $classe->academic_year_id))->flush();

        return new ClasseResource($classe);
    }

    /**
     * Display the specified resource.
     */
    public function show(Classe $classe)
    {
        $user = request()->user();
        if ($user?->hasRole('enseignant')) {
            if (! in_array($classe->id, $user->teacherClassIds(), true)) {
                return response()->json(['message' => 'Accès refusé à cette classe.'], 403);
            }
        }

        $schoolId = $classe->school_id;
        $academicYearId = $classe->academic_year_id;
        $key = CacheKey::key('classes:show', $schoolId, $academicYearId, [$classe->id]);
        $tags = CacheKey::tags($schoolId, $academicYearId);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $resource = $cache->remember($key, now()->addMinutes(5), function () use ($classe) {
            return $classe->load(['school', 'academicYear']);
        });

        return new ClasseResource($resource);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Classe $classe)
    {
        $validated = $request->validate([
            'school_id' => ['sometimes', 'integer', 'exists:schools,id'],
            'academic_year_id' => ['sometimes', 'integer', 'exists:academic_years,id'],
            'school_year_id' => ['sometimes', 'integer', 'exists:academic_years,id'],
            'name' => ['sometimes', 'string', 'max:100'],
            'level' => ['sometimes', 'nullable', 'string', 'max:100'],
            'capacity' => ['sometimes', 'integer', 'min:1'],
        ]);

        $schoolId = $this->resolveSchoolId($request);
        $validated['school_id'] = $schoolId;

        if (array_key_exists('school_year_id', $validated) && empty($validated['academic_year_id'])) {
            $validated['academic_year_id'] = $validated['school_year_id'];
        }
        unset($validated['school_year_id']);

        $classe->update($validated);
        Cache::tags(CacheKey::tags($classe->school_id, $classe->academic_year_id))->flush();

        return new ClasseResource($classe);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Classe $classe)
    {
        $schoolId = $classe->school_id;
        $academicYearId = $classe->academic_year_id;
        $classe->delete();

        Cache::tags(CacheKey::tags($schoolId, $academicYearId))->flush();

        return response()->noContent();
    }
}
