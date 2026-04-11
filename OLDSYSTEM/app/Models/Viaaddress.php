<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Viaaddress extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = false;

    /* database table name */
    protected $table = 'via_address';

    /* get primary key name as in DB */
    protected $primaryKey = 'via_id';

    /* fillable fields */
    protected $fillable = [
        'user_id', 'job_ref', 'via_type', 'name', 'address1', 'address2', 'area', 'country', 'postcode',
        'notes', 'phone', 'contact', 'signed_by', 'date', 'time', 'via_date', 'via_time', 'deleted_at',
        'delivered_temperature', 'latitude', 'longitude', 'via_pod_data_verify', 'via_pod_mobile','pod_relationship'
    ];

    protected $casts = [
        'via_pod_data_verify' => 'boolean'
    ];

    protected function getTimeAttribute($time)
    {
        if ($time) {
            return Carbon::parse($time)->format('H:i');
        }
        return null;
    }

    public function setDateAttribute($date)
    {
        $this->attributes['date'] = Carbon::parse($date)->format('Y-m-d');
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'job_ref', 'job_ref');
    }

    public function collectedOrdersVia(): HasMany
    {
        return $this->hasMany(CollectedOrders::class, 'booking_id', 'job_ref')
            ->where('type', 'via');
    }
}
