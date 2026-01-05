<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SalaryResource;
use App\Models\Salary;
use App\Support\CacheKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SalaryController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $request->integer('school_id');
        $perPage = $request->integer('per_page') ?: 15;
        $page = $request->integer('page') ?: 1;

        $keyParts = [$perPage, $page, $request->integer('teacher_id')];
        $key = CacheKey::key('salaries:index', $schoolId, null, $keyParts);
        $tags = CacheKey::tags($schoolId, null);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $result = $cache->remember($key, now()->addMinutes(5), function () use ($request, $perPage) {
            $query = Salary::query()
                ->with(['teacher.user'])
                ->orderByDesc('payment_date')
                ->orderByDesc('id');

            if ($request->filled('school_id')) {
                $query->where('school_id', $request->integer('school_id'));
            }

            if ($request->filled('teacher_id')) {
                $query->where('teacher_id', $request->integer('teacher_id'));
            }

            return $query->paginate($perPage);
        });

        return SalaryResource::collection($result);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'teacher_id' => ['required', 'integer', 'exists:enseignants,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_date' => ['required', 'date'],
            'month' => ['required', 'string', 'max:20'],
            'year' => ['required', 'integer'],
            'bonus' => ['nullable', 'numeric', 'min:0'],
            'deductions' => ['nullable', 'numeric', 'min:0'],
            'net_amount' => ['required', 'numeric'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['created_by'] = $request->user()?->id;

        $salary = Salary::create($validated);
        Cache::tags(CacheKey::tags($salary->school_id, null))->flush();

        return new SalaryResource($salary->load(['teacher.user']));
    }

    public function show(Salary $salary)
    {
        return new SalaryResource($salary->load(['teacher.user']));
    }

    public function update(Request $request, Salary $salary)
    {
        $validated = $request->validate([
            'school_id' => ['sometimes', 'integer', 'exists:schools,id'],
            'teacher_id' => ['sometimes', 'integer', 'exists:enseignants,id'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'payment_date' => ['sometimes', 'date'],
            'month' => ['sometimes', 'string', 'max:20'],
            'year' => ['sometimes', 'integer'],
            'bonus' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'deductions' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'net_amount' => ['sometimes', 'numeric'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $salary->update($validated);
        Cache::tags(CacheKey::tags($salary->school_id, null))->flush();

        return new SalaryResource($salary->load(['teacher.user']));
    }

    public function destroy(Salary $salary)
    {
        $schoolId = $salary->school_id;
        $salary->delete();
        Cache::tags(CacheKey::tags($schoolId, null))->flush();

        return response()->noContent();
    }
}
