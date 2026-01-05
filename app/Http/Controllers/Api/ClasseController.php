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
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $schoolId = $request->integer('school_id');
        $academicYearId = $request->integer('academic_year_id');
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

        $result = $cache->remember($key, now()->addMinutes(5), function () use ($request, $perPage, $search) {
            $query = Classe::query()
                ->with(['school', 'academicYear'])
                ->orderBy('level')
                ->orderBy('name');

            if ($request->filled('school_id')) {
                $query->where('school_id', $request->integer('school_id'));
            }

            if ($request->filled('academic_year_id')) {
                $query->where('academic_year_id', $request->integer('academic_year_id'));
            }

            if ($search !== '') {
                $query->where(function ($builder) use ($search) {
                    $builder
                        ->where('name', 'ilike', "%{$search}%")
                        ->orWhere('level', 'ilike', "%{$search}%");
                });
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
            'school_id' => ['required', 'integer', 'exists:schools,id'],
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'school_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'name' => ['required', 'string', 'max:100'],
            'level' => ['nullable', 'string', 'max:100'],
            'capacity' => ['nullable', 'integer', 'min:1'],
        ]);

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
