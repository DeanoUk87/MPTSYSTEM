<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Storages
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your storages . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/storages')->group(function () {
    Route::get('', 'Admin\StoragesController@index')->name('storages.index');
    Route::get('notification', 'Admin\StoragesController@notification')->name('storages.notification');
    Route::get('getdata', 'Admin\StoragesController@getdata')->name('storages.getdata');
    Route::get('storage-history', 'Admin\StoragesController@storageHistory')->name('storages.history');

    Route::get('details/{id}', 'Admin\StoragesController@details')->name('storages.details');
    Route::get('create', 'Admin\StoragesController@insert')->name('storages.create');
    Route::post('store', 'Admin\StoragesController@store')->name('storages.store');
    Route::get('edit/{id}', 'Admin\StoragesController@edit')->name('storages.edit');
    Route::post('update/{id}', 'Admin\StoragesController@update')->name('storages.update');
    Route::delete('delete/{id}', 'Admin\StoragesController@destroy')->name('storages.delete');
    Route::get('export/pdf', 'Admin\StoragesController@exportPDF')->name('storages.pdf');
    Route::get('export/pdf/{id}', 'Admin\StoragesController@exportDetailPDF')->name('storages.pdfdetails');
    Route::get('export/{type}', 'Admin\StoragesController@exportFile')->name('storages.export');
    Route::get('import/view', 'Admin\StoragesController@importExportView')->name('storages.import.view');
    Route::post('import/store', 'Admin\StoragesController@importFile')->name('storages.import.store');
    Route::delete('deletefile/{id}', 'Admin\StoragesController@destroyFile')->name('storages.deletefile');
    Route::delete('deletefile2/{id}', 'Admin\StoragesController@destroyFile2')->name('storages.deletefile2');
    Route::post('delete/multi', 'Admin\StoragesController@deletemulti')->name('storages.deletemulti');

    Route::get('unit-alerts', 'Admin\StoragesController@unitAlerts')->name('storages.unitAlerts');
    Route::get('availability/status/{id}', 'Admin\StoragesController@availabilityStatus')->name('storages.availabilityStatus');
    Route::get('tracking/update/{id}/{trackable}', 'Admin\StoragesController@updateTrakingStatus')->name('storages.tracking');

    Route::get('drivers-for-transfer', 'Admin\StoragesController@driversForTransfer')->name('storages.driversForTransfer');
    Route::get('units-by-driver', 'Admin\StoragesController@unitsByDriver')->name('storages.unitsByDriver');
    Route::post('transfer/{id}', 'Admin\StoragesController@transferUnit')->name('storages.transfer');
});
