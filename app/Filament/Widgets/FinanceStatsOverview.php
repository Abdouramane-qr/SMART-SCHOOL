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
            Stat::make('Total encaissé', $this->formatAmount($stats['totalPaid'] ?? 0))
                ->description('Encaissements confirmés')
                ->icon('heroicon-o-banknotes')
                ->color('success'),
            Stat::make('Total attendu', $this->formatAmount($stats['totalExpected'] ?? 0))
                ->description('Prévisions')
                ->icon('heroicon-o-chart-bar')
                ->color('primary'),
            Stat::make('Reste à payer', $this->formatAmount($stats['totalRemaining'] ?? 0))
                ->description('Solde restant')
                ->icon('heroicon-o-exclamation-triangle')
                ->color('warning'),
            Stat::make('Dépenses', $this->formatAmount($stats['totalExpenses'] ?? 0))
                ->description('Charges')
                ->icon('heroicon-o-arrow-trending-down')
                ->color('danger'),
            Stat::make('Salaires', $this->formatAmount($stats['totalSalaries'] ?? 0))
                ->description('Masse salariale')
                ->icon('heroicon-o-briefcase')
                ->color('gray'),
            Stat::make('Résultat net', $this->formatAmount($stats['netResult'] ?? 0))
                ->description('Bilan mensuel')
                ->icon('heroicon-o-scale')
                ->color('primary'),
        ];
    }

    //

    private function formatAmount(float $amount): string
    {
        return number_format($amount, 0, '.', ' ');
    }
}
