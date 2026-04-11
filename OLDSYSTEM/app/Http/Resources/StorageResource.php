<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StorageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'imei' => $this->imei,
            'unit_number' => $this->unit_number,
            'unit_size' => $this->unit_size,
            'unit_type' => $this->unit_type,
            'current_driver' => $this->current_driver,
            'temperature' => (float) ($this->temperature ?? 0),
        ];
    }
}
