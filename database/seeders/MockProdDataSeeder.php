<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Absence;
use App\Models\Classe;
use App\Models\Classroom;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\Expense;
use App\Models\Matiere;
use App\Models\Note;
use App\Models\Paiement;
use App\Models\ParentModel;
use App\Models\Salary;
use App\Models\School;
use App\Models\Timetable;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class MockProdDataSeeder extends Seeder
{
    public function run(): void
    {
        $prefix = 'MOCK_PROD_';
        if (School::where('code', 'like', $prefix.'%')->exists()) {
            return;
        }

        $schoolCount = 2;
        $classCount = 6;
        $studentCount = 120;
        $noteCount = 100;
        $absenceCount = 40;
        $paymentCount = 30;
        $salaryCount = 10;
        $expenseCount = 20;
        $timetableCount = 30;

        foreach (['admin', 'comptable', 'enseignant', 'eleve', 'parent'] as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        DB::transaction(function () use (
            $prefix,
            $schoolCount,
            $classCount,
            $studentCount,
            $noteCount,
            $absenceCount,
            $paymentCount,
            $salaryCount,
            $expenseCount,
            $timetableCount
        ): void {
            $schools = [];
            $academicYears = [];
            $classes = [];
            $classesBySchool = [];
            $classById = [];
            $subjectsBySchool = [];
            $classroomsBySchool = [];
            $teachers = [];
            $teachersBySchool = [];
            $parents = [];
            $parentsBySchool = [];
            $students = [];

            $teachersPerSchool = (int) ceil($salaryCount / $schoolCount);
            $subjectsPerSchool = 3;
            $classroomsPerSchool = 2;

            for ($s = 1; $s <= $schoolCount; $s++) {
                $school = School::create([
                    'name' => "Mock Production School {$s}",
                    'code' => $prefix.str_pad((string) $s, 3, '0', STR_PAD_LEFT),
                ]);
                $schools[] = $school;

                $year = AcademicYear::create([
                    'school_id' => $school->id,
                    'name' => '2025-2026',
                    'start_date' => '2025-09-01',
                    'end_date' => '2026-06-30',
                    'is_active' => true,
                ]);
                $academicYears[$school->id] = $year;

                $adminUser = User::create([
                    'name' => "Mock Admin {$s}",
                    'full_name' => "Mock Admin {$s}",
                    'email' => "mock+prod_admin{$s}@example.com",
                    'password' => Hash::make('password'),
                    'approved_at' => now(),
                ]);
                $adminUser->assignRole('admin');

                $accountantUser = User::create([
                    'name' => "Mock Accountant {$s}",
                    'full_name' => "Mock Accountant {$s}",
                    'email' => "mock+prod_accountant{$s}@example.com",
                    'password' => Hash::make('password'),
                    'approved_at' => now(),
                ]);
                $accountantUser->assignRole('comptable');

                $parentUser = User::create([
                    'name' => "Mock Parent {$s}",
                    'full_name' => "Mock Parent {$s}",
                    'email' => "mock+prod_parent{$s}@example.com",
                    'password' => Hash::make('password'),
                    'approved_at' => now(),
                ]);
                $parentUser->assignRole('parent');

                $parent = ParentModel::create([
                    'school_id' => $school->id,
                    'first_name' => 'Mock',
                    'last_name' => "Parent {$s}",
                    'phone' => '00000000'.str_pad((string) $s, 2, '0', STR_PAD_LEFT),
                    'email' => "mock+prod_parent{$s}@example.com",
                    'user_id' => $parentUser->id,
                ]);
                $parents[] = $parent;
                $parentsBySchool[$school->id][] = $parent;

                $teachersBySchool[$school->id] = [];
                for ($t = 1; $t <= $teachersPerSchool; $t++) {
                    $teacherNumber = (($s - 1) * $teachersPerSchool) + $t;
                    $teacherUser = User::create([
                        'name' => "Mock Teacher {$teacherNumber}",
                        'full_name' => "Mock Teacher {$teacherNumber}",
                        'email' => "mock+prod_teacher{$teacherNumber}@example.com",
                        'password' => Hash::make('password'),
                        'approved_at' => now(),
                    ]);
                    $teacherUser->assignRole('enseignant');

                    $teacher = Enseignant::create([
                        'school_id' => $school->id,
                        'first_name' => 'Mock',
                        'last_name' => "Teacher {$teacherNumber}",
                        'email' => "mock+prod_teacher{$teacherNumber}@example.com",
                        'phone' => '00000001'.str_pad((string) $teacherNumber, 2, '0', STR_PAD_LEFT),
                        'user_id' => $teacherUser->id,
                    ]);
                    $teachers[] = $teacher;
                    $teachersBySchool[$school->id][] = $teacher;
                }

                $subjectsBySchool[$school->id] = [];
                for ($m = 1; $m <= $subjectsPerSchool; $m++) {
                    $subjectsBySchool[$school->id][] = Matiere::create([
                        'school_id' => $school->id,
                        'name' => "Mock Subject {$s}-{$m}",
                        'code' => "MOCK-{$s}-{$m}",
                        'coefficient' => 1,
                    ]);
                }

                $classroomsBySchool[$school->id] = [];
                for ($c = 1; $c <= $classroomsPerSchool; $c++) {
                    $classroomsBySchool[$school->id][] = Classroom::create([
                        'school_id' => $school->id,
                        'name' => "Mock Room {$s}-{$c}",
                        'capacity' => 30,
                        'building' => 'A',
                        'floor' => $c,
                        'equipment' => ['projector'],
                    ]);
                }
            }

            $classesPerSchool = intdiv($classCount, $schoolCount);
            $extraClasses = $classCount % $schoolCount;
            $classNumber = 1;
            foreach ($schools as $index => $school) {
                $count = $classesPerSchool + ($index < $extraClasses ? 1 : 0);
                for ($i = 1; $i <= $count; $i++) {
                    $classe = Classe::create([
                        'school_id' => $school->id,
                        'academic_year_id' => $academicYears[$school->id]->id,
                        'name' => "Mock Classe {$classNumber}",
                        'level' => 'L'.((($classNumber - 1) % 3) + 1),
                    ]);
                    $classes[] = $classe;
                    $classesBySchool[$school->id][] = $classe;
                    $classById[$classe->id] = $classe;
                    $classNumber++;
                }
            }

            foreach ($classes as $index => $classe) {
                $schoolTeachers = $teachersBySchool[$classe->school_id] ?? [];
                if (! empty($schoolTeachers)) {
                    $teacher = $schoolTeachers[$index % count($schoolTeachers)];
                    $teacher->classes()->attach($classe->id);
                }
            }

            $studentsPerClass = intdiv($studentCount, count($classes));
            $extraStudents = $studentCount % count($classes);
            $studentNumber = 1;
            foreach ($classes as $classIndex => $classe) {
                $count = $studentsPerClass + ($classIndex < $extraStudents ? 1 : 0);
                for ($i = 1; $i <= $count; $i++) {
                    $studentUserId = null;
                    if ($i === 1) {
                        $studentUser = User::create([
                            'name' => "Mock Student {$studentNumber}",
                            'full_name' => "Mock Student {$studentNumber}",
                            'email' => "mock+prod_student{$studentNumber}@example.com",
                            'password' => Hash::make('password'),
                            'approved_at' => now(),
                        ]);
                        $studentUser->assignRole('eleve');
                        $studentUserId = $studentUser->id;
                    }

                    $day = str_pad((string) ((($studentNumber - 1) % 28) + 1), 2, '0', STR_PAD_LEFT);
                    $students[] = Eleve::create([
                        'school_id' => $classe->school_id,
                        'classe_id' => $classe->id,
                        'first_name' => 'Mock',
                        'last_name' => "Student {$studentNumber}",
                        'gender' => $studentNumber % 2 === 0 ? 'F' : 'M',
                        'birth_date' => '2010-01-'.$day,
                        'user_id' => $studentUserId,
                    ]);
                    $studentNumber++;
                }
            }

            $parentIndexBySchool = [];
            foreach ($students as $student) {
                $schoolId = $student->school_id;
                $schoolParents = $parentsBySchool[$schoolId] ?? [];
                if (empty($schoolParents)) {
                    continue;
                }
                $parentIndexBySchool[$schoolId] = $parentIndexBySchool[$schoolId] ?? 0;
                $parent = $schoolParents[$parentIndexBySchool[$schoolId] % count($schoolParents)];
                $parent->eleves()->syncWithoutDetaching([$student->id]);
                $parentIndexBySchool[$schoolId]++;
            }

            for ($i = 0; $i < $noteCount; $i++) {
                $student = $students[$i % count($students)];
                $subjects = $subjectsBySchool[$student->school_id];
                $subject = $subjects[$i % count($subjects)];
                Note::create([
                    'eleve_id' => $student->id,
                    'matiere_id' => $subject->id,
                    'class_id' => $student->classe_id,
                    'academic_year_id' => $classById[$student->classe_id]->academic_year_id,
                    'value' => 8 + ($i % 13),
                    'term' => 'T1',
                    'evaluation_date' => now()->subDays($i % 30)->toDateString(),
                ]);
            }

            for ($i = 0; $i < $absenceCount; $i++) {
                $student = $students[$i % count($students)];
                Absence::create([
                    'school_id' => $student->school_id,
                    'eleve_id' => $student->id,
                    'classe_id' => $student->classe_id,
                    'academic_year_id' => $classById[$student->classe_id]->academic_year_id,
                    'date' => now()->subDays($i % 20)->toDateString(),
                    'reason' => 'Mock absence',
                    'is_justified' => $i % 2 === 0,
                ]);
            }

            $paymentStatuses = ['paye', 'partiel', 'en_retard'];
            for ($i = 0; $i < $paymentCount; $i++) {
                $student = $students[$i % count($students)];
                $amount = 200;
                $paidAmount = match ($paymentStatuses[$i % count($paymentStatuses)]) {
                    'paye' => $amount,
                    'partiel' => 50,
                    default => 0,
                };
                $paymentDate = now()->subDays($i % 15)->toDateString();
                Paiement::create([
                    'school_id' => $student->school_id,
                    'eleve_id' => $student->id,
                    'amount' => $amount,
                    'paid_amount' => $paidAmount,
                    'payment_date' => $paymentDate,
                    'status' => $paymentStatuses[$i % count($paymentStatuses)],
                    'method' => 'cash',
                    'due_date' => now()->subDays(5)->toDateString(),
                ]);
            }

            $expenseCategories = ['Utilities', 'Supplies', 'Maintenance', 'Transport'];
            for ($i = 0; $i < $expenseCount; $i++) {
                $school = $schools[$i % count($schools)];
                Expense::create([
                    'school_id' => $school->id,
                    'category' => $expenseCategories[$i % count($expenseCategories)],
                    'description' => 'Mock expense',
                    'amount' => 100 + ($i * 5),
                    'expense_date' => now()->subDays($i % 25)->toDateString(),
                ]);
            }

            for ($i = 0; $i < $salaryCount; $i++) {
                $teacher = $teachers[$i % count($teachers)];
                $amount = 300 + ($i * 10);
                $bonus = 20;
                $deductions = 10;
                Salary::create([
                    'school_id' => $teacher->school_id,
                    'teacher_id' => $teacher->id,
                    'amount' => $amount,
                    'payment_date' => now()->subDays($i % 15)->toDateString(),
                    'month' => now()->format('m'),
                    'year' => (int) now()->format('Y'),
                    'bonus' => $bonus,
                    'deductions' => $deductions,
                    'net_amount' => $amount + $bonus - $deductions,
                ]);
            }

            for ($i = 0; $i < $timetableCount; $i++) {
                $classe = $classes[$i % count($classes)];
                $subjects = $subjectsBySchool[$classe->school_id];
                $subject = $subjects[$i % count($subjects)];
                $schoolTeachers = $teachersBySchool[$classe->school_id] ?? [];
                $teacher = $schoolTeachers ? $schoolTeachers[$i % count($schoolTeachers)] : null;
                $schoolClassrooms = $classroomsBySchool[$classe->school_id] ?? [];
                $classroom = $schoolClassrooms ? $schoolClassrooms[$i % count($schoolClassrooms)] : null;
                $startHour = 8 + ($i % 6);
                Timetable::create([
                    'school_id' => $classe->school_id,
                    'academic_year_id' => $classe->academic_year_id,
                    'class_id' => $classe->id,
                    'matiere_id' => $subject->id,
                    'teacher_id' => $teacher?->id,
                    'classroom_id' => $classroom?->id,
                    'day_of_week' => ($i % 5) + 1,
                    'start_time' => sprintf('%02d:00:00', $startHour),
                    'end_time' => sprintf('%02d:00:00', $startHour + 1),
                ]);
            }
        });
    }
}
