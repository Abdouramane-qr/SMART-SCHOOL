<?php

namespace App\Support;

class StatusMap
{
    private static ?array $map = null;

    public static function filament(string $status, string $fallback = 'gray'): string
    {
        $entry = self::all()[$status] ?? null;
        if (! is_array($entry)) {
            return $fallback;
        }

        return (string) ($entry['filament'] ?? $fallback);
    }

    public static function all(): array
    {
        if (self::$map !== null) {
            return self::$map;
        }

        $path = resource_path('shared/statuses.json');
        if (! is_file($path)) {
            self::$map = [];
            return self::$map;
        }

        $raw = file_get_contents($path);
        $decoded = $raw ? json_decode($raw, true) : null;
        self::$map = is_array($decoded) ? $decoded : [];

        return self::$map;
    }
}
