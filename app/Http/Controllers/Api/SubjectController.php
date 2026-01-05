<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubjectResource;
use App\Models\Matiere;
use App\Support\CacheKey;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SubjectController extends Controller
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

        $key = CacheKey::key('subjects:index', $schoolId, null, $keyParts);
        $tags = CacheKey::tags($schoolId, null);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $result = $cache->remember($key, now()->addMinutes(5), function () use ($request, $perPage, $search) {
            $query = Matiere::query()
                ->orderBy('name');

            if ($request->filled('school_id')) {
                $query->where('school_id', $request->integer('school_id'));
            }

            if ($search !== '') {
                $query->where(function ($builder) use ($search) {
                    $builder
                        ->where('name', 'ilike', "%{$search}%")
                        ->orWhere('code', 'ilike', "%{$search}%");
                });
            }

            return $perPage ? $query->paginate($perPage) : $query->get();
        });

        return SubjectResource::collection($result);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50'],
            'coefficient' => ['nullable', 'numeric'],
        ]);

        if (empty($validated['school_id'])) {
            $validated['school_id'] = $request->user()?->school_id ?? School::query()->value('id');
        }

        $subject = Matiere::create($validated);
        Cache::tags(CacheKey::tags($subject->school_id, null))->flush();

        return new SubjectResource($subject);
    }

    public function update(Request $request, Matiere $subject)
    {
        $validated = $request->validate([
            'school_id' => ['sometimes', 'integer', 'exists:schools,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'code' => ['sometimes', 'string', 'max:50'],
            'coefficient' => ['sometimes', 'numeric'],
        ]);

        $subject->update($validated);
        Cache::tags(CacheKey::tags($subject->school_id, null))->flush();

        return new SubjectResource($subject);
    }

    public function destroy(Matiere $subject)
    {
        $schoolId = $subject->school_id;
        $subject->delete();

        Cache::tags(CacheKey::tags($schoolId, null))->flush();

        return response()->noContent();
    }
}
