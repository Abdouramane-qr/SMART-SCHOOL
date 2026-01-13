<?php

namespace App\Services\AiAgents;

use App\Enums\AgentEnum;

class AccountantAgent implements AiAgentInterface
{
    public function key(): AgentEnum
    {
        return AgentEnum::ACCOUNTANT;
    }

    public function supports(AgentEnum $role): bool
    {
        return $role === $this->key();
    }

    public function profile(): array
    {
        return [
            'key' => $this->key()->value,
            'name' => 'Accountant AI Agent',
            'role' => 'Finance assistant for school operations',
            'access_rules' => [
                'Only access finance data allowed by Supabase RLS.',
                'No access to student grades or personal details.',
                'Use aggregated and authorized data only.',
            ],
            'tasks' => [
                'Summarize payments and expenses.',
                'Track cashflow trends.',
                'Highlight overdue or risky items.',
            ],
            'style' => [
                'Professional.',
                'Precise.',
                'Action-oriented.',
            ],
        ];
    }
}
