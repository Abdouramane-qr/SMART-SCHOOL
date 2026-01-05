<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'name' => $this->name,
            'description' => $this->description,
            'category' => $this->category,
            'status' => $this->status,
            'acquisition_date' => $this->acquisition_date,
            'acquisition_value' => $this->acquisition_value,
            'current_value' => $this->current_value,
            'location' => $this->location,
            'serial_number' => $this->serial_number,
            'supplier' => $this->supplier,
            'warranty_end_date' => $this->warranty_end_date,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
