<?php

namespace App\Listeners;

use App\Services\FinanceService;

class InvalidateFinanceCache
{
    public function __construct(private FinanceService $financeService)
    {
    }

    public function handle(object $event): void
    {
        $this->financeService->invalidateStatsCache(
            $event->schoolId ?? null,
            $event->academicYearId ?? null,
        );
    }
}
