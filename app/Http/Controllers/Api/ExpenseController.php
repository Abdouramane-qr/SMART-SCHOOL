<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Support\CacheKey;
use App\Services\FinanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ExpenseController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Expense::class, 'expense');
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
        $academicYearId = $request->integer('academic_year_id');
        $perPage = $request->integer('per_page') ?: 15;
        $page = $request->integer('page') ?: 1;
        $category = trim((string) $request->string('category'));

        $keyParts = [$perPage, $page, $category ?: null];
        $key = CacheKey::key('expenses:index', $schoolId, $academicYearId, $keyParts);
        $tags = CacheKey::tags($schoolId, $academicYearId);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $result = $cache->remember($key, now()->addMinutes(5), function () use ($perPage, $category, $schoolId) {
            $query = Expense::query()->orderByDesc('expense_date')->orderByDesc('id');

            if ($schoolId) {
                $query->where('school_id', $schoolId);
            }

            if ($category !== '') {
                $query->where('category', $category);
            }

            return $query->paginate($perPage);
        });

        return ExpenseResource::collection($result);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'category' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'expense_date' => ['required', 'date'],
            'receipt_number' => ['nullable', 'string', 'max:100'],
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

        $expense = app(FinanceService::class)->createExpense($validated);

        return new ExpenseResource($expense);
    }

    public function show(Expense $expense)
    {
        return new ExpenseResource($expense);
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'school_id' => ['sometimes', 'integer', 'exists:schools,id'],
            'category' => ['sometimes', 'string', 'max:100'],
            'description' => ['sometimes', 'string', 'max:255'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'expense_date' => ['sometimes', 'date'],
            'receipt_number' => ['sometimes', 'nullable', 'string', 'max:100'],
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

        $expense = app(FinanceService::class)->updateExpense($expense, $validated);

        return new ExpenseResource($expense);
    }

    public function destroy(Expense $expense)
    {
        app(FinanceService::class)->deleteExpense($expense);

        return response()->noContent();
    }
}
