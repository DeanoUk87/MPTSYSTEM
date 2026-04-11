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
Route::prefix('admin/vehicles')->group(function () {
    Route::get('', 'Admin\VehiclesController@index')->name('vehicles.index');
    Route::get('getdata', 'Admin\VehiclesController@getdata')->name('vehicles.getdata');
    Route::get('details/{id}', 'Admin\VehiclesController@details')->name('vehicles.details');
    Route::get('create', 'Admin\VehiclesController@insert')->name('vehicles.create');
    Route::post('store', 'Admin\VehiclesController@store')->name('vehicles.store');
    Route::get('edit/{id}', 'Admin\VehiclesController@edit')->name('vehicles.edit');
    Route::post('update/{id}', 'Admin\VehiclesController@update')->name('vehicles.update');
    Route::delete('delete/{id}', 'Admin\VehiclesController@destroy')->name('vehicles.delete');
    Route::get('export/pdf', 'Admin\VehiclesController@exportPDF')->name('vehicles.pdf');
    Route::get('export/pdf/{id}', 'Admin\VehiclesController@exportDetailPDF')->name('vehicles.pdfdetails');
    Route::get('export/{type}', 'Admin\VehiclesController@exportFile')->name('vehicles.export');
    Route::get('import/view', 'Admin\VehiclesController@importExportView')->name('vehicles.import.view');
    Route::post('import/store', 'Admin\VehiclesController@importFile')->name('vehicles.import.store');
    Route::delete('deletefile/{id}', 'Admin\VehiclesController@destroyFile')->name('vehicles.deletefile');
    Route::delete('deletefile2/{id}', 'Admin\VehiclesController@destroyFile2')->name('vehicles.deletefile2');
    Route::post('delete/multi', 'Admin\VehiclesController@deletemulti')->name('vehicles.deletemulti');

    Route::post('vehicle-auto', 'Admin\VehiclesController@vehiclesAuto')->name('vehicle.auto');
});
