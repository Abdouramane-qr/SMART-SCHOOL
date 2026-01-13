<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalaryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $teacher = $this->whenLoaded('teacher');

        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'teacher_id' => $this->teacher_id,
            'amount' => $this->amount,
            'payment_date' => $this->payment_date,
            'month' => $this->month,
            'year' => $this->year,
            'bonus' => $this->bonus,
            'deductions' => $this->deductions,
            'net_amount' => $this->net_amount,
            'notes' => $this->notes,
            'status' => $this->status,
            'approved_at' => $this->approved_at,
            'approved_by' => $this->approved_by,
            'teachers' => $teacher ? [
                'id' => $teacher->id,
                'profiles' => [
                    'full_name' => $teacher->user?->full_name ?? trim(($teacher->first_name ?? '').' '.($teacher->last_name ?? '')),
                ],
            ] : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
