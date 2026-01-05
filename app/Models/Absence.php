<?php

namespace App\Models;

use App\Support\CacheKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class Absence extends Model
{
    protected $fillable = [
        'school_id',
        'eleve_id',
        'classe_id',
        'academic_year_id',
        'absence_date',
        'absence_type',
        'justified',
        'duration_minutes',
        'created_by',
        'date',
        'reason',
        'is_justified',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function eleve(): BelongsTo
    {
        return $this->belongsTo(Eleve::class);
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    protected static function booted(): void
    {
        static::saving(function (Absence $absence): void {
            if (($absence->school_id === null || $absence->academic_year_id === null) && $absence->classe_id) {
                $classe = Classe::query()->find($absence->classe_id);
                if ($classe) {
                    $absence->school_id = $absence->school_id ?? $classe->school_id;
                    $absence->academic_year_id = $absence->academic_year_id ?? $classe->academic_year_id;
                }
            }

            if (($absence->school_id === null || $absence->academic_year_id === null) && $absence->eleve_id) {
                $eleve = Eleve::query()->with('classe')->find($absence->eleve_id);
                if ($eleve) {
                    $absence->school_id = $absence->school_id ?? $eleve->school_id;
                    $absence->academic_year_id = $absence->academic_year_id ?? $eleve->classe?->academic_year_id;
                }
            }
        });

        $flushCache = function (Absence $absence): void {
            if (! $absence->school_id) {
                return;
            }
            Cache::tags(CacheKey::tags($absence->school_id, $absence->academic_year_id))->flush();
        };

        static::saved($flushCache);
        static::deleted($flushCache);
    }
}
