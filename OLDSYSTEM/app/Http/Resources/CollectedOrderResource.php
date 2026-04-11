<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CollectedOrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'booking_id' => $this->booking_id,
            'type' => $this->type,
            'order_number' => $this->order_number,
            'ambience' => (bool) $this->ambience,
            'chill' => (bool) $this->chill,
            // 'via' => $this->via,
        ];
    }
}
