<?php

namespace App\Models;

use App\Support\CacheKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class Note extends Model
{
    protected $fillable = [
        'school_id',
        'eleve_id',
        'matiere_id',
        'class_id',
        'academic_year_id',
        'value',
        'term',
        'grade_type',
        'weight',
        'description',
        'evaluation_date',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function eleve(): BelongsTo
    {
        return $this->belongsTo(Eleve::class);
    }

    public function matiere(): BelongsTo
    {
        return $this->belongsTo(Matiere::class);
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class, 'class_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    protected static function booted(): void
    {
        static::saving(function (Note $note): void {
            if (($note->school_id === null || $note->academic_year_id === null) && $note->class_id) {
                $classe = Classe::query()->find($note->class_id);
                if ($classe) {
                    $note->school_id = $note->school_id ?? $classe->school_id;
                    $note->academic_year_id = $note->academic_year_id ?? $classe->academic_year_id;
                }
            }

            if (($note->school_id === null || $note->academic_year_id === null) && $note->eleve_id) {
                $eleve = Eleve::query()->with('classe')->find($note->eleve_id);
                if ($eleve) {
                    $note->school_id = $note->school_id ?? $eleve->school_id;
                    $note->academic_year_id = $note->academic_year_id ?? $eleve->classe?->academic_year_id;
                    $note->class_id = $note->class_id ?? $eleve->classe_id;
                }
            }
        });

        $flushCache = function (Note $note): void {
            if (! $note->school_id) {
                return;
            }
            Cache::tags(CacheKey::tags($note->school_id, $note->academic_year_id))->flush();
        };

        static::saved($flushCache);
        static::deleted($flushCache);
    }
}
