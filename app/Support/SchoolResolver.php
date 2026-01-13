<?php

namespace App\Support;

use App\Models\School;

class SchoolResolver
{
    public static function activeId(): ?int
    {
        $ids = School::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->pluck('id');

        if ($ids->count() === 1) {
            return (int) $ids->first();
        }

        return null;
    }

    public static function requireActiveId(): int
    {
        $ids = School::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->pluck('id');

        if ($ids->count() === 1) {
            return (int) $ids->first();
        }

        if ($ids->count() === 0) {
            abort(409, "Aucune ecole active n'est definie. Activez une ecole pour continuer.");
        }

        $keepId = (int) $ids->first();
        School::query()
            ->where('id', '!=', $keepId)
            ->update(['is_active' => false]);
        return $keepId;
    }
}
