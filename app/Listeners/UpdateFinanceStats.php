<?php

namespace App\Listeners;

use App\Services\FinanceService;

class UpdateFinanceStats
{
    public function __construct(private FinanceService $financeService)
    {
    }

    public function handle(object $event): void
    {
        $this->financeService->refreshStats(
            $event->schoolId ?? null,
            $event->academicYearId ?? null,
        );
    }
}
