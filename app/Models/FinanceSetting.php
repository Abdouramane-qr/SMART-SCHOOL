<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceSetting extends Model
{
    protected $fillable = [
        'school_id',
        'setting_key',
        'setting_value',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
