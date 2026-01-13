<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Support\CacheKey;
use App\Services\FinanceService;
use Illuminate\Support\Facades\Cache;

class Salary extends Model
{
    protected $fillable = [
        'school_id',
        'teacher_id',
        'amount',
        'payment_date',
        'month',
        'year',
        'bonus',
        'deductions',
        'net_amount',
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

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Enseignant::class, 'teacher_id');
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
        $flushCache = function (Salary $salary): void {
            if (! $salary->school_id) {
                return;
            }
            Cache::tags(CacheKey::tags($salary->school_id, null))->flush();
            app(FinanceService::class)->invalidateStatsCache($salary->school_id, null);
        };

        static::saved($flushCache);
        static::deleted($flushCache);
    }
}
