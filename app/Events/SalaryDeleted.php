<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SalaryDeleted
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public ?int $schoolId,
        public ?int $entityId = null,
        public ?array $oldData = null,
        public ?array $newData = null,
        public ?int $changedBy = null,
    ) {
    }
}
