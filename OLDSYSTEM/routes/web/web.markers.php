<?php
/*
|--------------------------------------------------------------------------
| Web Routes - Markers
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your markers . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/markers')->group(function () {
    Route::get('', 'Admin\MarkersController@index')->name('markers.index');
    Route::get('map', 'Admin\MarkersController@showMap')->name('markers.map');
    Route::get('getdata', 'Admin\MarkersController@getdata')->name('markers.getdata');
    Route::get('create', 'Admin\MarkersController@insert')->name('markers.create');
    Route::post('store', 'Admin\MarkersController@store')->name('markers.store');
    Route::get('edit/{id}', 'Admin\MarkersController@edit')->name('markers.edit');
    Route::post('update/{id}', 'Admin\MarkersController@update')->name('markers.update');
    Route::delete('delete/{id}', 'Admin\MarkersController@destroy')->name('markers.delete');
    Route::get('export/{type}', 'Admin\MarkersController@exportFile')->name('markers.export');
    Route::get('import/view', 'Admin\MarkersController@importExportView')->name('markers.import.view');
    Route::post('import/store', 'Admin\MarkersController@importFile')->name('markers.import.store');
    Route::post('delete/multi', 'Admin\MarkersController@deletemulti')->name('markers.deletemulti');

    Route::get('truncate', 'Admin\MarkersController@truncateTable')->name('markers.truncate');
});
