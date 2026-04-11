<?php

namespace App\Models;

use App\Models\System\Upload;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

class Booking extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = true;

    /* database table name */
    protected $table = 'booking';

    /* get primary key name as in DB */
    protected $primaryKey = 'job_ref';

    /* fillable fields */
    protected $fillable = [
        'user_id', 'customer', 'customer_price', 'purchase_order', 'miles', 'cost', 'time_covered', 'collection_date',
        'collection_time', 'collection_name', 'collection_address1', 'collection_address2', 'collection_area', 'collection_country',
        'collection_postcode', 'collection_notes', 'delivery_date', 'delivery_time', 'delivery_name', 'delivery_address1',
        'delivery_address2', 'delivery_area', 'delivery_country', 'delivery_postcode', 'delivery_notes', 'pod_signature', 'pod_time',
        'invoice_number', 'office_notes', 'vehicle', 'driver', 'driver_cost', 'second_man', 'extra_cost', 'created_by', 'updated_by',
        'created_at', 'updated_at', 'booked_by', 'number_of_items', 'weight', 'booking_type', 'collection_phone', 'delivery_phone',
        'pod_upload', 'job_status', 'collection_contact', 'delivery_contact', 'extra_cost2', 'job_description',
        'manual_amount', 'manual_desc', 'extra_cost2_label', 'wait_and_return', 'pod_date', 'dead_mileage_status', 'job_notes',
        'driver_contact', 'chill_unit', 'ambient_unit', 'delivered_temperature', 'driver_note', 'delivery_lat', 'delivery_lng',
        'cxdriver', 'cxdriver_cost', 'pod_data_verify', 'pod_mobile', 'avoid_tolls', 'fuel_surcharge_percent',
        'fuel_surcharge_cost', 'weekend','pod_relationship','driver_confirm_collection_at', 'hide_tracking_temperature', 'hide_tracking_map',
    ];

    protected $casts = [
        'pod_data_verify' => 'boolean',
        'driver_confirm_collection_at' => 'datetime'
    ];

    protected function getPodTimeAttribute($time)
    {
        if ($time) {
            return Carbon::parse($time)->format('H:i');
        }
        return null;
    }

    protected function getFuelSurchargeAttribute($price)
    {
        if ($price) {
            return number_format($price);
        }
        return null;
    }

    public function setPodDateAttribute($date)
    {
        $this->attributes['pod_date'] = Carbon::parse($date)->format('Y-m-d');
    }

    public function vias(): HasMany
    {
        return $this->hasMany(Viaaddress::class, 'job_ref', 'job_ref')
            ->whereNull('deleted_at');
    }

    public function collectedOrdersMain(): HasMany
    {
        return $this->hasMany(CollectedOrders::class, 'booking_id', 'job_ref')
            ->where('type', 'main')
            ->orderBy('id');
    }

    public function collectedOrdersVia(): HasMany
    {
        return $this->hasMany(CollectedOrders::class, 'booking_id', 'job_ref')
            ->where('type', 'via')
            ->orderBy('id');
    }

    public function tracking(): HasOne
    {
        return $this->hasOne(Geotracking::class, 'job_id', 'job_ref');
    }

    public function storages(): HasMany
    {
        return $this->hasMany(Storages::class, 'job_id', 'job_ref');
    }

    public function storageUsage(): HasMany
    {
        return $this->hasMany(Storageusage::class, 'unit_id', 'id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(Upload::class, 'relatedId', 'job_ref')
            ->where('tablekey', 'booking')->orderByDesc('id');
    }
}
