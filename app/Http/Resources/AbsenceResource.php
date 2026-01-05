<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AbsenceResource extends JsonResource
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
            'school_id' => $this->school_id,
            'eleve_id' => $this->eleve_id,
            'class_id' => $this->classe_id,
            'school_year_id' => $this->academic_year_id,
            'absence_date' => $this->absence_date ?? $this->date,
            'absence_type' => $this->absence_type,
            'justified' => $this->justified ?? $this->is_justified,
            'reason' => $this->reason,
            'duration_minutes' => $this->duration_minutes ?? 0,
            'eleve' => $eleve ? [
                'id' => $eleve->id,
                'student_id' => $eleve->student_id,
                'full_name' => $eleve->full_name ?? trim(($eleve->first_name ?? '').' '.($eleve->last_name ?? '')),
            ] : null,
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
            'updated_at' => $this->updated_at,
        ];
    }
}
