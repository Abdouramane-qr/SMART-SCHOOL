<?php

namespace App\Services;

use App\Exceptions\AiRagSecurityException;
use Illuminate\Support\Facades\Cache;

class AiRagSecurityService
{
    private array $limitsPerMinute = [
        'admin' => 30,
        'accountant' => 30,
        'teacher' => 40,
        'student' => 60,
        'parent' => 50,
    ];

    private array $documentTypeAllowList = [
        'admin' => [
            'school_overview',
            'finance_month',
        ],
        'accountant' => [
            'payments_status',
        ],
        'teacher' => [
            'class_summary',
        ],
        'student' => [
            'student_summary',
            'timetable',
        ],
        'parent' => [
            'children_summary',
        ],
    ];

    private array $sourceTableAllowList = [
        'admin' => [
            'schools',
            'paiements',
            'expenses',
            'salaries',
        ],
        'accountant' => [
            'paiements',
        ],
        'teacher' => [
            'classes',
        ],
        'student' => [
            'eleves',
            'timetables',
        ],
        'parent' => [
            'parents',
        ],
    ];

    private int $denyThreshold = 5;
    private int $denyWindowSeconds = 600;

    public function checkRateLimit(string $role, int $userId): array
    {
        $limit = $this->limitsPerMinute[$role] ?? 30;
        $key = "ai:rate:{$role}:{$userId}";
        $count = Cache::increment($key);

        if ($count === 1) {
            Cache::put($key, $count, now()->addSeconds(60));
        }

        return [
            'allowed' => $count <= $limit,
            'limit' => $limit,
            'count' => $count,
        ];
    }

    public function recordDenied(int $userId): array
    {
        $key = "ai:denied:{$userId}";
        $count = Cache::increment($key);

        if ($count === 1) {
            Cache::put($key, $count, now()->addSeconds($this->denyWindowSeconds));
        }

        $flagged = $count >= $this->denyThreshold;

        return [
            'flagged' => $flagged,
            'reason' => $flagged ? 'repeated_denied_access' : null,
        ];
    }

    public function validateDocuments(string $role, array $documents): array
    {
        if (! isset($this->documentTypeAllowList[$role], $this->sourceTableAllowList[$role])) {
            return [
                'allowed' => false,
                'reason' => "role_not_allowed: {$role}",
            ];
        }

        $allowedTypes = $this->documentTypeAllowList[$role];
        $allowedTables = $this->sourceTableAllowList[$role];

        foreach ($documents as $doc) {
            $type = is_object($doc) ? ($doc->document_type ?? null) : ($doc['document_type'] ?? null);
            $table = is_object($doc) ? ($doc->source_table ?? null) : ($doc['source_table'] ?? null);

            if (! $type || ! in_array($type, $allowedTypes, true)) {
                return [
                    'allowed' => false,
                    'reason' => $type ? "unexpected_document_type: {$type}" : 'missing_document_type',
                ];
            }

            if (! $table || ! in_array($table, $allowedTables, true)) {
                return [
                    'allowed' => false,
                    'reason' => $table ? "unexpected_source_table: {$table}" : 'missing_source_table',
                ];
            }
        }

        return [
            'allowed' => true,
            'reason' => null,
        ];
    }

    public function assertDocumentsAllowed(string $role, array $documents): void
    {
        $result = $this->validateDocuments($role, $documents);
        if ($result['allowed']) {
            return;
        }

        $reason = (string) ($result['reason'] ?? 'access_denied');
        throw new AiRagSecurityException($reason, 'Access denied: unexpected RAG document metadata.');
    }

    public function allowListForRole(string $role): array
    {
        return [
            'document_types' => $this->documentTypeAllowList[$role] ?? [],
            'source_tables' => $this->sourceTableAllowList[$role] ?? [],
        ];
    }
}
