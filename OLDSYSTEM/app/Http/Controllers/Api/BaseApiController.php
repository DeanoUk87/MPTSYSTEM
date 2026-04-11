<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Resources\Json\JsonResource;

class BaseApiController extends Controller
{
    public function successResponse($message, $data = null, $code = 200)
    {
        $response = [
            'result' => true,
            'message' => $message,
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $code);
    }

    /**
     * Single resource response
     *
     * @param  class-string<JsonResource>  $resourceClass
     */
    protected function resourceResponse($data, string $resourceClass)
    {
        return response()->json([
            'data' => new $resourceClass($data),
        ]);
    }

    /**
     * Paginated response
     *
     * @param  class-string<JsonResource>  $resourceClass
     */
    protected function paginatedResponse($paginator, string $resourceClass)
    {
        return response()->json([
            'data' => $resourceClass::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * Error response helper
     */
    public function errorResponse($message, $code = 400, $errors = null)
    {
        $response = [
            'result' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }
}
