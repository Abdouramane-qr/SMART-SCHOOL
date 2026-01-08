<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AssetStatusChanged
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public ?int $schoolId,
        public int $assetId,
        public ?string $previousStatus,
        public ?string $currentStatus,
        public ?int $changedBy = null,
    ) {
    }
}
