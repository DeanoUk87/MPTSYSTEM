<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\ForgotPasswordController;
use App\Http\Controllers\Api\Drivers\BookingController;
use App\Http\Controllers\Api\Drivers\GeoTrackingController;
use App\Http\Controllers\Api\Drivers\StorageController;
use App\Http\Controllers\Api\Settings\PasswordController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::group(['middleware' => 'auth:api'], function () {
    Route::get('logout', [AuthController::class, 'logout']);
    Route::get('/user', function () {
        return Auth::user()->load('roles');
    });
    Route::patch('settings/password', [PasswordController::class, 'update']);
});

Route::group(['middleware' => 'guest:api'], function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [ForgotPasswordController::class, 'sendForgotPassword']);
    Route::post('resend-password-code', [ForgotPasswordController::class, 'resendVerificationCode']);
    Route::post('verify-password-code', [ForgotPasswordController::class, 'customVerifyCode']);
    Route::post('reset-password', [ForgotPasswordController::class, 'processForgotPassword']);
});

Route::prefix('booking')->middleware('auth:api')->group(function () {
    Route::get('{job_ref}', [BookingController::class, 'show']);
    Route::get('/', [BookingController::class, 'index']);
    Route::post('update', [BookingController::class, 'update']);
    Route::post('update-via', [BookingController::class, 'updateVia']);
    //Route::post('geo/tracking', [GeoTrackingController::class, 'storeGeoTracking']);
    Route::post('geo/tracking', [GeoTrackingController::class, 'storeGeoTracking']);
    Route::post('/{job_ref}/confirm-collection', [BookingController::class, 'confirmCollection']);
});

Route::prefix('storage')->group(function () {
    Route::get('', [StorageController::class, 'index'])->name('api.storage.index');
});
