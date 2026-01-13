<?php

use App\Http\Controllers\Api\AbsenceController;
use App\Http\Controllers\Api\AiAssistantController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\ClasseController;
use App\Http\Controllers\Api\ClassroomController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EleveController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\FinanceSettingController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SalaryController;
use App\Http\Controllers\Api\SchoolYearController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\TeacherAuditController;
use App\Http\Controllers\Api\StudentAuditController;
use App\Http\Controllers\Api\TimetableController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\UserRoleController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\ImportExportController;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function () {
    Route::post('login', [SessionController::class, 'login']);
    Route::post('register', [SessionController::class, 'register']);
    Route::post('logout', [SessionController::class, 'logout'])->middleware('auth:sanctum');
});

Route::get('me', [AuthController::class, 'me']);

Route::middleware(['auth:sanctum', 'require-active-school'])->group(function () {
    Route::post('ai-assistant', [AiAssistantController::class, 'respond']);
    Route::get('roles', [RoleController::class, 'index']);
    Route::apiResource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::post('user-roles', [UserRoleController::class, 'store']);
    Route::delete('user-roles', [UserRoleController::class, 'destroy']);

    Route::apiResource('eleves', EleveController::class);
    Route::apiResource('classes', ClasseController::class);
    Route::apiResource('enrollments', EnrollmentController::class)->only(['index', 'store', 'destroy']);
    Route::apiResource('teachers', TeacherController::class);
    Route::get('teacher-audits', [TeacherAuditController::class, 'index']);
    Route::get('student-audits', [StudentAuditController::class, 'index']);
    Route::apiResource('expenses', ExpenseController::class);
    Route::apiResource('salaries', SalaryController::class);
    Route::apiResource('assets', AssetController::class);
    Route::apiResource('messages', MessageController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::apiResource('subjects', SubjectController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::apiResource('classrooms', ClassroomController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::apiResource('timetable', TimetableController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::apiResource('school-years', SchoolYearController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::post('school-years/{schoolYear}/set-current', [SchoolYearController::class, 'setCurrent']);
    Route::get('finance/stats', [FinanceController::class, 'stats']);
    Route::get('finance/settings', [FinanceSettingController::class, 'index']);
    Route::apiResource('paiements', PaiementController::class);
    Route::apiResource('notes', NoteController::class);
    Route::apiResource('absences', AbsenceController::class);

    Route::get('dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('stats/summary', [StatsController::class, 'summary']);

    Route::get('export/students', [ImportExportController::class, 'exportStudents']);
    Route::get('export/classes', [ImportExportController::class, 'exportClasses']);
    Route::get('export/subjects', [ImportExportController::class, 'exportSubjects']);
    Route::get('export/notes', [ImportExportController::class, 'exportNotes']);
    Route::post('import/students', [ImportExportController::class, 'importStudents']);
    Route::post('import/classes', [ImportExportController::class, 'importClasses']);
    Route::post('import/subjects', [ImportExportController::class, 'importSubjects']);
    Route::post('import/notes', [ImportExportController::class, 'importNotes']);
});
