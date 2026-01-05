<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaiementResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $eleve = $this->whenLoaded('eleve');

        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'eleve_id' => $this->eleve_id,
            'amount' => $this->amount,
            'paid_amount' => $this->paid_amount ?? $this->amount,
            'payment_date' => $this->payment_date,
            'due_date' => $this->due_date,
            'method' => $this->method,
            'payment_type' => $this->payment_type ?? $this->method,
            'status' => $this->status,
            'notes' => $this->notes,
            'receipt_number' => $this->receipt_number,
            'eleve' => $eleve ? [
                'id' => $eleve->id,
                'student_id' => $eleve->student_id,
                'full_name' => $eleve->full_name ?? trim(($eleve->first_name ?? '').' '.($eleve->last_name ?? '')),
            ] : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
