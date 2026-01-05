<?php

namespace App\Providers;

use App\Models\Absence;
use App\Models\AcademicYear;
use App\Models\Asset;
use App\Models\Classe;
use App\Models\Classroom;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\Enrollment;
use App\Models\Expense;
use App\Models\FinanceSetting;
use App\Models\Matiere;
use App\Models\Message;
use App\Models\Note;
use App\Models\Paiement;
use App\Models\ParentModel;
use App\Models\Role;
use App\Models\Salary;
use App\Models\School;
use App\Models\TeacherAudit;
use App\Models\Timetable;
use App\Models\User;
use App\Policies\AbsencePolicy;
use App\Policies\AcademicYearPolicy;
use App\Policies\AssetPolicy;
use App\Policies\ClassePolicy;
use App\Policies\ClassroomPolicy;
use App\Policies\ElevePolicy;
use App\Policies\EnseignantPolicy;
use App\Policies\EnrollmentPolicy;
use App\Policies\ExpensePolicy;
use App\Policies\FinanceSettingPolicy;
use App\Policies\MatierePolicy;
use App\Policies\MessagePolicy;
use App\Policies\NotePolicy;
use App\Policies\PaiementPolicy;
use App\Policies\ParentModelPolicy;
use App\Policies\RolePolicy;
use App\Policies\SalaryPolicy;
use App\Policies\SchoolPolicy;
use App\Policies\TeacherAuditPolicy;
use App\Policies\TimetablePolicy;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Eleve::class => ElevePolicy::class,
        Classe::class => ClassePolicy::class,
        Paiement::class => PaiementPolicy::class,
        Note::class => NotePolicy::class,
        Absence::class => AbsencePolicy::class,
        Asset::class => AssetPolicy::class,
        School::class => SchoolPolicy::class,
        Enseignant::class => EnseignantPolicy::class,
        Salary::class => SalaryPolicy::class,
        User::class => UserPolicy::class,
        Role::class => RolePolicy::class,
        AcademicYear::class => AcademicYearPolicy::class,
        Classroom::class => ClassroomPolicy::class,
        Matiere::class => MatierePolicy::class,
        FinanceSetting::class => FinanceSettingPolicy::class,
        ParentModel::class => ParentModelPolicy::class,
        TeacherAudit::class => TeacherAuditPolicy::class,
        Message::class => MessagePolicy::class,
        Timetable::class => TimetablePolicy::class,
        Expense::class => ExpensePolicy::class,
        Enrollment::class => EnrollmentPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        Gate::before(function ($user) {
            return method_exists($user, 'hasRole') && $user->hasRole('super_admin') ? true : null;
        });
    }
}
