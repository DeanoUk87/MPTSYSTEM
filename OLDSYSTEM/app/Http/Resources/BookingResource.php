<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'job_ref' => $this->job_ref,

            // Basic info
            'user_id' => $this->user_id,
            'customer' => $this->customer,
            'booking_type' => $this->booking_type,
            'job_status' => $this->job_status,

            // Collection
            'collection' => [
                'date' => $this->collection_date,
                'time' => $this->collection_time,
                'name' => $this->collection_name,
                'address1' => $this->collection_address1,
                'address2' => $this->collection_address2,
                'area' => $this->collection_area,
                'country' => $this->collection_country,
                'postcode' => $this->collection_postcode,
                'phone' => $this->collection_phone,
                'contact' => $this->collection_contact,
                'notes' => $this->collection_notes,
            ],

            // Delivery
            'delivery' => [
                'date' => $this->delivery_date,
                'time' => $this->delivery_time,
                'name' => $this->delivery_name,
                'address1' => $this->delivery_address1,
                'address2' => $this->delivery_address2,
                'area' => $this->delivery_area,
                'country' => $this->delivery_country,
                'postcode' => $this->delivery_postcode,
                'phone' => $this->delivery_phone,
                'contact' => $this->delivery_contact,
                'notes' => $this->delivery_notes,
                'lat' => $this->delivery_lat,
                'lng' => $this->delivery_lng,
            ],

            // POD
            'pod' => [
                'signature' => $this->pod_signature,
                'pod_relationship' => $this->pod_relationship,
                'date' => $this->pod_date,
                'time' => $this->pod_time,
                'upload' => $this->pod_upload,
                'mobile' => $this->pod_mobile,
                'verified' => $this->pod_data_verify,
                'driver_note' => $this->driver_note,
            ],

            // Job meta
            'miles' => $this->miles,
            'time_covered' => $this->time_covered,
            'job_notes' => $this->job_notes,
            'delivered_temperature' => $this->delivered_temperature,
            'driver_confirm_collection_at' => $this->driver_confirm_collection_at,

            // Relationships (only when loaded)
            'vias' => $this->whenLoaded('vias', function () {
                return $this->vias->values()->map(function ($via, $index) {
                    $orders = $this->collectedOrdersVia
                        ->where('via', $index + 1)
                        ->values();

                    return array_merge(
                        (new ViaAddressResource($via))->toArray(request()),
                        [
                            'collected_orders' => CollectedOrderResource::collection($orders)
                        ]
                    );
                });
            }),

            'collected_orders' => CollectedOrderResource::collection(
                $this->whenLoaded('collectedOrdersMain')
            ),

            'tracking' => new GeoTrackingResource(
                $this->whenLoaded('tracking')
            ),

            'storages' => StorageResource::collection(
                $this->whenLoaded('storages')
            ),
            'images' => $this->whenLoaded('images', function () {
                return $this->images->map(function ($image) {
                    return [
                        'id' => $image->id,
                        'filename' => $image->filename,
                        'url' => $image->image_url,
                    ];
                });
            }),

            // Timestamps
            'created_at' => optional($this->created_at)->toDateTimeString(),
            'updated_at' => optional($this->updated_at)->toDateTimeString(),
        ];
    }
}
