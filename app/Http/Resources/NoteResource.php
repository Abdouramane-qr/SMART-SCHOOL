<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoteResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $eleve = $this->whenLoaded('eleve');
        $matiere = $this->whenLoaded('matiere');
        $classe = $this->whenLoaded('classe');

        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'eleve_id' => $this->eleve_id,
            'matiere_id' => $this->matiere_id,
            'class_id' => $this->class_id,
            'academic_year_id' => $this->academic_year_id,
            'value' => $this->value,
            'term' => $this->term,
            'grade_type' => $this->grade_type,
            'weight' => $this->weight,
            'description' => $this->description,
            'evaluation_date' => $this->evaluation_date,
            'eleve' => $eleve ? [
                'id' => $eleve->id,
                'student_id' => $eleve->student_id,
                'full_name' => $eleve->full_name ?? trim(($eleve->first_name ?? '').' '.($eleve->last_name ?? '')),
            ] : null,
            'matiere' => $matiere ? [
                'id' => $matiere->id,
                'name' => $matiere->name,
                'code' => $matiere->code,
                'coefficient' => $matiere->coefficient,
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
