<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use App\Models\School;
use App\Models\Classe;
use App\Support\CacheKey;
use Illuminate\Support\Facades\Cache;

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

    protected static function booted(): void
    {
        static::creating(function (Eleve $eleve): void {
            if (! $eleve->student_id) {
                $initial = 'E';
                if ($eleve->school_id) {
                    $schoolName = School::find($eleve->school_id)?->name;
                    if ($schoolName) {
                        $initial = Str::upper(Str::substr($schoolName, 0, 1));
                    }
                }

                $year = now()->format('Y');
                $prefix = $initial.$year;

                $latest = Eleve::where('student_id', 'like', $prefix.'%')
                    ->orderBy('student_id', 'desc')
                    ->first();

                $next = 1;
                if ($latest && $latest->student_id) {
                    $pattern = '/^'.preg_quote($prefix, '/').'-?(\\d+)$/';
                    if (preg_match($pattern, $latest->student_id, $matches)) {
                        $next = (int) $matches[1] + 1;
                    }
                }

                $eleve->student_id = $prefix.'-'.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
            }
        });

        $flushCache = function (Eleve $eleve): void {
            $schoolId = $eleve->school_id;
            $academicYearId = null;
            if ($eleve->classe_id) {
                $academicYearId = Classe::find($eleve->classe_id)?->academic_year_id;
            }

            $tags = CacheKey::tags($schoolId, $academicYearId);
            if ($tags) {
                Cache::tags($tags)->flush();
            }
        };

        static::saved($flushCache);
        static::deleted($flushCache);
    }
}
