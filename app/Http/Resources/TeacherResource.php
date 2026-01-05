<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $this->whenLoaded('user');

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'specialization' => $this->specialization,
            'hire_date' => $this->hire_date,
            'monthly_salary' => $this->monthly_salary,
            'profiles' => [
                'full_name' => $user?->full_name ?? trim(($this->first_name ?? '').' '.($this->last_name ?? '')),
                'email' => $user?->email ?? $this->email,
                'phone' => $user?->phone ?? $this->phone,
            ],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
