<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Usersettings
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your usersettings . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/usersettings')->group(function () {
    Route::get('', 'Admin\UsersettingsController@index')->name('usersettings.index');
    Route::get('getdata', 'Admin\UsersettingsController@getdata')->name('usersettings.getdata');
    Route::get('details/{id}', 'Admin\UsersettingsController@details')->name('usersettings.details');
    Route::get('create', 'Admin\UsersettingsController@insert')->name('usersettings.create');
    Route::post('store', 'Admin\UsersettingsController@store')->name('usersettings.store');
    Route::get('edit/{id}', 'Admin\UsersettingsController@edit')->name('usersettings.edit');
    Route::post('update/{id}', 'Admin\UsersettingsController@update')->name('usersettings.update');
    Route::delete('delete/{id}', 'Admin\UsersettingsController@destroy')->name('usersettings.delete');
    Route::get('export/pdf', 'Admin\UsersettingsController@exportPDF')->name('usersettings.pdf');
    Route::get('export/pdf/{id}', 'Admin\UsersettingsController@exportDetailPDF')->name('usersettings.pdfdetails');
    Route::get('export/{type}', 'Admin\UsersettingsController@exportFile')->name('usersettings.export');
    Route::get('import/view', 'Admin\UsersettingsController@importExportView')->name('usersettings.import.view');
    Route::post('import/store', 'Admin\UsersettingsController@importFile')->name('usersettings.import.store');
    Route::delete('deletefile/{id}', 'Admin\UsersettingsController@destroyFile')->name('usersettings.deletefile');
    Route::delete('deletefile2/{id}', 'Admin\UsersettingsController@destroyFile2')->name('usersettings.deletefile2');
    Route::post('delete/multi', 'Admin\UsersettingsController@deletemulti')->name('usersettings.deletemulti');
});
