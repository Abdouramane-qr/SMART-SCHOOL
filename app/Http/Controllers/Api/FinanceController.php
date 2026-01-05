<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Paiement;
use App\Models\Salary;
use App\Support\CacheKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class FinanceController extends Controller
{
    public function stats(Request $request)
    {
        $schoolId = $request->integer('school_id');
        $academicYearId = $request->integer('academic_year_id');

        $key = CacheKey::key('finance:stats', $schoolId, $academicYearId);
        $tags = CacheKey::tags($schoolId, $academicYearId);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $data = $cache->remember($key, now()->addMinutes(10), function () use ($schoolId, $academicYearId) {
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
        });

        return response()->json(['data' => $data]);
    }
}
