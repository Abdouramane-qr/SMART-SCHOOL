<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SalaryResource;
use App\Models\Salary;
use App\Support\CacheKey;
use App\Services\FinanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SalaryController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Salary::class, 'salary');
    }

    private const STATUSES = ['draft', 'submitted', 'approved', 'paid'];

    private function canApprove(Request $request): bool
    {
        $user = $request->user();

        return $user?->hasAnyRole(['super_admin', 'admin', 'admin_ecole', 'comptable']) ?? false;
    }

    public function index(Request $request)
    {
        $schoolId = $this->resolveSchoolId($request);
        $perPage = $request->integer('per_page') ?: 15;
        $page = $request->integer('page') ?: 1;

        $keyParts = [$perPage, $page, $request->integer('teacher_id')];
        $key = CacheKey::key('salaries:index', $schoolId, null, $keyParts);
        $tags = CacheKey::tags($schoolId, null);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $result = $cache->remember($key, now()->addMinutes(5), function () use ($request, $perPage, $schoolId) {
            $query = Salary::query()
                ->with(['teacher.user'])
                ->orderByDesc('payment_date')
                ->orderByDesc('id');

            if ($schoolId) {
                $query->where('school_id', $schoolId);
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
            'status' => ['nullable', 'string', 'in:'.implode(',', self::STATUSES)],
        ]);

        $schoolId = $this->resolveSchoolId($request);
        $validated['school_id'] = $schoolId;

        $validated['created_by'] = $request->user()?->id;
        if (empty($validated['status'])) {
            $validated['status'] = 'submitted';
        }

        if (in_array($validated['status'], ['approved', 'paid'], true) && ! $this->canApprove($request)) {
            return response()->json(['message' => 'Validation requise par un administrateur.'], 403);
        }

        if (in_array($validated['status'], ['approved', 'paid'], true)) {
            $validated['approved_at'] = now();
            $validated['approved_by'] = $request->user()?->id;
        }

        $salary = app(FinanceService::class)->createSalary($validated);

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
            'status' => ['sometimes', 'nullable', 'string', 'in:'.implode(',', self::STATUSES)],
        ]);

        $schoolId = $this->resolveSchoolId($request);
        $validated['school_id'] = $schoolId;

        if (array_key_exists('status', $validated)) {
            $status = $validated['status'];
            if (in_array($status, ['approved', 'paid'], true) && ! $this->canApprove($request)) {
                return response()->json(['message' => 'Validation requise par un administrateur.'], 403);
            }

            if (in_array($status, ['approved', 'paid'], true)) {
                $validated['approved_at'] = now();
                $validated['approved_by'] = $request->user()?->id;
            } else {
                $validated['approved_at'] = null;
                $validated['approved_by'] = null;
            }
        }

        $salary = app(FinanceService::class)->updateSalary($salary, $validated);

        return new SalaryResource($salary->load(['teacher.user']));
    }

    public function destroy(Salary $salary)
    {
        app(FinanceService::class)->deleteSalary($salary);

        return response()->noContent();
    }
}
