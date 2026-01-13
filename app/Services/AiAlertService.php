<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class AiAlertService
{
    private int $absenceWindowDays = 7;
    private int $absenceAlertThreshold = 20;
    private int $lowAverageThreshold = 10;
    private int $absenceStudentThreshold = 3;
    private int $recentWindowDays = 30;

    public function __construct(private AiTenantResolver $tenantResolver)
    {
    }

    public function generate(User $user, array $profile): array
    {
        $role = $profile['key'] ?? null;
        if (! $role) {
            return [];
        }

        $schoolId = $this->tenantResolver->resolveSchoolId($user);
        if (! $schoolId) {
            return [];
        }

        return match ($role) {
            'admin' => $this->adminAlerts($schoolId),
            'accountant' => $this->accountantAlerts($schoolId),
            'teacher' => $this->teacherAlerts($user->id, $schoolId),
            'student' => $this->studentAlerts($user->id, $schoolId),
            'parent' => $this->parentAlerts($user->id, $schoolId),
            default => [],
        };
    }

    private function adminAlerts(int $schoolId): array
    {
        $alerts = [];

        $absenceCount = $this->countAbsences($schoolId, $this->absenceWindowDays);
        if ($absenceCount >= $this->absenceAlertThreshold) {
            $alerts[] = [
                'rule' => 'admin.absence_spike',
                'severity' => 'warning',
                'data' => [
                    'count' => $absenceCount,
                    'window_days' => $this->absenceWindowDays,
                ],
            ];
        }

        $overdueCount = $this->countOverduePayments($schoolId);
        if ($overdueCount > 0) {
            $alerts[] = [
                'rule' => 'admin.overdue_payments',
                'severity' => 'warning',
                'data' => [
                    'count' => $overdueCount,
                ],
            ];
        }

        $cashflow = $this->summarizeCashflow($schoolId, $this->recentWindowDays);
        if ($cashflow['expenses'] > $cashflow['payments']) {
            $alerts[] = [
                'rule' => 'admin.cashflow_negative',
                'severity' => 'warning',
                'data' => [
                    'payments' => $cashflow['payments'],
                    'expenses' => $cashflow['expenses'],
                    'window_days' => $this->recentWindowDays,
                ],
            ];
        }

        return $alerts;
    }

    private function accountantAlerts(int $schoolId): array
    {
        $alerts = [];

        $overdueCount = $this->countOverduePayments($schoolId);
        if ($overdueCount > 0) {
            $alerts[] = [
                'rule' => 'accountant.overdue_payments',
                'severity' => 'warning',
                'data' => [
                    'count' => $overdueCount,
                ],
            ];
        }

        $cashflow = $this->summarizeCashflow($schoolId, $this->recentWindowDays);
        if ($cashflow['expenses'] > $cashflow['payments']) {
            $alerts[] = [
                'rule' => 'accountant.cashflow_negative',
                'severity' => 'warning',
                'data' => [
                    'payments' => $cashflow['payments'],
                    'expenses' => $cashflow['expenses'],
                    'window_days' => $this->recentWindowDays,
                ],
            ];
        }

        return $alerts;
    }

    private function teacherAlerts(int $userId, int $schoolId): array
    {
        $alerts = [];

        $struggling = $this->teacherStrugglingStudents($userId, $schoolId);
        if ($struggling['count'] > 0) {
            $alerts[] = [
                'rule' => 'teacher.low_averages',
                'severity' => 'warning',
                'data' => [
                    'count' => $struggling['count'],
                    'names' => $struggling['names'],
                    'threshold' => $this->lowAverageThreshold,
                ],
            ];
        }

        $absences = $this->teacherAbsenceHotspots($userId, $schoolId, $this->absenceWindowDays);
        if ($absences['count'] > 0) {
            $alerts[] = [
                'rule' => 'teacher.absence_spike',
                'severity' => 'warning',
                'data' => [
                    'count' => $absences['count'],
                    'names' => $absences['names'],
                    'window_days' => $this->absenceWindowDays,
                    'threshold' => $this->absenceStudentThreshold,
                ],
            ];
        }

        return $alerts;
    }

    private function studentAlerts(int $userId, int $schoolId): array
    {
        $alerts = [];

        $student = $this->findStudent($userId, $schoolId);
        if (! $student) {
            return $alerts;
        }

        $avg = $this->studentAverage((int) $student->id);
        if ($avg !== null && $avg < $this->lowAverageThreshold) {
            $alerts[] = [
                'rule' => 'student.low_average',
                'severity' => 'warning',
                'data' => [
                    'average' => $avg,
                    'threshold' => $this->lowAverageThreshold,
                ],
            ];
        }

        $recentAbsences = $this->studentAbsences((int) $student->id, $this->absenceWindowDays);
        if ($recentAbsences > 0) {
            $alerts[] = [
                'rule' => 'student.recent_absences',
                'severity' => 'info',
                'data' => [
                    'count' => $recentAbsences,
                    'window_days' => $this->absenceWindowDays,
                ],
            ];
        }

        $overdueCount = $this->studentOverduePayments((int) $student->id);
        if ($overdueCount > 0) {
            $alerts[] = [
                'rule' => 'student.payment_overdue',
                'severity' => 'warning',
                'data' => [
                    'count' => $overdueCount,
                ],
            ];
        }

        return $alerts;
    }

    private function parentAlerts(int $userId, int $schoolId): array
    {
        $alerts = [];

        $parentId = $this->findParentId($userId, $schoolId);
        if (! $parentId) {
            return $alerts;
        }

        $lowAvg = $this->parentChildrenLowAverage($parentId, $this->lowAverageThreshold);
        if ($lowAvg['count'] > 0) {
            $alerts[] = [
                'rule' => 'parent.low_averages',
                'severity' => 'warning',
                'data' => [
                    'count' => $lowAvg['count'],
                    'names' => $lowAvg['names'],
                    'threshold' => $this->lowAverageThreshold,
                ],
            ];
        }

        $absence = $this->parentChildrenAbsences($parentId, $this->absenceWindowDays, $this->absenceStudentThreshold);
        if ($absence['count'] > 0) {
            $alerts[] = [
                'rule' => 'parent.recent_absences',
                'severity' => 'info',
                'data' => [
                    'count' => $absence['count'],
                    'names' => $absence['names'],
                    'window_days' => $this->absenceWindowDays,
                    'threshold' => $this->absenceStudentThreshold,
                ],
            ];
        }

        return $alerts;
    }

    private function countAbsences(int $schoolId, int $windowDays): int
    {
        $row = DB::selectOne(
            "select count(*) as total
            from absences
            where school_id = ?
              and date >= current_date - interval '{$windowDays} days'",
            [$schoolId]
        );

        return (int) ($row->total ?? 0);
    }

    private function countOverduePayments(int $schoolId): int
    {
        $row = DB::selectOne(
            "select count(*) as total
            from paiements
            where school_id = ?
              and (
                status = 'en_retard'
                or (due_date is not null and due_date < current_date and coalesce(paid_amount, 0) < coalesce(amount, 0))
              )",
            [$schoolId]
        );

        return (int) ($row->total ?? 0);
    }

    private function summarizeCashflow(int $schoolId, int $windowDays): array
    {
        $payments = DB::selectOne(
            "select coalesce(sum(amount), 0) as total
            from paiements
            where school_id = ?
              and payment_date >= current_date - interval '{$windowDays} days'",
            [$schoolId]
        );

        $expenses = DB::selectOne(
            "select coalesce(sum(amount), 0) as total
            from expenses
            where school_id = ?
              and expense_date >= current_date - interval '{$windowDays} days'",
            [$schoolId]
        );

        return [
            'payments' => (float) ($payments->total ?? 0),
            'expenses' => (float) ($expenses->total ?? 0),
        ];
    }

    private function teacherStrugglingStudents(int $userId, int $schoolId): array
    {
        $rows = DB::select(
            "with low_students as (
                select e.id, e.full_name, round(avg(n.value)::numeric, 2) as avg_grade
                from eleves e
                join classes c on c.id = e.classe_id
                join classe_enseignant ce on ce.classe_id = c.id
                join enseignants t on t.id = ce.enseignant_id
                join notes n on n.eleve_id = e.id
                where t.user_id = ?
                  and e.school_id = ?
                group by e.id, e.full_name
                having avg(n.value) < ?
            )
            select id, full_name, avg_grade
            from low_students
            order by avg_grade asc
            limit 3",
            [$userId, $schoolId, $this->lowAverageThreshold]
        );

        $count = DB::selectOne(
            "select count(*) as total
            from (
                select e.id
                from eleves e
                join classes c on c.id = e.classe_id
                join classe_enseignant ce on ce.classe_id = c.id
                join enseignants t on t.id = ce.enseignant_id
                join notes n on n.eleve_id = e.id
                where t.user_id = ?
                  and e.school_id = ?
                group by e.id
                having avg(n.value) < ?
            ) as low_students",
            [$userId, $schoolId, $this->lowAverageThreshold]
        );

        return [
            'count' => (int) ($count->total ?? 0),
            'names' => array_values(array_filter(array_map(
                fn ($row) => $row->full_name ?? null,
                $rows
            ))),
        ];
    }

    private function teacherAbsenceHotspots(int $userId, int $schoolId, int $windowDays): array
    {
        $rows = DB::select(
            "with absence_spikes as (
                select e.id, e.full_name, count(a.id) as absences
                from absences a
                join eleves e on e.id = a.eleve_id
                join classes c on c.id = e.classe_id
                join classe_enseignant ce on ce.classe_id = c.id
                join enseignants t on t.id = ce.enseignant_id
                where t.user_id = ?
                  and e.school_id = ?
                  and a.date >= current_date - interval '{$windowDays} days'
                group by e.id, e.full_name
                having count(a.id) >= ?
            )
            select id, full_name, absences
            from absence_spikes
            order by absences desc
            limit 3",
            [$userId, $schoolId, $this->absenceStudentThreshold]
        );

        $count = DB::selectOne(
            "select count(*) as total
            from (
                select e.id
                from absences a
                join eleves e on e.id = a.eleve_id
                join classes c on c.id = e.classe_id
                join classe_enseignant ce on ce.classe_id = c.id
                join enseignants t on t.id = ce.enseignant_id
                where t.user_id = ?
                  and e.school_id = ?
                  and a.date >= current_date - interval '{$windowDays} days'
                group by e.id
                having count(a.id) >= ?
            ) as absence_spikes",
            [$userId, $schoolId, $this->absenceStudentThreshold]
        );

        return [
            'count' => (int) ($count->total ?? 0),
            'names' => array_values(array_filter(array_map(
                fn ($row) => $row->full_name ?? null,
                $rows
            ))),
        ];
    }

    private function findStudent(int $userId, int $schoolId): ?object
    {
        return DB::selectOne(
            "select id, full_name
            from eleves
            where user_id = ?
              and school_id = ?
            limit 1",
            [$userId, $schoolId]
        );
    }

    private function studentAverage(int $studentId): ?float
    {
        $row = DB::selectOne(
            "select round(avg(value)::numeric, 2) as avg_grade
            from notes
            where eleve_id = ?",
            [$studentId]
        );

        return $row?->avg_grade !== null ? (float) $row->avg_grade : null;
    }

    private function studentAbsences(int $studentId, int $windowDays): int
    {
        $row = DB::selectOne(
            "select count(*) as total
            from absences
            where eleve_id = ?
              and date >= current_date - interval '{$windowDays} days'",
            [$studentId]
        );

        return (int) ($row->total ?? 0);
    }

    private function studentOverduePayments(int $studentId): int
    {
        $row = DB::selectOne(
            "select count(*) as total
            from paiements
            where eleve_id = ?
              and (
                status = 'en_retard'
                or (due_date is not null and due_date < current_date and coalesce(paid_amount, 0) < coalesce(amount, 0))
              )",
            [$studentId]
        );

        return (int) ($row->total ?? 0);
    }

    private function findParentId(int $userId, int $schoolId): ?int
    {
        $row = DB::selectOne(
            "select id
            from parents
            where user_id = ?
              and school_id = ?
            limit 1",
            [$userId, $schoolId]
        );

        return $row?->id ? (int) $row->id : null;
    }

    private function parentChildrenLowAverage(int $parentId, int $threshold): array
    {
        $rows = DB::select(
            "with low_students as (
                select e.id, e.full_name, round(avg(n.value)::numeric, 2) as avg_grade
                from eleve_parent ep
                join eleves e on e.id = ep.eleve_id
                join notes n on n.eleve_id = e.id
                where ep.parent_id = ?
                group by e.id, e.full_name
                having avg(n.value) < ?
            )
            select id, full_name, avg_grade
            from low_students
            order by avg_grade asc
            limit 3",
            [$parentId, $threshold]
        );

        $count = DB::selectOne(
            "select count(*) as total
            from (
                select e.id
                from eleve_parent ep
                join eleves e on e.id = ep.eleve_id
                join notes n on n.eleve_id = e.id
                where ep.parent_id = ?
                group by e.id
                having avg(n.value) < ?
            ) as low_students",
            [$parentId, $threshold]
        );

        return [
            'count' => (int) ($count->total ?? 0),
            'names' => array_values(array_filter(array_map(
                fn ($row) => $row->full_name ?? null,
                $rows
            ))),
        ];
    }

    private function parentChildrenAbsences(int $parentId, int $windowDays, int $threshold): array
    {
        $rows = DB::select(
            "with absence_spikes as (
                select e.id, e.full_name, count(a.id) as absences
                from eleve_parent ep
                join eleves e on e.id = ep.eleve_id
                join absences a on a.eleve_id = e.id
                where ep.parent_id = ?
                  and a.date >= current_date - interval '{$windowDays} days'
                group by e.id, e.full_name
                having count(a.id) >= ?
            )
            select id, full_name, absences
            from absence_spikes
            order by absences desc
            limit 3",
            [$parentId, $threshold]
        );

        $count = DB::selectOne(
            "select count(*) as total
            from (
                select e.id
                from eleve_parent ep
                join eleves e on e.id = ep.eleve_id
                join absences a on a.eleve_id = e.id
                where ep.parent_id = ?
                  and a.date >= current_date - interval '{$windowDays} days'
                group by e.id
                having count(a.id) >= ?
            ) as absence_spikes",
            [$parentId, $threshold]
        );

        return [
            'count' => (int) ($count->total ?? 0),
            'names' => array_values(array_filter(array_map(
                fn ($row) => $row->full_name ?? null,
                $rows
            ))),
        ];
    }
}
