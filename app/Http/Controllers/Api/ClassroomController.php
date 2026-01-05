<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClassroomResource;
use App\Models\Classroom;
use App\Support\CacheKey;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ClassroomController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $request->integer('school_id');
        $perPage = $request->integer('per_page');
        $page = $request->integer('page') ?: 1;
        $search = trim((string) $request->string('q'));

        $keyParts = [$perPage ?: 'all', $page];
        if ($search !== '') {
            $keyParts[] = $search;
        }

        $key = CacheKey::key('classrooms:index', $schoolId, null, $keyParts);
        $tags = CacheKey::tags($schoolId, null);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $result = $cache->remember($key, now()->addMinutes(5), function () use ($request, $perPage, $search) {
            $query = Classroom::query()
                ->orderBy('name');

            if ($request->filled('school_id')) {
                $query->where('school_id', $request->integer('school_id'));
            }

            if ($search !== '') {
                $query->where(function ($builder) use ($search) {
                    $builder
                        ->where('name', 'ilike', "%{$search}%")
                        ->orWhere('building', 'ilike', "%{$search}%");
                });
            }

            return $perPage ? $query->paginate($perPage) : $query->get();
        });

        return ClassroomResource::collection($result);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'name' => ['required', 'string', 'max:255'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'building' => ['nullable', 'string', 'max:255'],
            'floor' => ['nullable', 'integer'],
            'equipment' => ['nullable', 'array'],
            'equipment.*' => ['string', 'max:100'],
        ]);

        if (empty($validated['school_id'])) {
            $validated['school_id'] = $request->user()?->school_id ?? School::query()->value('id');
        }

        $classroom = Classroom::create($validated);
        Cache::tags(CacheKey::tags($classroom->school_id, null))->flush();

        return new ClassroomResource($classroom);
    }

    public function update(Request $request, Classroom $classroom)
    {
        $validated = $request->validate([
            'school_id' => ['sometimes', 'integer', 'exists:schools,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'capacity' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'building' => ['sometimes', 'nullable', 'string', 'max:255'],
            'floor' => ['sometimes', 'nullable', 'integer'],
            'equipment' => ['sometimes', 'nullable', 'array'],
            'equipment.*' => ['string', 'max:100'],
        ]);

        $classroom->update($validated);
        Cache::tags(CacheKey::tags($classroom->school_id, null))->flush();

        return new ClassroomResource($classroom);
    }

    public function destroy(Classroom $classroom)
    {
        $schoolId = $classroom->school_id;
        $classroom->delete();

        Cache::tags(CacheKey::tags($schoolId, null))->flush();

        return response()->noContent();
    }
}
