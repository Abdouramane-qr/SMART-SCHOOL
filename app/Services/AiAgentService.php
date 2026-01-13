<?php

namespace App\Services;

use App\Enums\AgentEnum;
use App\Services\AiAgents\AccountantAgent;
use App\Services\AiAgents\AdminAgent;
use App\Services\AiAgents\AiAgentInterface;
use App\Services\AiAgents\ParentAgent;
use App\Services\AiAgents\StudentAgent;
use App\Services\AiAgents\TeacherAgent;
use App\Models\User;

class AiAgentService
{
    /**
     * @var array<int, AiAgentInterface>
     */
    private array $agents;

    /**
     * @var array<string, AiAgentInterface>
     */
    private array $agentsByKey = [];

    private array $priority = [
        AgentEnum::ADMIN,
        AgentEnum::ACCOUNTANT,
        AgentEnum::TEACHER,
        AgentEnum::STUDENT,
        AgentEnum::PARENT,
    ];

    /**
     * @param array<int, AiAgentInterface>|null $agents
     */
    public function __construct(?array $agents = null)
    {
        $this->agents = $agents ?? [
            new AdminAgent(),
            new AccountantAgent(),
            new TeacherAgent(),
            new StudentAgent(),
            new ParentAgent(),
        ];

        foreach ($this->agents as $agent) {
            if (! $agent instanceof AiAgentInterface) {
                continue;
            }

            $this->agentsByKey[$agent->key()->value] = $agent;
        }
    }

    public function resolveProfile(?User $user, ?string $requestedRole): ?array
    {
        $available = $this->resolveAvailableAgents($user);

        if ($requestedRole) {
            $requestedAgent = AgentEnum::fromRole($requestedRole);
            if ($requestedAgent && $this->hasAgent($requestedAgent) && in_array($requestedAgent, $available, true)) {
                return $this->agentProfile($requestedAgent);
            }
        }

        foreach ($this->priority as $agentKey) {
            if (in_array($agentKey, $available, true) && $this->hasAgent($agentKey)) {
                return $this->agentProfile($agentKey);
            }
        }

        return null;
    }

    public function buildReply(array $profile, string $content): string
    {
        if ($content === '') {
            return $this->buildWelcome($profile);
        }

        return implode("\n", [
            "Agent actif: {$profile['name']} ({$profile['role']}).",
            "Je ne peux pas acceder aux donnees dans cet environnement, mais je peux expliquer la procedure ou proposer des analyses a partir de donnees autorisees.",
            "Rappelez-vous: " . $this->joinList($profile['access_rules']),
            "Dites-moi votre objectif et je vous propose un plan clair.",
        ]);
    }

    private function buildWelcome(array $profile): string
    {
        return implode("\n", [
            "Agent actif: {$profile['name']} ({$profile['role']}).",
            "Acces: " . $this->joinList($profile['access_rules']),
            "Taches: " . $this->joinList($profile['tasks']),
            "Style: " . $this->joinList($profile['style']),
            "Posez votre question.",
        ]);
    }

    private function resolveAvailableAgents(?User $user): array
    {
        if (! $user) {
            return [];
        }

        $roles = $user->getRoleNames()->values()->all();
        $mapped = [];
        foreach ($roles as $role) {
            $agent = AgentEnum::fromRole($role);
            if ($agent) {
                $mapped[] = $agent;
            }
        }

        return array_values(array_unique($mapped, SORT_REGULAR));
    }

    private function joinList(array $items): string
    {
        return implode(' ', array_map(fn ($item) => "- {$item}", $items));
    }

    private function hasAgent(AgentEnum $key): bool
    {
        return isset($this->agentsByKey[$key->value]);
    }

    private function agentProfile(AgentEnum $key): ?array
    {
        $agent = $this->agentsByKey[$key->value] ?? null;

        return $agent?->profile();
    }
}
