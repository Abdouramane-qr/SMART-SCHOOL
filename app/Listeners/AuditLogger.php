<?php

namespace App\Listeners;

use App\Events\AssetStatusChanged;
use App\Models\AuditLog;

class AuditLogger
{
    public function handle(object $event): void
    {
        [$entityType, $action] = $this->resolveEventMeta($event);

        if (! $entityType || ! $action) {
            return;
        }

        $payload = [
            'school_id' => $event->schoolId ?? null,
            'entity_type' => $entityType,
            'entity_id' => $event->entityId ?? null,
            'action' => $action,
            'old_data' => $event->oldData ?? null,
            'new_data' => $event->newData ?? null,
            'changed_by' => $event->changedBy ?? auth()->id(),
        ];

        if ($event instanceof AssetStatusChanged) {
            $payload['entity_id'] = $event->assetId;
            $payload['old_data'] = ['status' => $event->previousStatus];
            $payload['new_data'] = ['status' => $event->currentStatus];
        }

        if (! $payload['entity_id']) {
            return;
        }

        AuditLog::create($payload);
    }

    private function resolveEventMeta(object $event): array
    {
        return match (true) {
            $event instanceof \App\Events\PaymentCreated => ['paiement', 'created'],
            $event instanceof \App\Events\PaymentUpdated => ['paiement', 'updated'],
            $event instanceof \App\Events\PaymentDeleted => ['paiement', 'deleted'],
            $event instanceof \App\Events\ExpenseCreated => ['depense', 'created'],
            $event instanceof \App\Events\ExpenseUpdated => ['depense', 'updated'],
            $event instanceof \App\Events\ExpenseDeleted => ['depense', 'deleted'],
            $event instanceof \App\Events\SalaryCreated => ['salaire', 'created'],
            $event instanceof \App\Events\SalaryUpdated => ['salaire', 'updated'],
            $event instanceof \App\Events\SalaryDeleted => ['salaire', 'deleted'],
            $event instanceof \App\Events\AssetCreated => ['asset', 'created'],
            $event instanceof \App\Events\AssetUpdated => ['asset', 'updated'],
            $event instanceof \App\Events\AssetDeleted => ['asset', 'deleted'],
            $event instanceof AssetStatusChanged => ['asset', 'status_changed'],
            default => [null, null],
        };
    }
}
