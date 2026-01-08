<?php

namespace App\Filament\Widgets;

use App\Services\FinanceService;
use Filament\Widgets\ChartWidget;

class FinanceMonthlyChart extends ChartWidget
{
    protected static ?string $heading = 'Revenus vs Dépenses (mensuel)';

    public ?int $schoolId = null;
    public ?int $academicYearId = null;

    protected function getData(): array
    {
        $stats = app(FinanceService::class)->getStats($this->schoolId, $this->academicYearId);
        $monthly = $stats['monthlyData'] ?? [];

        $labels = array_map(fn ($row) => $row['month'] ?? '', $monthly);
        $revenus = array_map(fn ($row) => (float) ($row['revenus'] ?? 0), $monthly);
        $depenses = array_map(fn ($row) => (float) ($row['depenses'] ?? 0), $monthly);

        return [
            'datasets' => [
                [
                    'label' => 'Revenus',
                    'data' => $revenus,
                    'backgroundColor' => '#217EFD',
                    'borderColor' => '#217EFD',
                ],
                [
                    'label' => 'Dépenses',
                    'data' => $depenses,
                    'backgroundColor' => '#B3B3B3',
                    'borderColor' => '#B3B3B3',
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }

    //
}
