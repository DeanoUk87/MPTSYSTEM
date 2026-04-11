<?php

namespace App\Http\Controllers\Api\Drivers;

use App\Http\Controllers\Controller;
use App\Services\StorageService;

class StorageController extends Controller
{
    public function __construct(protected StorageService $storageService) {}

    public function index()
    {
        try {
            $data = $this->storageService->getSensorData();

            return response([
                'result' => true,
                'messages' => $data['messages'],
                'messageCount' => $data['messageCount'],
                'mergedData' => $data['mergedData'],
                'mergedDataArrayCount' => $data['mergedDataArrayCount'],
            ], 200)
                ->header('Content-Type', 'application/json');
        } catch (\Exception $exception) {
            return response(['result' => false, 'Something went wrong: '.$exception->getMessage()], 500);
        }
    }
}
