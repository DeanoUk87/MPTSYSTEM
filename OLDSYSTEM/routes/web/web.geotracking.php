<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Geotracking
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your geotracking . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/geotracking')->group(function () {
    Route::get('', 'Admin\GeotrackingController@index')->name('geotracking.index');
    Route::get('getdata', 'Admin\GeotrackingController@getdata')->name('geotracking.getdata');
    Route::get('details/{id}', 'Admin\GeotrackingController@details')->name('geotracking.details');
    Route::delete('delete/{id}', 'Admin\GeotrackingController@destroy')->name('geotracking.delete');
    Route::get('export/pdf', 'Admin\GeotrackingController@exportPDF')->name('geotracking.pdf');
    Route::get('export/{type}', 'Admin\GeotrackingController@exportFile')->name('geotracking.export');
});
