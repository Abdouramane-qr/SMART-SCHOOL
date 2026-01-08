<?php

namespace App\Services;

use App\Events\AssetCreated;
use App\Events\AssetDeleted;
use App\Events\AssetStatusChanged;
use App\Events\AssetUpdated;
use App\Models\Asset;
use App\Support\CacheKey;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Carbon;

class AssetService
{
    public function __construct(private FinanceService $financeService)
    {
    }

    public function create(array $payload): Asset
    {
        if (empty($payload['status'])) {
            $payload['status'] = 'actif';
        }

        $asset = Asset::create($payload);
        $this->syncExpenseForAsset($asset);
        $this->flushAssetCache($asset->school_id);
        $this->dispatchAssetEvent($asset, 'created', null, $asset->toArray());

        return $asset;
    }

    public function update(Asset $asset, array $payload): Asset
    {
        $previousStatus = $asset->status;
        $oldData = $asset->toArray();
        $asset->update($payload);
        $this->syncExpenseForAsset($asset);
        $this->flushAssetCache($asset->school_id);

        $this->dispatchAssetEvent($asset, 'updated', $oldData, $asset->toArray());

        if ($previousStatus !== $asset->status) {
            event(new AssetStatusChanged(
                $asset->school_id,
                $asset->id,
                $previousStatus,
                $asset->status,
                auth()->id(),
            ));
        }

        return $asset;
    }

    public function delete(Asset $asset): void
    {
        $schoolId = $asset->school_id;
        $oldData = $asset->toArray();
        $expense = $asset->expense;
        if ($expense) {
            $this->financeService->deleteExpense($expense);
        }

        $asset->delete();
        $this->flushAssetCache($schoolId);
        $this->dispatchAssetEventByIds($schoolId, $asset->id, 'deleted', $oldData, null);
    }

    private function syncExpenseForAsset(Asset $asset): void
    {
        $amount = (float) ($asset->acquisition_value ?? 0);
        $expense = $asset->expense;

        if ($amount <= 0) {
            if ($expense) {
                $this->financeService->deleteExpense($expense);
                $asset->forceFill(['expense_id' => null])->save();
            }
            return;
        }

        $payload = [
            'school_id' => $asset->school_id,
            'category' => 'equipement',
            'description' => $this->expenseDescription($asset),
            'amount' => $amount,
            'expense_date' => $this->expenseDate($asset),
            'receipt_number' => null,
            'notes' => null,
            'created_by' => $asset->created_by,
        ];

        if ($expense) {
            $this->financeService->updateExpense($expense, $payload);
            return;
        }

        $created = $this->financeService->createExpense($payload);
        $asset->forceFill(['expense_id' => $created->id])->save();
    }

    private function expenseDescription(Asset $asset): string
    {
        return "Achat actif: {$asset->name}";
    }

    private function expenseDate(Asset $asset): string
    {
        if ($asset->acquisition_date) {
            return (string) $asset->acquisition_date;
        }

        return Carbon::now()->toDateString();
    }

    private function flushAssetCache(?int $schoolId): void
    {
        if (! $schoolId) {
            return;
        }

        Cache::tags(CacheKey::tags($schoolId, null))->flush();
    }

    private function dispatchAssetEvent(Asset $asset, string $action, ?array $oldData, ?array $newData): void
    {
        $this->dispatchAssetEventByIds($asset->school_id, $asset->id, $action, $oldData, $newData);
    }

    private function dispatchAssetEventByIds(
        ?int $schoolId,
        ?int $entityId,
        string $action,
        ?array $oldData,
        ?array $newData,
    ): void {
        if (! $schoolId || ! $entityId) {
            return;
        }

        match ($action) {
            'created' => event(new AssetCreated($schoolId, $entityId, $oldData, $newData, auth()->id())),
            'updated' => event(new AssetUpdated($schoolId, $entityId, $oldData, $newData, auth()->id())),
            'deleted' => event(new AssetDeleted($schoolId, $entityId, $oldData, $newData, auth()->id())),
            default => null,
        };
    }
}
