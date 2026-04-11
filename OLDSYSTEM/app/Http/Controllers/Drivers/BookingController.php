<?php

namespace App\Http\Controllers\Api\Drivers;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Controllers\Traits\Uploader;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Drivers;
use App\Models\Driverscontact;
use App\Models\Viaaddress;
use App\Notifications\AppNotification;
use App\Services\StorageService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

class BookingController extends BaseApiController
{
    use Uploader;

    private const MAX_BOOKINGS = 50;

    /**
     * BookingsController constructor.
     */
    public function __construct(protected StorageService $storageService)
    {
        $this->middleware(['auth:api']);
    }

    /**
     * List driver's jobs
     */
    public function index(Request $request)
    {
        $bookings = Booking::query()
            ->with([
                'vias',
                'collectedOrdersMain',
                'collectedOrdersVia',
                'tracking',
                'storages'
            ])
            ->where('locker', 0)
            // ->where(function ($query) {
            //     $query->whereBetween('delivery_date', [now()->startOfDay(), now()->endOfDay()])
            //         ->orWhereBetween('collection_date', [now()->startOfDay(), now()->endOfDay()]);
            // })
            // ->where(function ($where) {
            //     if (Auth::user()->hasRole('dcontact')) {
            //         $where->where('driver_contact', Auth::user()->dcontactId);
            //     } elseif (Auth::user()->hasRole('driver')) {
            //         $where->where('driver', Auth::user()->driverId)
            //             ->orWhere('second_man', Auth::user()->driverId);
            //     }
            // })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 4));

        $bookings->getCollection()->transform(function ($booking) {
            $this->attachStorageTemperature($booking->storages);
            return $booking;
        });

        return $this->paginatedResponse($bookings, BookingResource::class);
    }

    public function show($job_ref)
    {
        $booking = Booking::query()
            ->with([
                'vias.collectedOrdersVia',
                'collectedOrdersMain',
                'tracking',
                'storages'
            ])
            ->where('job_ref', $job_ref)
            ->where('locker', 0)
            ->first();

        if (! $booking) {
            return $this->errorResponse('Job not found', 404);
        }

        // Attach temperature
        $this->attachStorageTemperature($booking->storages);

        return $this->resourceResponse($booking, BookingResource::class);
    }

    private function attachStorageTemperature($storages)
    {
        $storageResponse = $this->storageService->getSensorData();

        // Build lookup: [imei => temperature]
        $temperatureMap = collect($storageResponse['mergedData'] ?? [])
            ->mapWithKeys(fn ($item) => [
                $item['imei'] => $item['temperature'] ?? 0,
            ]);

        return $storages->transform(function ($storage) use ($temperatureMap) {
            $storage->temperature = $temperatureMap[$storage->imei] ?? 0;

            return $storage;
        });
    }

    private function saveUploadedImage($file, $jobId)
    {
        try {
            if (! $file->isValid()) {
                return false;
            }

            if (! in_array($file->extension(), ['jpg', 'jpeg', 'png', 'webp'])) {
                return false;
            }

            if ($file->getSize() > 5 * 1024 * 1024) {
                return false;
            }

            $time = now();
            $subDir = $time->format('Y').'/'.$time->format('m');

            $path = $file->store("uploads/$subDir", 'public');

            DB::table('hts_uploads')->insert([
                'relatedId' => $jobId,
                'filename' => str_replace('uploads/', '', $path),
                'tablekey' => 'booking',
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Image upload failed', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * Driver confirms collection
     */
    public function confirmCollection($job_ref): JsonResponse
    {
        try {

            $booking = Booking::where('job_ref', $job_ref)->firstOrFail();

            // Prevent confirming twice
            if ($booking->driver_confirm_collection_at) {
                return $this->errorResponse('Collection already confirmed.', 409);
            }

            // Optional: ensure the logged-in driver owns this job
            if (Auth::user()->hasRole('driver')) {
                if (
                    $booking->driver != Auth::user()->driverId &&
                    $booking->second_man != Auth::user()->driverId
                ) {
                    return $this->errorResponse('You are not assigned to this job.', 403);
                }
            }

            $booking->driver_confirm_collection_at = Carbon::now();
            $booking->save();

            return $this->successResponse('Collection confirmed successfully.');

        } catch (\Exception $e) {

            Log::error('Confirm collection failed', [
                'job_ref' => $job_ref,
                'error' => $e->getMessage(),
            ]);

            return $this->errorResponse('Failed to confirm collection.', 500);
        }
    }

    /**
     * This method process bookings edit form
     *
     * @return JsonResponse
     */
    public function update(Request $request)
    {
        try {

            $validated = $request->validate([
                'job_ref' => 'required|string',
                'pod_signature' => 'required|string',
                'pod_relationship' => 'nullable|string',
                'type' => 'required|in:collection,delivery',
                'notes' => 'nullable|string|max:1000',
                'delivered_temperature' => 'nullable',
                'image' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
            ]);

            $jobRef = $validated['job_ref'];

            $booking = Booking::where('job_ref', $jobRef)->firstOrFail();


            if($booking->pod_signature){
                return $this->errorResponse('You have already submitted POD information for this stage', 403);
            }

            if($booking->delivered_temperature){
                return $this->errorResponse('You have already submitted temperature for this stage', 403);
            }

            if (isset($validated['delivered_temperature']) && is_array($validated['delivered_temperature'])) {
                $validated['delivered_temperature'] = implode(' | ', $validated['delivered_temperature']);;
            }

            if ($validated['type'] === 'delivery') {

                $booking->pod_mobile = 1;
                $booking->pod_data_verify = 0;
                $booking->driver_note = $validated['notes'] ?? null;
                $booking->pod_signature = $validated['pod_signature'] ?? null;
                $booking->pod_relationship = $validated['pod_relationship'] ?? null;
                $booking->pod_time = Carbon::now()->format('H:i');
                $booking->pod_date = Carbon::now()->format('Y-m-d');
                if(!$booking->delivered_temperature) {
                    $booking->delivered_temperature = $validated['delivered_temperature'] ?? null;
                }

                $booking->save();
            }

            $this->saveUploadedImage($request->file('image'), $jobRef);

            // Send notification
            $this->sendAdminNotification($jobRef);

            return $this->successResponse('Stage updated');

        } catch (ValidationException $e) {

            return $this->errorResponse('Validation error', 422, $e->errors());

        }
    }

    /**
     * This method process via bookings edit form
     *
     * @return JsonResponse
     */
    public function updateVia(Request $request)
    {
        try {
            $validated = $request->validate([
                'job_ref' => 'required|string',
                'via_id' => 'required|integer',
                'notes' => 'nullable|string|max:1000',
                'pod_signature' => 'required|string',
                'pod_relationship' => 'nullable|string',
                'delivered_temperature' => 'nullable',
                'image' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
            ]);

            $jobRef = $validated['job_ref'];

            $via = Viaaddress::where('via_id', $validated['via_id'])->where('job_ref', $jobRef)->firstOrFail();

            if($via->signed_by){
                return $this->errorResponse('You have already submitted POD information for that stage', 403);
            }

            if($via->delivered_temperature){
                return $this->errorResponse('You have already submitted temperature for that stage', 403);
            }

            if (isset($validated['delivered_temperature']) && is_array($validated['delivered_temperature'])) {
                $validated['delivered_temperature'] = implode(' | ', $validated['delivered_temperature']);
            }

            $via->signed_by = $validated['pod_signature'];
            $via->date = Carbon::now()->format('Y-m-d');
            $via->time = Carbon::now()->format('H:i');
            $via->delivered_temperature = $validated['delivered_temperature'] ?? null;
            $via->pod_relationship = $validated['pod_relationship'] ?? null;
            $via->notes = $validated['notes'] ?? null;
            $via->via_pod_data_verify = 0;
            $via->via_pod_mobile = 1;
            $via->save();

            $this->saveUploadedImage($request->file('image'), $jobRef);

            // Send notification
            $this->sendAdminNotification($jobRef);

            return $this->successResponse('Via stage updated');

        } catch (ValidationException $e) {

            return $this->errorResponse('Validation error', 422, $e->errors());

        }
    }

    /**
     * Send POD notification to admin
     *
     * @return void
     */
    public function sendAdminNotification($jobId)
    {
        try {
            if (Booking::where('job_ref', $jobId)->count()) {
                $booking = Booking::where('job_ref', $jobId)->first();

                $driverId = null;
                if ($booking->driver) {
                    $driverId = $booking->driver;
                } elseif ($booking->second_man) {
                    $driverId = $booking->second_man;
                } elseif ($booking->cxdriver) {
                    $driverId = $booking->cxdriver;
                }

                if (! $driverId) {
                    Log::warning('No driver found for booking', ['jobId' => $jobId]);

                    return;
                }

                $contact = $booking->driver_contact;
                $driverInfo = Drivers::where('driver_id', $driverId)->first();

                if ($contact and Driverscontact::where('id', $contact)->count() > 0) {
                    $contactName = Driverscontact::where('id', $contact)->first()->driver_name;
                } else {
                    $contactName = $driverInfo->driver ?? 'Unknown';
                }

                $details = [
                    'subject' => 'MP Transport LTD: POD Waiting for Approval',
                    'from' => config('mail.from.address'),
                    'greeting' => 'Hello Admin ',
                    'body' => 'A POD is currently waiting for your approval. 
                                <br>Kindly follow the link below to approve the POD.<br>
                                <a href="'.route('booking.edit.pod', $booking->job_ref).'">'.route('booking.edit.pod', $booking->job_ref).'</a>',
                    'itemCode' => 'Job Number: <a href="'.route('booking.edit.pod', $booking->job_ref).'">'.$jobId.'</a>',
                    'thanks' => 'Driver Contact: '.$contactName,
                    'actionText' => 'Login to your account',
                    'actionURL' => url('/'),
                ];

                Notification::route('mail', config('mail.from.address'))
                    ->notify(new AppNotification($details));
            }
        } catch (\Exception $e) {
            Log::error('Failed to send admin notification', [
                'jobId' => $jobId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}