<?php

namespace Tests\Unit;

use App\Models\AcademicYear;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\Expense;
use App\Models\Paiement;
use App\Models\Salary;
use App\Models\School;
use App\Services\FinanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_computes_finance_stats_for_school_and_year(): void
    {
        $school = School::create([
            'name' => 'Smart School',
            'code' => 'SS',
            'is_active' => true,
        ]);

        $academicYear = AcademicYear::create([
            'school_id' => $school->id,
            'name' => '2025-2026',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_active' => true,
        ]);

        $classe = Classe::create([
            'school_id' => $school->id,
            'academic_year_id' => $academicYear->id,
            'name' => '6A',
            'level' => '6eme',
            'capacity' => 30,
        ]);

        $studentOne = Eleve::create([
            'school_id' => $school->id,
            'classe_id' => $classe->id,
            'first_name' => 'Alex',
            'last_name' => 'Alpha',
            'gender' => 'M',
            'birth_date' => '2012-01-01',
        ]);

        $studentTwo = Eleve::create([
            'school_id' => $school->id,
            'classe_id' => $classe->id,
            'first_name' => 'Bea',
            'last_name' => 'Beta',
            'gender' => 'F',
            'birth_date' => '2012-02-02',
        ]);

        Paiement::create([
            'school_id' => $school->id,
            'eleve_id' => $studentOne->id,
            'amount' => 100,
            'paid_amount' => 100,
            'payment_date' => '2026-01-15',
            'method' => 'cash',
            'status' => 'paye',
        ]);

        Paiement::create([
            'school_id' => $school->id,
            'eleve_id' => $studentOne->id,
            'amount' => 50,
            'paid_amount' => 20,
            'payment_date' => '2026-02-01',
            'method' => 'cash',
            'status' => 'partiel',
        ]);

        Paiement::create([
            'school_id' => $school->id,
            'eleve_id' => $studentTwo->id,
            'amount' => 80,
            'paid_amount' => 80,
            'payment_date' => '2026-01-20',
            'method' => 'cash',
            'status' => 'paye',
        ]);

        Expense::create([
            'school_id' => $school->id,
            'category' => 'Fournitures',
            'description' => 'Papeterie',
            'amount' => 40,
            'expense_date' => '2026-01-10',
            'status' => 'approved',
        ]);

        $teacher = Enseignant::create([
            'school_id' => $school->id,
            'first_name' => 'Tara',
            'last_name' => 'Teach',
            'phone' => '0600000000',
            'email' => 'tara@example.test',
        ]);

        Salary::create([
            'school_id' => $school->id,
            'teacher_id' => $teacher->id,
            'amount' => 60,
            'payment_date' => '2026-02-05',
            'month' => '02',
            'year' => 2026,
            'bonus' => 0,
            'deductions' => 0,
            'net_amount' => 60,
            'status' => 'paid',
        ]);

        $stats = app(FinanceService::class)->getStats($school->id, $academicYear->id);

        $this->assertSame(150.0, $stats['totalExpected']);
        $this->assertSame(120.0, $stats['totalPaid']);
        $this->assertSame(30.0, $stats['totalRemaining']);
        $this->assertSame(40.0, $stats['totalExpenses']);
        $this->assertSame(60.0, $stats['totalSalaries']);
        $this->assertSame(20.0, $stats['netResult']);
        $this->assertSame(1, $stats['studentsUpToDate']);
        $this->assertSame(1, $stats['studentsNotUpToDate']);

        $this->assertSame(180.0, $stats['monthlyData'][0]['revenus']);
        $this->assertSame(40.0, $stats['monthlyData'][0]['depenses']);
        $this->assertSame(20.0, $stats['monthlyData'][1]['revenus']);
        $this->assertSame(60.0, $stats['monthlyData'][1]['depenses']);
    }
}
