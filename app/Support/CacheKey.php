<?php

namespace App\Support;

class CacheKey
{
    public static function tags(?int $schoolId, ?int $academicYearId = null): array
    {
        $tags = [];

        if ($schoolId) {
            $tags[] = "school:{$schoolId}";
        }

        if ($academicYearId) {
            $tags[] = "academic_year:{$academicYearId}";
        }

        return $tags;
    }

    public static function key(string $prefix, ?int $schoolId, ?int $academicYearId = null, array $parts = []): string
    {
        $segments = [$prefix];

        if ($schoolId) {
            $segments[] = "school:{$schoolId}";
        }

        if ($academicYearId) {
            $segments[] = "year:{$academicYearId}";
        }

        foreach ($parts as $part) {
            $segments[] = (string) $part;
        }

        return implode('|', $segments);
    }
}
