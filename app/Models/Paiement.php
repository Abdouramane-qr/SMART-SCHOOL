<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use App\Support\CacheKey;
use App\Services\FinanceService;
use Illuminate\Support\Facades\Cache;

class Paiement extends Model
{
    protected $fillable = [
        'school_id',
        'eleve_id',
        'amount',
        'paid_amount',
        'payment_date',
        'due_date',
        'method',
        'payment_type',
        'status',
        'notes',
        'receipt_number',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function eleve(): BelongsTo
    {
        return $this->belongsTo(Eleve::class);
    }

    protected static function booted(): void
    {
        static::saving(function (Paiement $paiement): void {
            if ($paiement->school_id === null && $paiement->eleve_id) {
                $eleve = Eleve::query()->find($paiement->eleve_id);
                if ($eleve) {
                    $paiement->school_id = $eleve->school_id;
                }
            }

            if (! $paiement->method && $paiement->payment_type) {
                $paiement->method = $paiement->payment_type;
            }

            if ($paiement->amount === null && $paiement->paid_amount !== null) {
                $paiement->amount = $paiement->paid_amount;
            }

            if ($paiement->paid_amount === null && $paiement->amount !== null) {
                $paiement->paid_amount = $paiement->amount;
            }

            if (! $paiement->status && $paiement->amount !== null) {
                $amount = (float) $paiement->amount;
                $paid = (float) ($paiement->paid_amount ?? 0);
                if ($paid >= $amount && $amount > 0) {
                    $paiement->status = 'paye';
                } elseif ($paid > 0) {
                    $paiement->status = 'partiel';
                } elseif ($paiement->due_date) {
                    $due = Carbon::parse($paiement->due_date);
                    if ($due->isPast()) {
                        $paiement->status = 'en_retard';
                    }
                }
            }
        });

        $flushCache = function (Paiement $paiement): void {
            if (! $paiement->school_id) {
                return;
            }

            $eleve = $paiement->eleve;
            if (! $eleve && $paiement->eleve_id) {
                $eleve = Eleve::query()->with('classe')->find($paiement->eleve_id);
            }
            $academicYearId = $eleve?->classe?->academic_year_id;

            Cache::tags(CacheKey::tags($paiement->school_id, $academicYearId))->flush();
            app(FinanceService::class)->invalidateStatsCache($paiement->school_id, $academicYearId);
        };

        static::saved($flushCache);
        static::deleted($flushCache);
    }
}
