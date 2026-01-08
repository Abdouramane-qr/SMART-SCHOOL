<?php

namespace App\Services;

use App\Events\ExpenseCreated;
use App\Events\ExpenseDeleted;
use App\Events\ExpenseUpdated;
use App\Events\PaymentCreated;
use App\Events\PaymentDeleted;
use App\Events\PaymentUpdated;
use App\Events\SalaryCreated;
use App\Events\SalaryDeleted;
use App\Events\SalaryUpdated;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\Expense;
use App\Models\Paiement;
use App\Models\Salary;
use App\Support\CacheKey;
use Illuminate\Support\Facades\Cache;

class FinanceService
{
    public function getStats(?int $schoolId, ?int $academicYearId): array
    {
        $key = CacheKey::key('finance:stats', $schoolId, $academicYearId);
        $cache = $this->cacheStore($schoolId, $academicYearId);

        return $cache->remember($key, now()->addMinutes(10), function () use ($schoolId, $academicYearId) {
            return $this->computeStats($schoolId, $academicYearId);
        });
    }

    public function refreshStats(?int $schoolId, ?int $academicYearId): array
    {
        if (! $schoolId) {
            return $this->computeStats($schoolId, $academicYearId);
        }

        $data = $this->computeStats($schoolId, $academicYearId);
        $key = CacheKey::key('finance:stats', $schoolId, $academicYearId);
        $cache = $this->cacheStore($schoolId, $academicYearId);
        $cache->put($key, $data, now()->addMinutes(10));

        return $data;
    }

    public function invalidateStatsCache(?int $schoolId, ?int $academicYearId): void
    {
        if (! $schoolId) {
            return;
        }

        $cache = $this->cacheStore($schoolId, $academicYearId);
        $cache->flush();
    }

    public function createPayment(array $payload): Paiement
    {
        $payload = $this->normalizePaymentPayload($payload);
        $paiement = Paiement::create($payload);
        $this->dispatchPaymentEvent($paiement, 'created', null, $paiement->toArray());

        return $paiement;
    }

    public function updatePayment(Paiement $paiement, array $payload): Paiement
    {
        $oldData = $paiement->toArray();
        $payload = $this->normalizePaymentPayload($payload);
        $paiement->update($payload);
        $this->dispatchPaymentEvent($paiement, 'updated', $oldData, $paiement->toArray());

        return $paiement;
    }

    public function deletePayment(Paiement $paiement): void
    {
        $schoolId = $paiement->school_id;
        $academicYearId = $paiement->eleve?->classe?->academic_year_id;
        $oldData = $paiement->toArray();
        $paiement->delete();
        $this->dispatchPaymentEventByIds($schoolId, $academicYearId, 'deleted', $paiement->id, $oldData, null);
    }

    public function createExpense(array $payload): Expense
    {
        $expense = Expense::create($payload);
        $this->dispatchExpenseEvent($expense, 'created', null, $expense->toArray());

        return $expense;
    }

    public function updateExpense(Expense $expense, array $payload): Expense
    {
        $oldData = $expense->toArray();
        $expense->update($payload);
        $this->dispatchExpenseEvent($expense, 'updated', $oldData, $expense->toArray());

        return $expense;
    }

    public function deleteExpense(Expense $expense): void
    {
        $schoolId = $expense->school_id;
        $oldData = $expense->toArray();
        $expense->delete();
        $this->dispatchExpenseEventByIds($schoolId, 'deleted', $expense->id, $oldData, null);
    }

    public function createSalary(array $payload): Salary
    {
        $payload = $this->normalizeSalaryPayload($payload);
        $salary = Salary::create($payload);
        $this->dispatchSalaryEvent($salary, 'created', null, $salary->toArray());

        return $salary;
    }

    public function updateSalary(Salary $salary, array $payload): Salary
    {
        $oldData = $salary->toArray();
        $payload = $this->normalizeSalaryPayload($payload);
        $salary->update($payload);
        $this->dispatchSalaryEvent($salary, 'updated', $oldData, $salary->toArray());

        return $salary;
    }

    public function deleteSalary(Salary $salary): void
    {
        $schoolId = $salary->school_id;
        $oldData = $salary->toArray();
        $salary->delete();
        $this->dispatchSalaryEventByIds($schoolId, 'deleted', $salary->id, $oldData, null);
    }

    private function cacheStore(?int $schoolId, ?int $academicYearId)
    {
        $tags = CacheKey::tags($schoolId, $academicYearId);

        return $tags ? Cache::tags($tags) : Cache::store();
    }

    private function normalizePaymentPayload(array $payload): array
    {
        if (array_key_exists('eleve_id', $payload) && empty($payload['school_id'])) {
            $eleve = Eleve::find($payload['eleve_id']);
            $payload['school_id'] = $eleve?->school_id;
        }

        if (! empty($payload['payment_type']) && (! array_key_exists('method', $payload) || empty($payload['method']))) {
            $payload['method'] = $payload['payment_type'];
        }

        if ((! array_key_exists('amount', $payload) || $payload['amount'] === null) && isset($payload['paid_amount'])) {
            $payload['amount'] = $payload['paid_amount'];
        }

        return $payload;
    }

    private function dispatchPaymentEvent(Paiement $paiement, string $action, ?array $oldData, ?array $newData): void
    {
        $paiement->loadMissing('eleve.classe');
        $schoolId = $paiement->school_id;
        $academicYearId = $paiement->eleve?->classe?->academic_year_id;
        $this->dispatchPaymentEventByIds($schoolId, $academicYearId, $action, $paiement->id, $oldData, $newData);
    }

    private function dispatchPaymentEventByIds(
        ?int $schoolId,
        ?int $academicYearId,
        string $action,
        ?int $entityId,
        ?array $oldData,
        ?array $newData,
    ): void {
        if (! $schoolId) {
            return;
        }

        match ($action) {
            'created' => event(new PaymentCreated($schoolId, $academicYearId, $entityId, $oldData, $newData, auth()->id())),
            'updated' => event(new PaymentUpdated($schoolId, $academicYearId, $entityId, $oldData, $newData, auth()->id())),
            'deleted' => event(new PaymentDeleted($schoolId, $academicYearId, $entityId, $oldData, $newData, auth()->id())),
            default => null,
        };
    }

    private function dispatchExpenseEvent(Expense $expense, string $action, ?array $oldData, ?array $newData): void
    {
        $this->dispatchExpenseEventByIds($expense->school_id, $action, $expense->id, $oldData, $newData);
    }

    private function dispatchExpenseEventByIds(
        ?int $schoolId,
        string $action,
        ?int $entityId,
        ?array $oldData,
        ?array $newData,
    ): void {
        if (! $schoolId) {
            return;
        }

        match ($action) {
            'created' => event(new ExpenseCreated($schoolId, $entityId, $oldData, $newData, auth()->id())),
            'updated' => event(new ExpenseUpdated($schoolId, $entityId, $oldData, $newData, auth()->id())),
            'deleted' => event(new ExpenseDeleted($schoolId, $entityId, $oldData, $newData, auth()->id())),
            default => null,
        };
    }

    private function dispatchSalaryEvent(Salary $salary, string $action, ?array $oldData, ?array $newData): void
    {
        $this->dispatchSalaryEventByIds($salary->school_id, $action, $salary->id, $oldData, $newData);
    }

    private function dispatchSalaryEventByIds(
        ?int $schoolId,
        string $action,
        ?int $entityId,
        ?array $oldData,
        ?array $newData,
    ): void {
        if (! $schoolId) {
            return;
        }

        match ($action) {
            'created' => event(new SalaryCreated($schoolId, $entityId, $oldData, $newData, auth()->id())),
            'updated' => event(new SalaryUpdated($schoolId, $entityId, $oldData, $newData, auth()->id())),
            'deleted' => event(new SalaryDeleted($schoolId, $entityId, $oldData, $newData, auth()->id())),
            default => null,
        };
    }

    private function normalizeSalaryPayload(array $payload): array
    {
        if (empty($payload['school_id']) && ! empty($payload['teacher_id'])) {
            $teacher = Enseignant::find($payload['teacher_id']);
            $payload['school_id'] = $teacher?->school_id;
        }

        return $payload;
    }

    private function computeStats(?int $schoolId, ?int $academicYearId): array
    {
        $paymentsQuery = Paiement::query();
        $expensesQuery = Expense::query();
        $salariesQuery = Salary::query();

        if ($schoolId) {
            $paymentsQuery->where('school_id', $schoolId);
            $expensesQuery->where('school_id', $schoolId);
            $salariesQuery->where('school_id', $schoolId);
        }

        if ($academicYearId) {
            $paymentsQuery->whereHas('eleve.classe', function ($builder) use ($academicYearId) {
                $builder->where('academic_year_id', $academicYearId);
            });
        }

        $payments = $paymentsQuery->get(['amount', 'paid_amount', 'status', 'payment_date', 'eleve_id']);
        $expenses = $expensesQuery->get(['amount', 'expense_date']);
        $salaries = $salariesQuery->get(['net_amount', 'payment_date']);

        $totalExpected = $payments->sum(fn ($p) => (float) ($p->amount ?? 0));
        $totalPaid = $payments->sum(fn ($p) => (float) ($p->paid_amount ?? $p->amount ?? 0));
        $totalRemaining = $totalExpected - $totalPaid;
        $totalExpenses = $expenses->sum(fn ($e) => (float) ($e->amount ?? 0));
        $totalSalaries = $salaries->sum(fn ($s) => (float) ($s->net_amount ?? 0));
        $netResult = $totalPaid - $totalExpenses - $totalSalaries;

        $studentPayments = [];
        foreach ($payments as $payment) {
            $studentId = (string) $payment->eleve_id;
            if (! isset($studentPayments[$studentId])) {
                $studentPayments[$studentId] = ['total' => 0, 'paid' => 0];
            }
            $studentPayments[$studentId]['total'] += (float) ($payment->amount ?? 0);
            $studentPayments[$studentId]['paid'] += (float) ($payment->paid_amount ?? $payment->amount ?? 0);
        }

        $studentsUpToDate = 0;
        $studentsNotUpToDate = 0;
        foreach ($studentPayments as $stats) {
            if ($stats['paid'] >= $stats['total']) {
                $studentsUpToDate++;
            } else {
                $studentsNotUpToDate++;
            }
        }

        $months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        $monthlyRevenue = array_fill(0, 12, 0.0);
        $monthlyExpenses = array_fill(0, 12, 0.0);

        foreach ($payments as $payment) {
            if ($payment->payment_date) {
                $monthIndex = (int) date('n', strtotime((string) $payment->payment_date)) - 1;
                $monthlyRevenue[$monthIndex] += (float) ($payment->paid_amount ?? $payment->amount ?? 0);
            }
        }

        foreach ($expenses as $expense) {
            if ($expense->expense_date) {
                $monthIndex = (int) date('n', strtotime((string) $expense->expense_date)) - 1;
                $monthlyExpenses[$monthIndex] += (float) ($expense->amount ?? 0);
            }
        }

        foreach ($salaries as $salary) {
            if ($salary->payment_date) {
                $monthIndex = (int) date('n', strtotime((string) $salary->payment_date)) - 1;
                $monthlyExpenses[$monthIndex] += (float) ($salary->net_amount ?? 0);
            }
        }

        $monthlyData = [];
        foreach ($months as $index => $month) {
            $monthlyData[] = [
                'month' => $month,
                'revenus' => $monthlyRevenue[$index],
                'depenses' => $monthlyExpenses[$index],
            ];
        }

        return [
            'totalPaid' => $totalPaid,
            'totalExpected' => $totalExpected,
            'totalRemaining' => $totalRemaining,
            'totalExpenses' => $totalExpenses,
            'totalSalaries' => $totalSalaries,
            'netResult' => $netResult,
            'studentsUpToDate' => $studentsUpToDate,
            'studentsNotUpToDate' => $studentsNotUpToDate,
            'monthlyData' => $monthlyData,
        ];
    }
}
