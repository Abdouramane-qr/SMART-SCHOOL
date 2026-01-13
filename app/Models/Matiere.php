<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Support\CacheKey;
use Illuminate\Support\Facades\Cache;

class Matiere extends Model
{
    protected $fillable = [
        'school_id',
        'name',
        'code',
        'coefficient',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }

    protected static function booted(): void
    {
        $flushCache = function (Matiere $matiere): void {
            if (! $matiere->school_id) {
                return;
            }
            Cache::tags(CacheKey::tags($matiere->school_id, null))->flush();
        };

        static::saved($flushCache);
        static::deleted($flushCache);
    }
}
