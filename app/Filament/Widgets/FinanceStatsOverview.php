<?php

namespace App\Filament\Widgets;

use App\Services\FinanceService;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class FinanceStatsOverview extends StatsOverviewWidget
{
    public ?int $schoolId = null;
    public ?int $academicYearId = null;

    protected function getStats(): array
    {
        $stats = app(FinanceService::class)->getStats($this->schoolId, $this->academicYearId);

        return [
            Stat::make('Total encaissé', $this->formatAmount($stats['totalPaid'] ?? 0)),
            Stat::make('Total attendu', $this->formatAmount($stats['totalExpected'] ?? 0)),
            Stat::make('Reste à payer', $this->formatAmount($stats['totalRemaining'] ?? 0)),
            Stat::make('Dépenses', $this->formatAmount($stats['totalExpenses'] ?? 0)),
            Stat::make('Salaires', $this->formatAmount($stats['totalSalaries'] ?? 0)),
            Stat::make('Résultat net', $this->formatAmount($stats['netResult'] ?? 0)),
        ];
    }

    //

    private function formatAmount(float $amount): string
    {
        return number_format($amount, 0, '.', ' ');
    }
}
