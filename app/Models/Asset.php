<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Asset extends Model
{
    protected $fillable = [
        'school_id',
        'expense_id',
        'name',
        'description',
        'category',
        'status',
        'acquisition_date',
        'acquisition_value',
        'current_value',
        'location',
        'serial_number',
        'supplier',
        'warranty_end_date',
        'notes',
        'created_by',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
