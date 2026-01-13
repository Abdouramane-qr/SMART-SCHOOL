<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AiRagRepository
{
    private ?bool $documentsAvailable = null;
    private ?bool $documentSearchAvailable = null;

    public function search(string $query, int $limit = 6): array
    {
        if (! $this->canQueryDocuments()) {
            return [];
        }

        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            if ($this->canUseDocumentSearch()) {
                $sql = "select doc_id, document_text, document_type, source_table, source_id,
                    ts_rank_cd(document_search, websearch_to_tsquery('simple', ?)) as rank
                    from ai_documents
                    where document_search @@ websearch_to_tsquery('simple', ?)
                    order by rank desc, updated_at desc
                    limit ?";

                return DB::select($sql, [$query, $query, $limit]);
            }

            $sql = "select doc_id, document_text, document_type, source_table, source_id,
                ts_rank_cd(to_tsvector('simple', document_text), websearch_to_tsquery('simple', ?)) as rank
                from ai_documents
                where to_tsvector('simple', document_text) @@ websearch_to_tsquery('simple', ?)
                order by rank desc, updated_at desc
                limit ?";

            return DB::select($sql, [$query, $query, $limit]);
        }

        $pattern = '%'.$this->escapeLike($query).'%';
        $sql = "select doc_id, document_text, document_type, source_table, source_id
            from ai_documents
            where document_text LIKE ? escape '\\\\'
            order by updated_at desc
            limit ?";

        return DB::select($sql, [$pattern, $limit]);
    }

    public function recent(int $limit = 6): array
    {
        if (! $this->canQueryDocuments()) {
            return [];
        }

        $sql = "select doc_id, document_text, document_type, source_table, source_id
            from ai_documents
            order by updated_at desc
            limit ?";

        return DB::select($sql, [$limit]);
    }

    public function searchWithAudit(string $query, int $limit = 6): array
    {
        if (! $this->canQueryDocuments()) {
            return [
                'rows' => [],
                'query' => null,
            ];
        }

        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            if ($this->canUseDocumentSearch()) {
                $sql = "select doc_id, document_text, document_type, source_table, source_id,
                    ts_rank_cd(document_search, websearch_to_tsquery('simple', ?)) as rank
                    from ai_documents
                    where document_search @@ websearch_to_tsquery('simple', ?)
                    order by rank desc, updated_at desc
                    limit ?";

                $rows = DB::select($sql, [$query, $query, $limit]);

                return [
                    'rows' => $rows,
                    'query' => [
                        'sql' => $sql,
                        'params' => [$query, $query, $limit],
                    ],
                ];
            }

            $sql = "select doc_id, document_text, document_type, source_table, source_id,
                ts_rank_cd(to_tsvector('simple', document_text), websearch_to_tsquery('simple', ?)) as rank
                from ai_documents
                where to_tsvector('simple', document_text) @@ websearch_to_tsquery('simple', ?)
                order by rank desc, updated_at desc
                limit ?";

            $rows = DB::select($sql, [$query, $query, $limit]);

            return [
                'rows' => $rows,
                'query' => [
                    'sql' => $sql,
                    'params' => [$query, $query, $limit],
                ],
            ];
        }

        $pattern = '%'.$this->escapeLike($query).'%';
        $sql = "select doc_id, document_text, document_type, source_table, source_id
            from ai_documents
            where document_text LIKE ? escape '\\\\'
            order by updated_at desc
            limit ?";

        $rows = DB::select($sql, [$pattern, $limit]);

        return [
            'rows' => $rows,
            'query' => [
                'sql' => $sql,
                'params' => [$pattern, $limit],
            ],
        ];
    }

    public function recentWithAudit(int $limit = 6): array
    {
        if (! $this->canQueryDocuments()) {
            return [
                'rows' => [],
                'query' => null,
            ];
        }

        $sql = "select doc_id, document_text, document_type, source_table, source_id
            from ai_documents
            order by updated_at desc
            limit ?";

        $rows = DB::select($sql, [$limit]);

        return [
            'rows' => $rows,
            'query' => [
                'sql' => $sql,
                'params' => [$limit],
            ],
        ];
    }

    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    private function canQueryDocuments(): bool
    {
        if ($this->documentsAvailable !== null) {
            return $this->documentsAvailable;
        }

        if (DB::getDriverName() !== 'pgsql') {
            return $this->documentsAvailable = false;
        }

        $row = DB::selectOne("select to_regclass('public.ai_documents') as name");
        $this->documentsAvailable = (bool) ($row?->name ?? null);

        return $this->documentsAvailable;
    }

    private function canUseDocumentSearch(): bool
    {
        if ($this->documentSearchAvailable !== null) {
            return $this->documentSearchAvailable;
        }

        if (DB::getDriverName() !== 'pgsql') {
            return $this->documentSearchAvailable = false;
        }

        $row = DB::selectOne(
            "select 1
            from information_schema.columns
            where table_schema = 'public'
              and table_name = 'ai_documents'
              and column_name = 'document_search'
            limit 1"
        );

        $this->documentSearchAvailable = (bool) $row;

        return $this->documentSearchAvailable;
    }
}
