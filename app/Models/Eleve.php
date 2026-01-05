<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Eleve extends Model
{
    protected $fillable = [
        'school_id',
        'classe_id',
        'student_id',
        'full_name',
        'first_name',
        'last_name',
        'gender',
        'birth_date',
        'address',
        'user_id',
        'parent_name',
        'parent_phone',
        'parent_email',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parents(): BelongsToMany
    {
        return $this->belongsToMany(ParentModel::class, 'eleve_parent', 'eleve_id', 'parent_id');
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
