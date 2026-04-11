<?php

namespace App\Http\Controllers\Traits;

use App\Models\Booking;
use App\Models\Geotracking;
use App\Models\Geotrackingdetails;
use App\Models\System\Upload;
use App\Models\Systemactivities;
use App\Models\Viaaddress;
use App\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Laravel\Facades\Image;

trait Uploader
{
    public function imageRules()
    {
        return 'image|mimes:jpeg,bmp,png,gif,jpg|max:5000';
    }

    public function mixedRules()
    {
        return 'mimes:jpeg,bmp,png,pdf,doc,docx,mp4,mkv,mpeg,avi,csv,xls,xlsx,zip,rar,txt|max:5000';
    }

    public function upload($fname, $relatedId)
    {
        $time = Carbon::now(config('timezone'));
        $image = $fname;
        $extension = $image->getClientOriginalExtension();
        $directory = date_format($time, 'Y').'/'.date_format($time, 'm');

        $filename = Str::random(5).date_format($time, 'd').rand(1, 9).date_format($time, 'h').'.'.$extension;

        $upload_success = $image->storeAs($directory, $filename, 'public');

        if ($upload_success) {
            return response()->json($upload_success, 200);
        } else {
            return response()->json('error', 400);
        }
    }

    /**
     * Multiple file or image upload
     */
    public function multipleupload($fname, $relatedId, $table, $type, string $publicDir = 'uploads')
    {
        foreach ($fname as $file) {

            $time = Carbon::now(config('timezone'));
            $extension = $file->getClientOriginalExtension();
            $directory = date_format($time, 'Y') . '/' . date_format($time, 'm');
            $filename = Str::random(5) . date_format($time, 'd') . rand(1, 9) . date_format($time, 'h') . "." . $extension;

            if ($type == 'resize') {
                Storage::disk('public')->makeDirectory($publicDir.'/'.$directory);

                $fullPath = Storage::disk('public')->path($publicDir.'/'.$directory.'/'.$filename);

                Image::read($file)->scale(width: 500, height: 400)->save($fullPath);

                $upload_success = true;
            } else {
                $upload_success = $file->storeAs($publicDir.'/'.$directory, $filename, 'public');
            }

            if ($upload_success) {
                Upload::create([
                    'relatedId' => $relatedId,
                    'filename' => $directory.'/'.$filename,
                    'tablekey' => $table,
                ]);
            }
        }
    }

    /**
     * Upload a single file or image resize
     *
     * @return string
     */
    public function singleupload($fname, $type, string $publicDir = 'uploads')
    {
        $time = Carbon::now(config('timezone'));
        $extension = $fname->getClientOriginalExtension();
        $directory = date_format($time, 'Y').'/'.date_format($time, 'm');
        $filename = Str::random(5).date_format($time, 'd').rand(1, 9).date_format($time, 'h').'.'.$extension;

        if ($type == 'resize') {
            Storage::disk('public')->makeDirectory($publicDir.'/'.$directory);

            $fullPath = Storage::disk('public')->path($publicDir.'/'.$directory.'/'.$filename);
            Image::read($fname)->scale(width: 500, height: 400)->save($fullPath);
        } else {
            $fname->storeAs($publicDir.'/'.$directory, $filename, 'public');
        }

        return $directory.'/'.$filename;
    }

    /**
     * Delete a file if exist
     */
    public function deleteFile(string $publicDir = 'uploads/')
    {
        // FIXED: Added path validation to prevent directory traversal
        $publicDir = str_replace(['..', '\\'], '', $publicDir);
        $path = ltrim($publicDir, '/');

        // Ensure it's within allowed directory
        if (strpos($path, 'uploads/') !== 0 && $path !== 'uploads') {
            Log::warning('Attempted to delete file outside uploads directory', ['path' => $path]);

            return;
        }

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Delete file from file and from the database
     */
    public function deleteFileWith($id, string $publicDir = 'uploads')
    {
        $upload = Upload::findOrFail($id);

        if ($upload->filename) {
            // FIXED: Added path validation
            $publicDir = str_replace(['..', '\\'], '', $publicDir);
            $path = trim($publicDir, '/').'/'.ltrim($upload->filename, '/');

            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }

        $upload->delete();
    }

    /* User Info */
    public function memberId($id = null)
    {
        if ($id) {
            $userid = $id;
        } else {
            $userid = Auth::user()->id;
        }

        return $userid;
    }

    public function createdFor($id = null)
    {
        if ($id) {
            $userid = $id;
        } else {
            $userid = Auth::user()->created_for;
        }

        return $userid;
    }

    public function memberInfo($id = null)
    {
        if ($id) {
            $userid = $id;
        } else {
            $userid = Auth::user()->id;
        }

        return User::where('id', '=', $userid)->first();
    }

    /* General Setting */
    public function adminSettings($id = null)
    {
        if ($id) {
            $userid = $id;
        } else {
            $userid = Auth::user()->id;
        }

        return DB::table('user_settings')->where('user_id', '=', $userid)->limit(1)->get()->first();
    }

    public function dateTime()
    {
        return Carbon::now(config('timezone'))->toDateTimeString();
    }

    public function dateYMD($date)
    {
        return Carbon::parse($date)->format('Y-m-d');
    }

    /* System Log */
    public function addLog($subject, $job = null)
    {
        $log = [];
        $log['subject'] = $subject;
        $log['url'] = Request::fullUrl();
        $log['method'] = Request::method();
        $log['ip'] = Request::ip();
        $log['agent'] = Request::header('user-agent');
        $log['user_id'] = auth()->check() ? auth()->user()->id : 0;
        $log['job_ref'] = $job;
        Systemactivities::create($log);
    }

    public function uniqueId($lenght = 15)
    {
        if (function_exists('random_bytes')) {
            $bytes = random_bytes((int) ceil($lenght / 2));
        } elseif (function_exists('openssl_random_pseudo_bytes')) {
            $bytes = openssl_random_pseudo_bytes((int) ceil($lenght / 2));
        } else {
            throw new \Exception('no cryptographically secure random function available');
        }

        return substr(bin2hex($bytes), 0, $lenght);
    }

    public function randomID($limit = 15)
    {
        $randoms = $this->uniqueId($limit);

        return strtoupper($randoms);
    }

    public function verifyCode($limit = 6)
    {
        $limit = (int) $limit;
        if ($limit <= 0) {
            $limit = 6;
        }

        $max = (10 ** $limit) - 1;
        $num = random_int(0, $max);

        return str_pad((string) $num, $limit, '0', STR_PAD_LEFT);
    }

    /**
     * Added error handling and improved geocoding
     */
    private function geocodeAddress($address)
    {
        try {
            $response = Http::timeout(10)->get('https://maps.googleapis.com/maps/api/geocode/json', [
                'address' => $address,
                'key' => env('GOOGLE_API_KEY'),
            ]);

            if (! $response->successful()) {
                Log::error('Geocoding API request failed', [
                    'status' => $response->status(),
                    'address' => $address,
                ]);

                return null;
            }

            // FIXED: Use consistent json() method instead of json_decode
            $data = $response->json();

            if (($data['status'] ?? null) !== 'OK') {
                Log::warning('Geocoding returned non-OK status', [
                    'status' => $data['status'] ?? 'unknown',
                    'address' => $address,
                ]);

                return null;
            }

            return $data;
        } catch (\Exception $e) {
            Log::error('Geocoding exception', [
                'error' => $e->getMessage(),
                'address' => $address,
            ]);

            return null;
        }
    }

    public function createGeocode($jobId)
    {
        if (Booking::where('job_ref', $jobId)->count()) {
            $job = Booking::where('job_ref', $jobId)->first();

            // Collection
            if (! $job->collection_lat && ! $job->collection_lng) {
                $collectionAddress = trim($job->collection_address1.' '.$job->collection_address2.' '.$job->collection_area.' '.$job->collection_country.' '.$job->collection_postcode);

                // FIXED: Use the helper method with error handling
                $geocodeData = $this->geocodeAddress($collectionAddress);

                if ($geocodeData && isset($geocodeData['results'][0]['geometry']['location'])) {
                    $job->collection_lat = $geocodeData['results'][0]['geometry']['location']['lat'] ?? null;
                    $job->collection_lng = $geocodeData['results'][0]['geometry']['location']['lng'] ?? null;
                    $job->save();
                }
            }

            // Delivery
            if (! $job->delivery_lat && ! $job->delivery_lng) {
                $deliveryAddress = trim($job->delivery_address1.' '.$job->delivery_address2.' '.$job->delivery_area.' '.$job->delivery_country.' '.$job->delivery_postcode);

                // FIXED: Use the helper method with error handling
                $geocodeData = $this->geocodeAddress($deliveryAddress);

                if ($geocodeData && isset($geocodeData['results'][0]['geometry']['location'])) {
                    $job->delivery_lat = $geocodeData['results'][0]['geometry']['location']['lat'] ?? null;
                    $job->delivery_lng = $geocodeData['results'][0]['geometry']['location']['lng'] ?? null;
                    $job->save();
                }
            }

            // Via
            if (Viaaddress::where('job_ref', $jobId)->whereNull('deleted_at')->count() > 0) {
                $vias = Viaaddress::where('job_ref', $jobId)->whereNull('deleted_at')->get();
                foreach ($vias as $via) {
                    if (! $via->latitude and ! $via->longitude) {
                        $address = trim($via->address1.' '.$via->address2.' '.$via->area.' '.$via->country.' '.$via->postcode);

                        // FIXED: Use the helper method with error handling
                        $geocodeData = $this->geocodeAddress($address);

                        if ($geocodeData && isset($geocodeData['results'][0]['geometry']['location'])) {
                            $update = Viaaddress::where('via_id', $via->via_id)->first();
                            $update->latitude = $geocodeData['results'][0]['geometry']['location']['lat'] ?? null;
                            $update->longitude = $geocodeData['results'][0]['geometry']['location']['lng'] ?? null;
                            $update->save();
                        }
                    }
                }
            }
        }
    }

    public function latLngGeocode($jobId, $location = 'current')
    {
        if (Geotracking::where('job_id', $jobId)->count()) {
            $job = Geotracking::where('job_id', $jobId)->first();

            if ($location == 'current') {
                $address = trim($job->current_lat.','.$job->current_lng);
            } else {
                $address = trim($job->ended_lat.','.$job->ended_lng);
            }

            // FIXED: Use the helper method with error handling
            $geocodeData = $this->geocodeAddress($address);

            if ($geocodeData && isset($geocodeData['results'][0]['formatted_address'])) {
                return $geocodeData['results'][0]['formatted_address'];
            }
        }

        return null;
    }

    /**
     * FIXED: Added input validation and improved error handling
     */
    public function getTrackingDetails($id)
    {
        // FIXED: Validate and sanitize input to prevent SQL injection
        $id = (int) $id;

        if ($id <= 0) {
            Log::warning('Invalid geo_id provided to getTrackingDetails', ['id' => $id]);

            return [];
        }

        $geos = Geotrackingdetails::where('geo_id', $id)->limit(100)->get();
        $newGeos = [];

        foreach ($geos as $geo) {
            $geoId = $geo->id;

            if (Geotrackingdetails::where('id', $geoId)->count()) {
                $job = Geotrackingdetails::where('id', $geoId)->first();

                if (($job->latitude and $job->longitude) and ! $job->address) {
                    $address = trim($job->latitude.','.$job->longitude);

                    // Use the helper method with error handling
                    $geocodeData = $this->geocodeAddress($address);

                    if ($geocodeData && isset($geocodeData['results'][0]['formatted_address'])) {
                        $job->address = $geocodeData['results'][0]['formatted_address'];
                        $job->save();
                    }
                }
            }

            $data['id'] = $job->id;
            $data['address'] = $job->address;
            $data['latitude'] = $job->latitude;
            $data['longitude'] = $job->longitude;
            $newGeos[] = $data;
        }

        return $newGeos;
    }
}
