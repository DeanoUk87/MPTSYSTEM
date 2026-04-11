<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Driverscontact
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your driverscontact . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/driverscontact')->group(function () {
    Route::get('', 'Admin\DriverscontactController@index')->name('driverscontact.index');
    Route::get('getdata', 'Admin\DriverscontactController@getdata')->name('driverscontact.getdata');
    Route::get('details/{id}', 'Admin\DriverscontactController@details')->name('driverscontact.details');
    Route::get('create', 'Admin\DriverscontactController@insert')->name('driverscontact.create');
    Route::post('store', 'Admin\DriverscontactController@store')->name('driverscontact.store');
    Route::get('edit/{id}', 'Admin\DriverscontactController@edit')->name('driverscontact.edit');
    Route::post('update/{id}', 'Admin\DriverscontactController@update')->name('driverscontact.update');
    Route::delete('delete/{id}', 'Admin\DriverscontactController@destroy')->name('driverscontact.delete');
    Route::get('export/pdf', 'Admin\DriverscontactController@exportPDF')->name('driverscontact.pdf');
    Route::get('export/pdf/{id}', 'Admin\DriverscontactController@exportDetailPDF')->name('driverscontact.pdfdetails');
    Route::get('export/{type}', 'Admin\DriverscontactController@exportFile')->name('driverscontact.export');
    Route::get('import/view', 'Admin\DriverscontactController@importExportView')->name('driverscontact.import.view');
    Route::post('import/store', 'Admin\DriverscontactController@importFile')->name('driverscontact.import.store');
    Route::delete('deletefile/{id}', 'Admin\DriverscontactController@destroyFile')->name('driverscontact.deletefile');
    Route::delete('deletefile2/{id}', 'Admin\DriverscontactController@destroyFile2')->name('driverscontact.deletefile2');
    Route::post('delete/multi', 'Admin\DriverscontactController@deletemulti')->name('driverscontact.deletemulti');

    // Access
    Route::get('signup/{id}', 'Admin\DriverscontactController@SignUpAccess')->name('driverscontact.signup');
    Route::post('store/signup', 'Admin\DriverscontactController@SignUpAccessPro')->name('driverscontact.signup.store');

    // update visibility
    Route::get('update-status/{id}/{status}', 'Admin\DriverscontactController@changeVisibility')->name('driverscontact.status');
});
