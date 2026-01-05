<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
