<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\School;
use Filament\Notifications\Notification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class SystemAlertService
{
    private const FORBIDDEN_WINDOW_MINUTES = 30;
    private const FORBIDDEN_THRESHOLD = 5;
    private const IMPORT_WINDOW_HOURS = 24;
    private const ALERT_COOLDOWN_MINUTES = 5;

    public function notify(): void
    {
        if (app()->runningInConsole()) {
            return;
        }

        if (! Auth::check()) {
            return;
        }

        foreach ($this->buildAlerts() as $alert) {
            if (! $this->shouldSend($alert['key'])) {
                continue;
            }

            $notification = Notification::make()
                ->title($alert['title'])
                ->body($alert['body']);

            match ($alert['severity']) {
                'critical' => $notification->danger(),
                'warning' => $notification->warning(),
                default => $notification->info(),
            };

            $notification->send();
        }
    }

    private function buildAlerts(): array
    {
        $alerts = [];
        $activeCount = School::query()->where('is_active', true)->count();

        if ($activeCount === 0) {
            $alerts[] = [
                'key' => 'no_active_school',
                'severity' => 'critical',
                'title' => "Aucune ecole active",
                'body' => "Activez une ecole pour eviter les erreurs metier.",
            ];
        } elseif ($activeCount > 1) {
            $alerts[] = [
                'key' => 'multiple_active_schools',
                'severity' => 'critical',
                'title' => "Plusieurs ecoles actives",
                'body' => "Une seule ecole doit etre active dans le mode mono-school.",
            ];
        }

        $recentForbidden = AuditLog::query()
            ->where('action', 'access_denied')
            ->where('created_at', '>=', now()->subMinutes(self::FORBIDDEN_WINDOW_MINUTES))
            ->count();

        if ($recentForbidden >= self::FORBIDDEN_THRESHOLD) {
            $alerts[] = [
                'key' => 'repeated_forbidden',
                'severity' => 'warning',
                'title' => "Acces refuses repetes",
                'body' => "Plusieurs refus d'acces recents ont ete detectes.",
            ];
        }

        if ($this->hasRecentFailedImports()) {
            $alerts[] = [
                'key' => 'failed_imports',
                'severity' => 'warning',
                'title' => "Imports en erreur",
                'body' => "Des imports CSV recents contiennent des erreurs.",
            ];
        }

        return $alerts;
    }

    private function hasRecentFailedImports(): bool
    {
        $since = now()->subHours(self::IMPORT_WINDOW_HOURS);
        $logs = AuditLog::query()
            ->where('action', 'import')
            ->where('created_at', '>=', $since)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get(['metadata']);

        foreach ($logs as $log) {
            $meta = $log->metadata;
            if (is_string($meta)) {
                $meta = json_decode($meta, true);
            }
            if (is_array($meta) && ($meta['errors_count'] ?? 0) > 0) {
                return true;
            }
        }

        return false;
    }

    private function shouldSend(string $key): bool
    {
        $userId = Auth::id();
        $cacheKey = "system_alert:{$key}:{$userId}";

        return Cache::add($cacheKey, true, now()->addMinutes(self::ALERT_COOLDOWN_MINUTES));
    }
}
