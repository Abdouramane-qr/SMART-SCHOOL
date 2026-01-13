<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentAuditResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $changer = $this->whenLoaded('user');

        $action = match ($this->action) {
            'created' => 'INSERT',
            'updated' => 'UPDATE',
            'deleted' => 'DELETE',
            default => $this->action,
        };

        return [
            'id' => $this->id,
            'student_id' => $this->entity_id,
            'action' => $action,
            'old_data' => $this->old_data,
            'new_data' => $this->new_data,
            'notes' => null,
            'changed_at' => $this->created_at,
            'profiles' => $changer ? [
                'full_name' => $changer->full_name ?? $changer->name,
            ] : null,
        ];
    }
}
