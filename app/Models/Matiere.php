<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
}
