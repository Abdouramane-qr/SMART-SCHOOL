<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EleveResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $payments = $this->whenLoaded('paiements');
        $totalPaid = $payments ? $payments->sum(fn ($payment) => (float) ($payment->paid_amount ?? $payment->amount ?? 0)) : 0;
        $totalDue = $payments ? $payments->sum(fn ($payment) => (float) ($payment->amount ?? 0)) : 0;

        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'classe_id' => $this->classe_id,
            'student_id' => $this->student_id,
            'full_name' => $this->full_name,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'gender' => $this->gender,
            'birth_date' => $this->birth_date,
            'address' => $this->address,
            'user_id' => $this->user_id,
            'parent_name' => $this->parent_name,
            'parent_phone' => $this->parent_phone,
            'parent_email' => $this->parent_email,
            'classe' => new ClasseResource($this->whenLoaded('classe')),
            'school' => new SchoolResource($this->whenLoaded('school')),
            'paiements' => PaiementResource::collection($payments),
            'total_paid' => $totalPaid,
            'total_due' => $totalDue,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
