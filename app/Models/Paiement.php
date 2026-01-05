<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Paiement extends Model
{
    protected $fillable = [
        'school_id',
        'eleve_id',
        'amount',
        'paid_amount',
        'payment_date',
        'due_date',
        'method',
        'payment_type',
        'status',
        'notes',
        'receipt_number',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function eleve(): BelongsTo
    {
        return $this->belongsTo(Eleve::class);
    }
}
