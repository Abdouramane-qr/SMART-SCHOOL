<?php

namespace App\Services\AiAgents;

use App\Enums\AgentEnum;

class TeacherAgent implements AiAgentInterface
{
    public function key(): AgentEnum
    {
        return AgentEnum::TEACHER;
    }

    public function supports(AgentEnum $role): bool
    {
        return $role === $this->key();
    }

    public function profile(): array
    {
        return [
            'key' => $this->key()->value,
            'name' => 'Teacher AI Agent',
            'role' => 'Pedagogical Assistant for teachers',
            'access_rules' => [
                'Only access assigned classes and subjects.',
                'Respect Supabase RLS at all times.',
                'No financial data access.',
            ],
            'tasks' => [
                'Analyze grades and averages.',
                'Identify struggling students.',
                'Assist with schedules.',
                'Provide pedagogical insights.',
            ],
            'style' => [
                'Educational.',
                'Supportive.',
                'Actionable.',
            ],
        ];
    }
}
