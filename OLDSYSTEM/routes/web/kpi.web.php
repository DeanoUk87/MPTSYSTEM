<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Vehicles
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your vehicles . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/kpi')->group(function () {
    Route::get('', 'Admin\KPIController@index')->name('kpi.index');
});
