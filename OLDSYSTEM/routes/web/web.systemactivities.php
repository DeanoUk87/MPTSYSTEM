<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Systemactivities
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your systemactivities . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/systemactivities')->group(function () {
    Route::get('', 'Admin\SystemactivitiesController@index')->name('systemactivities.index');
    Route::get('getdata', 'Admin\SystemactivitiesController@getdata')->name('systemactivities.getdata');
    Route::delete('delete/{id}', 'Admin\SystemactivitiesController@destroy')->name('systemactivities.delete');
    Route::post('delete/multi', 'Admin\SystemactivitiesController@deletemulti')->name('systemactivities.deletemulti');
    Route::get('truncate', 'Admin\SystemactivitiesController@truncateTable')->name('systemactivities.truncate');
});
