<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Classe extends Model
{
    protected $fillable = [
        'school_id',
        'academic_year_id',
        'name',
        'level',
        'capacity',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function eleves(): HasMany
    {
        return $this->hasMany(Eleve::class);
    }

    public function enseignants(): BelongsToMany
    {
        return $this->belongsToMany(Enseignant::class, 'classe_enseignant');
    }
}
