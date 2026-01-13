<?php

namespace App\Filament\Concerns;

use App\Services\SystemAlertService;

trait HasSystemAlerts
{
    protected function notifySystemAlerts(): void
    {
        try {
            app(SystemAlertService::class)->notify();
        } catch (\Throwable) {
            // Never block Filament pages on alert checks.
        }
    }
}
