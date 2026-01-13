<?php

namespace App\Services;

use App\Exceptions\AiRagSecurityException;
use App\Models\User;
use App\Services\GlobalAuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AiRagService
{
    public function __construct(
        private AiAgentService $agentService,
        private AiTenantResolver $tenantResolver,
        private AiRagRepository $repository,
        private AiPromptComposer $promptComposer,
        private AiRagAuditLogger $auditLogger,
        private AiRagSecurityService $securityService,
    ) {
    }

    private bool $explainMode = false;

    public function enableExplainMode(User $user): void
    {
        if (! $this->isSuperUser($user)) {
            throw new AiRagSecurityException('explain_not_allowed', 'Explain mode is restricted to Super Users.');
        }

        $this->explainMode = true;
    }

    public function respond(User $user, string $content, ?string $requestedRole): string
    {
        $explainMode = $this->consumeExplainMode();
        $correlationId = (string) Str::uuid();
        $profile = $this->agentService->resolveProfile($user, $requestedRole);
        if (! $profile) {
            $this->auditLogger->log([
                'school_id' => $this->tenantResolver->resolveSchoolId($user),
                'user_id' => $user->id,
                'role' => null,
                'agent_key' => null,
                'status' => 'no_agent',
                'correlation_id' => $correlationId,
            ]);
            $this->logGlobalAudit($user, null, 'no_agent', $correlationId, [
                'agent_key' => null,
            ]);
            return "Assistant local: aucun agent configure pour votre role.";
        }

        $trimmed = trim($content);
        if ($trimmed === '') {
            return $this->agentService->buildReply($profile, '');
        }

        $schoolId = $this->tenantResolver->resolveSchoolId($user);
        if (! $schoolId) {
            $flag = $this->securityService->recordDenied($user->id);
            $this->auditLogger->log([
                'school_id' => null,
                'user_id' => $user->id,
                'role' => $profile['key'] ?? null,
                'agent_key' => $profile['key'] ?? null,
                'status' => 'no_access',
                'correlation_id' => $correlationId,
                'flagged' => $flag['flagged'],
                'flag_reason' => $flag['reason'],
            ]);
            $this->logGlobalAudit($user, null, 'no_access', $correlationId, [
                'agent_key' => $profile['key'] ?? null,
                'flagged' => $flag['flagged'],
                'flag_reason' => $flag['reason'],
            ]);
            return $this->noAccessMessage($profile);
        }

        $rate = $this->securityService->checkRateLimit($profile['key'] ?? 'unknown', $user->id);
        if (! $rate['allowed']) {
            $this->auditLogger->log([
                'school_id' => $schoolId,
                'user_id' => $user->id,
                'role' => $profile['key'] ?? null,
                'agent_key' => $profile['key'] ?? null,
                'status' => 'rate_limited',
                'correlation_id' => $correlationId,
                'flagged' => true,
                'flag_reason' => 'rate_limit_exceeded',
            ]);
            $this->logGlobalAudit($user, $schoolId, 'rate_limited', $correlationId, [
                'agent_key' => $profile['key'] ?? null,
                'flagged' => true,
                'flag_reason' => 'rate_limit_exceeded',
            ]);
            return "Assistant local: limite d'utilisation atteinte. Reessayez plus tard.";
        }

        $ragRole = $profile['key'];
        $documents = $this->runWithContext($user->id, $schoolId, $ragRole, function () use ($trimmed) {
            $hits = $this->repository->searchWithAudit($trimmed, 6);
            if (empty($hits['rows'])) {
                $recent = $this->repository->recentWithAudit(4);
                return $recent['rows'] ?? [];
            }
            return $hits['rows'] ?? [];
        });

        if (! $documents) {
            $flag = $this->securityService->recordDenied($user->id);
            $this->auditLogger->log([
                'school_id' => $schoolId,
                'user_id' => $user->id,
                'role' => $profile['key'] ?? null,
                'agent_key' => $profile['key'] ?? null,
                'status' => 'no_data',
                'correlation_id' => $correlationId,
                'documents_count' => 0,
                'flagged' => $flag['flagged'],
                'flag_reason' => $flag['reason'],
            ]);
            $this->logGlobalAudit($user, $schoolId, 'no_data', $correlationId, [
                'agent_key' => $profile['key'] ?? null,
                'documents_count' => 0,
                'flagged' => $flag['flagged'],
                'flag_reason' => $flag['reason'],
            ]);
            return $this->noAccessMessage($profile);
        }

        try {
            $this->securityService->assertDocumentsAllowed($profile['key'] ?? 'unknown', $documents);
        } catch (AiRagSecurityException $exception) {
            $flag = $this->securityService->recordDenied($user->id);
            $this->auditLogger->log([
                'school_id' => $schoolId,
                'user_id' => $user->id,
                'role' => $profile['key'] ?? null,
                'agent_key' => $profile['key'] ?? null,
                'status' => 'unexpected_document',
                'correlation_id' => $correlationId,
                'documents_count' => 0,
                'flagged' => $flag['flagged'],
                'flag_reason' => $exception->reason(),
            ]);
            $this->logGlobalAudit($user, $schoolId, 'unexpected_document', $correlationId, [
                'agent_key' => $profile['key'] ?? null,
                'documents_count' => 0,
                'flagged' => $flag['flagged'],
                'flag_reason' => $exception->reason(),
            ]);
            return $this->noAccessMessage($profile);
        }

        $this->auditLogger->log([
            'school_id' => $schoolId,
            'user_id' => $user->id,
            'role' => $profile['key'] ?? null,
            'agent_key' => $profile['key'] ?? null,
            'status' => 'ok',
            'correlation_id' => $correlationId,
            'document_ids' => $this->collectDocumentIds($documents),
            'documents_count' => count($documents),
        ]);
        $this->logGlobalAudit($user, $schoolId, 'ok', $correlationId, [
            'agent_key' => $profile['key'] ?? null,
            'documents_count' => count($documents),
        ]);

        $alerts = app(AiAlertService::class)->generate($user, $profile);
        if (! empty($alerts)) {
            $this->promptComposer->setAlerts($alerts);
        }

        $this->promptComposer->enableExplainMode($explainMode);
        return $this->formatResponse($profile, $documents, $trimmed);
    }

    private function runWithContext(int $userId, int $schoolId, string $ragRole, callable $callback): array
    {
        return DB::transaction(function () use ($userId, $schoolId, $ragRole, $callback) {
            if (DB::getDriverName() === 'pgsql') {
                $userId = (int) $userId;
                $schoolId = (int) $schoolId;
                $role = DB::getPdo()->quote($ragRole);

                DB::statement("set local app.user_id = {$userId}");
                DB::statement("set local app.school_id = {$schoolId}");
                DB::statement("set local app.role = {$role}");
                DB::statement("set local app.rag_role = {$role}");
            }

            return $callback();
        });
    }

    private function formatResponse(array $profile, array $documents, string $question): string
    {
        return $this->promptComposer->compose($profile, $documents, $question);
    }

    private function closingLine(string $key): string
    {
        return match ($key) {
            'admin' => 'Indiquez la decision a prendre et je propose des actions prioritaires.',
            'teacher' => 'Dites-moi la classe ou la periode pour affiner les conseils.',
            'student' => 'Si tu veux, je peux t aider a faire un plan de travail simple.',
            'accountant' => 'Dites-moi la periode ou l axe financier a analyser.',
            'parent' => "Indiquez l enfant ou la matiere pour une aide plus precise.",
            default => 'Dites-moi votre objectif.',
        };
    }

    private function noAccessMessage(array $profile): string
    {
        return implode("\n", [
            "Agent actif: {$profile['name']} ({$profile['role']}).",
            "Je n'ai pas acces aux donnees autorisees pour l'instant.",
            "Merci de verifier vos droits ou votre association a l'etablissement.",
        ]);
    }

    private function consumeExplainMode(): bool
    {
        $enabled = $this->explainMode;
        $this->explainMode = false;

        return $enabled;
    }

    private function isSuperUser(User $user): bool
    {
        return in_array('super_admin', $user->getRoleNames()->values()->all(), true);
    }

    private function collectDocumentIds(array $documents): array
    {
        $ids = [];
        foreach ($documents as $doc) {
            $docId = $doc->doc_id ?? null;
            if ($docId) {
                $ids[] = $docId;
                continue;
            }

            $table = $doc->source_table ?? null;
            $sourceId = $doc->source_id ?? null;
            if ($table && $sourceId) {
                $ids[] = "{$table}#{$sourceId}";
            }
        }

        return array_values(array_unique($ids));
    }

    private function logGlobalAudit(User $user, ?int $schoolId, string $status, string $correlationId, array $metadata = []): void
    {
        GlobalAuditLogger::log('ai_rag_call', 'ai_agent', array_merge($metadata, [
            'school_id' => $schoolId,
            'user_id' => $user->id,
            'status' => $status,
            'correlation_id' => $correlationId,
        ]));
    }
}
