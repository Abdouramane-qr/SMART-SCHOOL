<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherAuditResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $changer = $this->whenLoaded('changer');

        return [
            'id' => $this->id,
            'teacher_id' => $this->teacher_id,
            'action' => $this->action,
            'old_data' => $this->old_data,
            'new_data' => $this->new_data,
            'notes' => $this->notes,
            'changed_at' => $this->changed_at,
            'profiles' => $changer ? [
                'full_name' => $changer->full_name ?? $changer->name,
            ] : null,
        ];
    }
}
