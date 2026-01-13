<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AiRagAuditLogger
{
    private ?bool $tableAvailable = null;
    private ?array $columnAvailable = null;

    public function log(array $payload): void
    {
        if (! $this->canLog()) {
            return;
        }

        $columns = $this->availableColumns();
        $record = [
            'school_id' => $payload['school_id'] ?? null,
            'user_id' => $payload['user_id'] ?? null,
            'role' => $payload['role'] ?? null,
            'agent_key' => $payload['agent_key'] ?? null,
            'correlation_id' => $payload['correlation_id'] ?? null,
            'status' => $payload['status'] ?? 'ok',
            'question' => null,
            'queries' => $payload['queries'] ?? null,
            'document_ids' => $payload['document_ids'] ?? null,
            'documents_count' => $payload['documents_count'] ?? 0,
            'flagged' => (bool) ($payload['flagged'] ?? false),
            'flag_reason' => $payload['flag_reason'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        $record['queries'] = $this->encodeJsonColumn($record['queries']);
        $record['document_ids'] = $this->encodeJsonColumn($record['document_ids']);

        foreach ($record as $key => $value) {
            if (! ($columns[$key] ?? false)) {
                unset($record[$key]);
            }
        }

        DB::table('ai_audit_logs')->insert($record);
    }

    private function canLog(): bool
    {
        if ($this->tableAvailable !== null) {
            return $this->tableAvailable;
        }

        $this->tableAvailable = Schema::hasTable('ai_audit_logs');

        return $this->tableAvailable;
    }

    private function availableColumns(): array
    {
        if ($this->columnAvailable !== null) {
            return $this->columnAvailable;
        }

        $columns = Schema::getColumnListing('ai_audit_logs');
        $this->columnAvailable = array_fill_keys($columns, true);

        return $this->columnAvailable;
    }

    private function encodeJsonColumn(mixed $value): mixed
    {
        if ($value === null || is_string($value)) {
            return $value;
        }

        if (is_array($value) || is_object($value)) {
            $encoded = json_encode($value, JSON_UNESCAPED_UNICODE);
            return $encoded === false ? null : $encoded;
        }

        return $value;
    }
}
