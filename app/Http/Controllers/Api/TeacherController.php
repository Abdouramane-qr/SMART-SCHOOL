<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeacherResource;
use App\Models\Enseignant;
use App\Models\TeacherAudit;
use App\Support\CacheKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class TeacherController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $request->integer('school_id');
        $userId = $request->integer('user_id');
        $key = CacheKey::key('teachers:index', $schoolId, null, [$userId ?: null]);
        $tags = CacheKey::tags($schoolId, null);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $result = $cache->remember($key, now()->addMinutes(5), function () use ($request, $userId) {
            $query = Enseignant::query()->with('user')->orderByDesc('created_at');
            if ($request->filled('school_id')) {
                $query->where('school_id', $request->integer('school_id'));
            }
            if ($userId) {
                $query->where('user_id', $userId);
            }
            return $query->get();
        });

        return TeacherResource::collection($result);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'first_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'specialization' => ['nullable', 'string', 'max:100'],
            'hire_date' => ['nullable', 'date'],
            'monthly_salary' => ['nullable', 'numeric', 'min:0'],
        ]);

        $teacher = Enseignant::create($validated);
        TeacherAudit::create([
            'teacher_id' => $teacher->id,
            'action' => 'INSERT',
            'new_data' => $validated,
            'changed_by' => $request->user()?->id,
        ]);
        Cache::tags(CacheKey::tags($teacher->school_id, null))->flush();

        return new TeacherResource($teacher->load('user'));
    }

    public function show(Enseignant $teacher)
    {
        return new TeacherResource($teacher->load('user'));
    }

    public function update(Request $request, Enseignant $teacher)
    {
        $validated = $request->validate([
            'school_id' => ['sometimes', 'integer', 'exists:schools,id'],
            'first_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'last_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'user_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'specialization' => ['sometimes', 'nullable', 'string', 'max:100'],
            'hire_date' => ['sometimes', 'nullable', 'date'],
            'monthly_salary' => ['sometimes', 'nullable', 'numeric', 'min:0'],
        ]);

        $oldData = $teacher->toArray();
        $teacher->update($validated);
        TeacherAudit::create([
            'teacher_id' => $teacher->id,
            'action' => 'UPDATE',
            'old_data' => $oldData,
            'new_data' => $validated,
            'changed_by' => $request->user()?->id,
        ]);
        Cache::tags(CacheKey::tags($teacher->school_id, null))->flush();

        return new TeacherResource($teacher->load('user'));
    }

    public function destroy(Enseignant $teacher)
    {
        $schoolId = $teacher->school_id;
        TeacherAudit::create([
            'teacher_id' => $teacher->id,
            'action' => 'DELETE',
            'old_data' => $teacher->toArray(),
            'changed_by' => request()->user()?->id,
        ]);
        $teacher->delete();
        Cache::tags(CacheKey::tags($schoolId, null))->flush();

        return response()->noContent();
    }
}
