<?php

namespace App\Services\AiAgents;

use App\Enums\AgentEnum;

interface AiAgentInterface
{
    public function key(): AgentEnum;

    public function supports(AgentEnum $role): bool;

    public function profile(): array;
}
