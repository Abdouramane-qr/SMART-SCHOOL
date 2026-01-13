<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Support\CacheKey;
use App\Services\FinanceService;
use Illuminate\Support\Facades\Cache;

class Expense extends Model
{
    protected $fillable = [
        'school_id',
        'category',
        'description',
        'amount',
        'expense_date',
        'receipt_number',
        'notes',
        'created_by',
        'status',
        'approved_at',
        'approved_by',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    protected static function booted(): void
    {
        $flushCache = function (Expense $expense): void {
            if (! $expense->school_id) {
                return;
            }
            Cache::tags(CacheKey::tags($expense->school_id, null))->flush();
            app(FinanceService::class)->invalidateStatsCache($expense->school_id, null);
        };

        static::saved($flushCache);
        static::deleted($flushCache);
    }
}
