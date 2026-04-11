<?php

namespace App\Http\Controllers\Api\Drivers;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Booking;
use App\Models\Geotracking;
use App\Models\Geotrackingdetails;
use App\Models\Viaaddress;
use App\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class GeoTrackingController extends BaseApiController
{
    /**
     * @return JsonResponse
     */
    public function storeGeoTracking(Request $request)
    {
        try {
            $validated = $request->validate([
                'trip' => 'required|string|in:start,update,end',
                'jobId' => 'required|string|max:100',
                'latitude' => 'required_if:trip,update,end|nullable|numeric|between:-90,90',
                'longitude' => 'required_if:trip,update,end|nullable|numeric|between:-180,180',
                'address' => 'nullable|string|max:500',
            ]);

            $tripStatus = $validated['trip'];
            $jobId = $validated['jobId'];
            $userId = Auth::user()->id;
            $driver = User::where('id', $userId)->first();
            $booking = Booking::select($this->dataField())
                ->where('job_ref', $jobId)
                ->first();

            if (! $booking) {
                return $this->errorResponse('Booking not found', 404);
            }

            if ($tripStatus == 'start' || $tripStatus == 'update') {
                if (! Geotracking::where('job_id', $jobId)->count()) {
                    // Start trip
                    $trip = Geotracking::create([
                        'job_id' => $jobId,
                        'user_id' => $userId,
                        'driver_id' => $driver->driverId,
                        'started_lat' => $booking->collection_lat,
                        'started_lng' => $booking->collection_lng,
                        'started_at' => Carbon::now(config('timezone')),
                        'status' => 1,
                    ]);

                    if ($this->checkGeo($trip->id, $booking->collection_lat, $booking->collection_lng) === false) {
                        Geotrackingdetails::create([
                            'geo_id' => $trip->id,
                            'latitude' => $booking->collection_lat,
                            'longitude' => $booking->collection_lng,
                        ]);
                    }

                    return $this->successResponse('Trip started successfully', null);
                } else {
                    // Update trip
                    $query = Geotracking::where('job_id', $jobId)->where('status', 1);

                    if ($query->count()) {
                        $trip = $query->first();
                        $trip->current_lat = $validated['latitude'];
                        $trip->current_lng = $validated['longitude'];
                        $trip->current_date = Carbon::now(config('timezone'));
                        $trip->save();

                        // Track details
                        if ($this->checkGeo($trip->id, $validated['latitude'], $validated['longitude']) === false) {
                            Geotrackingdetails::create([
                                'geo_id' => $trip->id,
                                'latitude' => $validated['latitude'],
                                'longitude' => $validated['longitude'],
                            ]);
                        }

                        return $this->successResponse('Trip updated successfully', null);
                    } else {
                        return $this->errorResponse('No active trip found', 404);
                    }
                }
            } elseif ($tripStatus == 'end') {
                if (! Geotracking::where('job_id', $jobId)->count()) {
                    // Start trip if not exists
                    $trip = Geotracking::create([
                        'job_id' => $jobId,
                        'user_id' => $userId,
                        'driver_id' => $driver->driverId,
                        'started_lat' => $booking->collection_lat,
                        'started_lng' => $booking->collection_lng,
                        'started_at' => Carbon::now(config('timezone')),
                        'status' => 1,
                    ]);

                    if ($this->checkGeo($trip->id, $booking->collection_lat, $booking->collection_lng) === false) {
                        Geotrackingdetails::create([
                            'geo_id' => $trip->id,
                            'latitude' => $booking->collection_lat,
                            'longitude' => $booking->collection_lng,
                        ]);
                    }
                }

                $trip = Geotracking::where('job_id', $jobId)->first();
                $trip->ended_lat = $validated['latitude'];
                $trip->ended_lng = $validated['longitude'];
                $trip->ended_at = Carbon::now(config('timezone'));
                $trip->status = 2;
                $trip->save();

                // Track details
                Geotrackingdetails::create([
                    'geo_id' => $trip->id,
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longitude'],
                    'address' => $validated['address'] ?? null,
                ]);

                $viaQuery = Viaaddress::where('job_ref', $jobId)
                    ->whereNull('deleted_at')
                    ->select($this->viaField());

                if ($viaQuery->count() > 0) {
                    $vias = $viaQuery->get();
                } else {
                    $vias = null;
                }

                $array = json_decode(json_encode($booking), true);

                if ($trip) {
                    if ($trip->status == 2) {
                        $bookingData = Arr::add($array, 'extra', [
                            'vias' => $vias,
                            'tracking' => $trip,
                            'tripStatus' => 2,
                        ]);
                    } else {
                        $bookingData = Arr::add($array, 'extra', [
                            'vias' => $vias,
                            'tracking' => $trip,
                            'tripStatus' => 0,
                        ]);
                    }
                } else {
                    $bookingData = Arr::add($array, 'extra', [
                        'vias' => $vias,
                        'tracking' => $trip,
                        'tripStatus' => 0,
                    ]);
                }

                return $this->successResponse('Trip ended successfully', $bookingData);
            }

            return $this->errorResponse('Invalid trip status', 400);
        } catch (ValidationException $e) {
            return $this->errorResponse('Validation failed', 422, $e->errors());
        } catch (\Exception $e) {
            Log::error('Error in storeGeoTracking', [
                'jobId' => $request->input('jobId'),
                'trip' => $request->input('trip'),
                'error' => $e->getMessage(),
            ]);

            return $this->errorResponse('Failed to process geo tracking', 500);
        }
    }

    /**
     * @return bool
     */
    public function checkGeo($geoId, $lat, $lng)
    {
        // Added validation
        $geoId = (int) $geoId;

        $geo = Geotrackingdetails::where('geo_id', $geoId)
            ->where('latitude', $lat)
            ->where('longitude', $lng)
            ->count();

        return $geo > 0;
    }
}
