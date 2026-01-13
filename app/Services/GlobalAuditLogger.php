<?php

namespace App\Services;

use App\Support\SchoolResolver;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class GlobalAuditLogger
{
    private static ?bool $tableAvailable = null;

    public static function log(string $action, string $entity, array $metadata = []): void
    {
        if (! self::isTableAvailable()) {
            return;
        }

        $user = Auth::user();
        $role = $user?->getRoleNames()->values()->all() ?? [];
        $roleValue = $role ? implode(',', $role) : null;

        $schoolId = $metadata['school_id'] ?? SchoolResolver::activeId();
        $entityId = $metadata['entity_id'] ?? null;

        try {
            DB::table('audit_logs')->insert([
                'user_id' => $user?->id,
                'role' => $roleValue,
                'school_id' => $schoolId,
                'action' => $action,
                'entity' => $entity,
                'metadata' => self::encodeJson($metadata),
                'ip' => self::resolveIp(),
                'created_at' => now(),
                'updated_at' => now(),
                'entity_type' => $entity,
                'entity_id' => $entityId,
                'changed_by' => $user?->id,
                'old_data' => self::encodeJson($metadata['old_data'] ?? null),
                'new_data' => self::encodeJson($metadata['new_data'] ?? null),
            ]);
        } catch (\Throwable) {
            // Never block core flows on audit logging failures.
        }
    }

    public static function logModelEvent(string $action, Model $model): void
    {
        if (! Auth::check()) {
            return;
        }

        $entity = class_basename($model);
        $metadata = [
            'entity_id' => $model->getKey(),
            'model' => $model::class,
        ];

        $schoolId = $model->getAttribute('school_id');
        if ($schoolId) {
            $metadata['school_id'] = (int) $schoolId;
        }

        if ($action === 'updated') {
            $changes = $model->getChanges();
            unset($changes['updated_at']);
            if (empty($changes)) {
                return;
            }

            $original = Arr::only($model->getOriginal(), array_keys($changes));
            $metadata['changes'] = array_keys($changes);
            $metadata['old_data'] = $original;
            $metadata['new_data'] = $changes;
        }

        self::log($action, $entity, $metadata);
    }

    public static function shouldLogModel(Model $model): bool
    {
        if (! Str::startsWith($model::class, 'App\\Models\\')) {
            return false;
        }

        return ! $model instanceof \App\Models\AuditLog;
    }

    private static function isTableAvailable(): bool
    {
        if (self::$tableAvailable !== null) {
            return self::$tableAvailable;
        }

        try {
            self::$tableAvailable = Schema::hasTable('audit_logs');
        } catch (\Throwable) {
            self::$tableAvailable = false;
        }

        return self::$tableAvailable;
    }

    private static function resolveIp(): ?string
    {
        try {
            return request()->ip();
        } catch (\Throwable) {
            return null;
        }
    }

    private static function encodeJson(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return json_encode($value, JSON_UNESCAPED_UNICODE);
    }
}
