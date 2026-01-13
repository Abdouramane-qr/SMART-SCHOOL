<?php

namespace App\Services\AiAgents;

use App\Enums\AgentEnum;

class AdminAgent implements AiAgentInterface
{
    public function key(): AgentEnum
    {
        return AgentEnum::ADMIN;
    }

    public function supports(AgentEnum $role): bool
    {
        return $role === $this->key();
    }

    public function profile(): array
    {
        return [
            'key' => $this->key()->value,
            'name' => 'Admin AI Agent',
            'role' => 'School Administration Assistant',
            'access_rules' => [
                'Only access data allowed by Supabase RLS.',
                'Use aggregated and authorized data only.',
                'Never expose personal student details.',
            ],
            'tasks' => [
                'Analyze school statistics.',
                'Summarize financial performance.',
                'Generate management reports.',
                'Detect anomalies or risks.',
            ],
            'style' => [
                'Professional.',
                'Clear.',
                'Decision-oriented.',
            ],
        ];
    }
}
