<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnrollmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $eleve = $this->whenLoaded('eleve');
        $classe = $this->whenLoaded('classe');

        return [
            'id' => $this->id,
            'student_id' => $this->eleve_id,
            'class_id' => $this->classe_id,
            'school_year_id' => $this->academic_year_id,
            'enrollment_date' => $this->enrollment_date,
            'students' => $eleve ? [
                'id' => $eleve->id,
                'student_id' => $eleve->student_id,
                'full_name' => $eleve->full_name ?? trim(($eleve->first_name ?? '').' '.($eleve->last_name ?? '')),
            ] : null,
            'classes' => $classe ? [
                'id' => $classe->id,
                'name' => $classe->name,
                'level' => $classe->level,
            ] : null,
            'created_at' => $this->created_at,
        ];
    }
}
