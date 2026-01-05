<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TimetableResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $classe = $this->whenLoaded('classe');
        $matiere = $this->whenLoaded('matiere');
        $teacher = $this->whenLoaded('teacher');
        $classroom = $this->whenLoaded('classroom');

        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'school_year_id' => $this->academic_year_id,
            'class_id' => $this->class_id,
            'subject_id' => $this->matiere_id,
            'teacher_id' => $this->teacher_id,
            'classroom_id' => $this->classroom_id,
            'day_of_week' => $this->day_of_week,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'classes' => $classe ? [
                'id' => $classe->id,
                'name' => $classe->name,
            ] : null,
            'subjects' => $matiere ? [
                'id' => $matiere->id,
                'name' => $matiere->name,
                'code' => $matiere->code,
            ] : null,
            'teachers' => $teacher ? [
                'id' => $teacher->id,
                'profiles' => [
                    'full_name' => $teacher->user?->full_name
                        ?? trim(($teacher->first_name ?? '').' '.($teacher->last_name ?? '')),
                ],
            ] : null,
            'classrooms' => $classroom ? [
                'id' => $classroom->id,
                'name' => $classroom->name,
            ] : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
