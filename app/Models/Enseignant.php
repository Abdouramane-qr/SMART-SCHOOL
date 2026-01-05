<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Enseignant extends Model
{
    protected $fillable = [
        'school_id',
        'first_name',
        'last_name',
        'phone',
        'email',
        'user_id',
        'specialization',
        'hire_date',
        'monthly_salary',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(Classe::class, 'classe_enseignant');
    }
}
