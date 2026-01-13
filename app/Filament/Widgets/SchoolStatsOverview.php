<?php

namespace App\Filament\Widgets;

use App\Models\Classe;
use App\Models\Eleve;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class SchoolStatsOverview extends StatsOverviewWidget
{
    public ?int $schoolId = null;
    public ?int $academicYearId = null;

    protected function getStats(): array
    {
        $studentsQuery = Eleve::query();
        $classesQuery = Classe::query();

        if ($this->schoolId) {
            $studentsQuery->where('school_id', $this->schoolId);
            $classesQuery->where('school_id', $this->schoolId);
        }

        if ($this->academicYearId) {
            $studentsQuery->whereHas('classe', function ($builder): void {
                $builder->where('academic_year_id', $this->academicYearId);
            });
            $classesQuery->where('academic_year_id', $this->academicYearId);
        }

        return [
            Stat::make('Élèves', (string) $studentsQuery->count())
                ->description('Effectif total')
                ->icon('heroicon-o-users')
                ->color('primary'),
            Stat::make('Classes', (string) $classesQuery->count())
                ->description('Classes actives')
                ->icon('heroicon-o-academic-cap')
                ->color('gray'),
        ];
    }

    //
}
