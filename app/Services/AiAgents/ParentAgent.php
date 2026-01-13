<?php

namespace App\Services\AiAgents;

use App\Enums\AgentEnum;

class ParentAgent implements AiAgentInterface
{
    public function key(): AgentEnum
    {
        return AgentEnum::PARENT;
    }

    public function supports(AgentEnum $role): bool
    {
        return $role === $this->key();
    }

    public function profile(): array
    {
        return [
            'key' => $this->key()->value,
            'name' => 'Parent AI Agent',
            'role' => 'Learning assistant for parents',
            'access_rules' => [
                "Access ONLY the authenticated parent's children data.",
                'No access to other students.',
                'Respect Supabase RLS at all times.',
            ],
            'tasks' => [
                "Summarize the child's performance.",
                'Explain grades and attendance.',
                'Suggest support strategies.',
            ],
            'style' => [
                'Clear.',
                'Supportive.',
                'Actionable.',
            ],
        ];
    }
}
