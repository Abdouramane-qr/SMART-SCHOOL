<?php

namespace App\Providers;

use App\Events\AssetCreated;
use App\Events\AssetDeleted;
use App\Events\AssetStatusChanged;
use App\Events\AssetUpdated;
use App\Events\ExpenseCreated;
use App\Events\ExpenseDeleted;
use App\Events\ExpenseUpdated;
use App\Events\PaymentCreated;
use App\Events\PaymentDeleted;
use App\Events\PaymentUpdated;
use App\Events\SalaryCreated;
use App\Events\SalaryDeleted;
use App\Events\SalaryUpdated;
use App\Listeners\AuditLogger;
use App\Listeners\InvalidateFinanceCache;
use App\Listeners\RecordAssetStatusChange;
use App\Listeners\UpdateFinanceStats;
use App\Services\GlobalAuditLogger;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\Event;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        $financeEvents = [
            PaymentCreated::class,
            PaymentUpdated::class,
            PaymentDeleted::class,
            ExpenseCreated::class,
            ExpenseUpdated::class,
            ExpenseDeleted::class,
            SalaryCreated::class,
            SalaryUpdated::class,
            SalaryDeleted::class,
        ];

        foreach ($financeEvents as $event) {
            Event::listen($event, [InvalidateFinanceCache::class, 'handle']);
            Event::listen($event, [UpdateFinanceStats::class, 'handle']);
            Event::listen($event, [AuditLogger::class, 'handle']);
        }

        $assetEvents = [
            AssetCreated::class,
            AssetUpdated::class,
            AssetDeleted::class,
        ];

        foreach ($assetEvents as $event) {
            Event::listen($event, [InvalidateFinanceCache::class, 'handle']);
            Event::listen($event, [AuditLogger::class, 'handle']);
        }

        Event::listen(AssetStatusChanged::class, [InvalidateFinanceCache::class, 'handle']);
        Event::listen(AssetStatusChanged::class, [RecordAssetStatusChange::class, 'handle']);
        Event::listen(AssetStatusChanged::class, [AuditLogger::class, 'handle']);

        Event::listen('eloquent.created: *', function (string $event, array $data): void {
            $model = $data[0] ?? null;
            if (! $model instanceof Model || ! GlobalAuditLogger::shouldLogModel($model)) {
                return;
            }
            GlobalAuditLogger::logModelEvent('created', $model);
        });

        Event::listen('eloquent.updated: *', function (string $event, array $data): void {
            $model = $data[0] ?? null;
            if (! $model instanceof Model || ! GlobalAuditLogger::shouldLogModel($model)) {
                return;
            }
            GlobalAuditLogger::logModelEvent('updated', $model);
        });

        Event::listen('eloquent.deleted: *', function (string $event, array $data): void {
            $model = $data[0] ?? null;
            if (! $model instanceof Model || ! GlobalAuditLogger::shouldLogModel($model)) {
                return;
            }
            GlobalAuditLogger::logModelEvent('deleted', $model);
        });
    }
}
