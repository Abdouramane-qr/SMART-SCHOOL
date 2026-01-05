<?php

namespace App\Models;

use App\Support\CacheKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class Timetable extends Model
{
    protected $fillable = [
        'school_id',
        'academic_year_id',
        'class_id',
        'matiere_id',
        'teacher_id',
        'classroom_id',
        'day_of_week',
        'start_time',
        'end_time',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class, 'class_id');
    }

    public function matiere(): BelongsTo
    {
        return $this->belongsTo(Matiere::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Enseignant::class, 'teacher_id');
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    protected static function booted(): void
    {
        static::saving(function (Timetable $timetable): void {
            if (($timetable->school_id === null || $timetable->academic_year_id === null) && $timetable->class_id) {
                $classe = Classe::query()->find($timetable->class_id);
                if ($classe) {
                    $timetable->school_id = $timetable->school_id ?? $classe->school_id;
                    $timetable->academic_year_id = $timetable->academic_year_id ?? $classe->academic_year_id;
                }
            }
        });

        $flushCache = function (Timetable $timetable): void {
            if (! $timetable->school_id) {
                return;
            }
            Cache::tags(CacheKey::tags($timetable->school_id, $timetable->academic_year_id))->flush();
        };

        static::saved($flushCache);
        static::deleted($flushCache);
    }
}
