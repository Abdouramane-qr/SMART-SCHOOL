<?php

namespace App\Listeners;

use App\Events\AssetStatusChanged;
use Illuminate\Support\Facades\Log;

class RecordAssetStatusChange
{
    public function handle(AssetStatusChanged $event): void
    {
        Log::info('Asset status changed', [
            'asset_id' => $event->assetId,
            'school_id' => $event->schoolId,
            'previous_status' => $event->previousStatus,
            'current_status' => $event->currentStatus,
        ]);
    }
}
