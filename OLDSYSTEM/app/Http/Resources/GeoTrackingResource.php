<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GeoTrackingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'driver_id' => $this->driver_id,
            'job_id' => $this->job_id,

            'current_location' => [
                'lat' => $this->current_lat,
                'lng' => $this->current_lng,
                'speed' => $this->speed,
                'status' => $this->status,
                'date' => $this->current_date,
            ],

            'started_location' => [
                'lat' => $this->started_lat,
                'lng' => $this->started_lng,
                'at' => $this->started_at,
            ],

            'ended_location' => [
                'lat' => $this->ended_lat,
                'lng' => $this->ended_lng,
                'at' => $this->ended_at,
            ],

            'created_at' => optional($this->created_at)->toDateTimeString(),
            'updated_at' => optional($this->updated_at)->toDateTimeString(),
        ];
    }
}
