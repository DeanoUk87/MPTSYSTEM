<?php

/*
|--------------------------------------------------------------------------
| Web Routes - FrontEnd
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

/*Route::get('/', function () {
    return view('frontend.index');
});*/
Route::get('/', 'HomeController@index')->name('home');
Route::get('/driver/units', 'HomeController@driverUnits')->name('driver.units');
Route::get('/driver/unit-location/{imei}', 'HomeController@driverUnitLocation')->name('driver.unit.location');
Route::get('/driver/storage-alerts', 'HomeController@driverStorageAlerts')->name('driver.storage.alerts');

// Test email
/*Route::get('/test-mail', function (Illuminate\Http\Request $request) {
    $temperature = 10;
    // Logic to send email
    \Illuminate\Support\Facades\Mail::raw("Temperature Alert: The current temperature is {$temperature}°C.", function ($message) {
        $message->to('hezecom@gmail.com.com')
            ->subject('Temperature Alert');
    });
    return response()->json(['message' => 'Notification sent successfully']);
});*/
