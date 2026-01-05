<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Classroom extends Model
{
    protected $fillable = [
        'school_id',
        'name',
        'capacity',
        'building',
        'floor',
        'equipment',
    ];

    protected $casts = [
        'equipment' => 'array',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function timetables(): HasMany
    {
        return $this->hasMany(Timetable::class);
    }
}
