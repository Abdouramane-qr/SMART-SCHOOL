<?php

namespace App\Filament\Pages;

use App\Models\AcademicYear;
use App\Models\School;
use App\Filament\Widgets\FinanceMonthlyChart;
use App\Filament\Widgets\FinanceStatsOverview;
use App\Filament\Widgets\SchoolStatsOverview;
use Filament\Pages\Page;
use Filament\Widgets\AccountWidget;
use Filament\Widgets\FilamentInfoWidget;

class Dashboard extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-home';
    protected static ?string $title = 'Dashboard';
    protected static string $view = 'filament.pages.dashboard';

    public ?int $schoolId = null;
    public ?int $academicYearId = null;

    public function mount(): void
    {
        $user = auth()->user();
        $this->schoolId = request()->integer('school_id') ?: $user?->school_id;
        $this->academicYearId = request()->integer('academic_year_id');

        if (! $this->academicYearId) {
            $this->academicYearId = AcademicYear::query()
                ->when($this->schoolId, fn ($query) => $query->where('school_id', $this->schoolId))
                ->where('is_active', true)
                ->value('id');
        }
    }

    protected function getHeaderWidgets(): array
    {
        return [
            FinanceStatsOverview::class,
            SchoolStatsOverview::class,
        ];
    }

    protected function getWidgets(): array
    {
        return [
            FinanceMonthlyChart::class,
        ];
    }

    protected function getFooterWidgets(): array
    {
        return [
            AccountWidget::class,
            FilamentInfoWidget::class,
        ];
    }

    public function getWidgetData(): array
    {
        return [
            'schoolId' => $this->schoolId,
            'academicYearId' => $this->academicYearId,
        ];
    }

    public function getViewData(): array
    {
        $user = auth()->user();
        $schoolId = $this->schoolId ?? $user?->school_id;

        $schoolsQuery = School::query()->select(['id', 'name']);
        if ($user?->school_id) {
            $schoolsQuery->where('id', $user->school_id);
        }

        $schools = $schoolsQuery->orderBy('name')->get();

        $yearsQuery = AcademicYear::query()->select(['id', 'name', 'school_id', 'is_active']);
        if ($schoolId) {
            $yearsQuery->where('school_id', $schoolId);
        }

        $years = $yearsQuery->orderByDesc('start_date')->get();

        return [
            'schools' => $schools,
            'years' => $years,
            'selectedSchoolId' => $this->schoolId,
            'selectedAcademicYearId' => $this->academicYearId,
        ];
    }
}
