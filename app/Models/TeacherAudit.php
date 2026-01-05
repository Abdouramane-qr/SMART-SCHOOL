<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherAudit extends Model
{
    protected $table = 'audit_teachers';

    protected $fillable = [
        'teacher_id',
        'action',
        'old_data',
        'new_data',
        'changed_by',
        'notes',
        'changed_at',
    ];

    protected $casts = [
        'old_data' => 'array',
        'new_data' => 'array',
        'changed_at' => 'datetime',
    ];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Enseignant::class, 'teacher_id');
    }

    public function changer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
