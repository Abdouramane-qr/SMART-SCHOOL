<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends Model
{
    protected $fillable = [
        'name',
        'code',
        'is_active',
    ];

    public function academicYears(): HasMany
    {
        return $this->hasMany(AcademicYear::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(Classe::class);
    }

    public function eleves(): HasMany
    {
        return $this->hasMany(Eleve::class);
    }

    public function parents(): HasMany
    {
        return $this->hasMany(ParentModel::class, 'school_id');
    }

    public function enseignants(): HasMany
    {
        return $this->hasMany(Enseignant::class);
    }

    public function matieres(): HasMany
    {
        return $this->hasMany(Matiere::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }

    public function absences(): HasMany
    {
        return $this->hasMany(Absence::class);
    }
}
