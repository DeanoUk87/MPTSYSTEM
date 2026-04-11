<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ViaAddressResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'via_id' => $this->via_id,
            'job_ref' => $this->job_ref,
            'via_type' => $this->via_type,

            'name' => $this->name,
            'contact' => $this->contact,
            'phone' => $this->phone,

            'address' => [
                'address1' => $this->address1,
                'address2' => $this->address2,
                'area' => $this->area,
                'country' => $this->country,
                'postcode' => $this->postcode,
                'latitude' => $this->latitude,
                'longitude' => $this->longitude,
            ],

            'delivery' => [
                'date' => $this->date,
                'time' => $this->time,
                'via_date' => $this->via_date,
                'via_time' => $this->via_time,
                'pod_signature' => $this->signed_by,
                'pod_relationship' => $this->pod_relationship,
                'delivered_temperature' => $this->delivered_temperature,
                'verified' => $this->via_pod_data_verify,
                'mobile' => $this->via_pod_mobile,
            ],

            'collected_orders' => CollectedOrderResource::collection(
                $this->whenLoaded('collectedOrdersVia')
            ),

            'notes' => $this->notes,

        ];
    }
}
