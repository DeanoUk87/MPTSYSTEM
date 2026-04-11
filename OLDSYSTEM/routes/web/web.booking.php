<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Booking
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your booking . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/booking')->group(function () {
    Route::get('{user}', 'Admin\BookingController@index')->name('booking.index');
    Route::get('getdata/{user}/{fromdate}/{todate}/{customer}/{driver}/{archive}/{btype}', 'Admin\BookingController@getdata')->name('booking.search');
    Route::get('details/{id}', 'Admin\BookingController@details')->name('booking.details');
    Route::get('unit-locations/{id}', 'Admin\BookingController@unitLocations')->name('booking.unit.locations');
    Route::post('tracking-visibility/{id}', 'Admin\BookingController@updateTrackingVisibility')->name('booking.tracking.visibility');
    Route::get('create/job', 'Admin\BookingController@insert')->name('booking.create');

    Route::post('get-mile', 'Admin\BookingController@getMile')->name('booking.mile');
    Route::post('store', 'Admin\BookingController@store')->name('booking.store');
    Route::get('edit/{id}', 'Admin\BookingController@edit')->name('booking.edit');
    Route::post('update/{id}', 'Admin\BookingController@update')->name('booking.update');
    Route::delete('delete/{id}', 'Admin\BookingController@destroy')->name('booking.delete');

    Route::get('export/pdf/{id}', 'Admin\BookingController@exportDetailPDF')->name('booking.pdfdetails');
    Route::get('export/pdf/{user}/{fromdate}/{todate}/{customer}/{driver}', 'Admin\BookingController@exportPDF')->name('booking.pdf');
    Route::get('export/preview/{user}/{fromdate}/{todate}/{customer}/{driver}', 'Admin\BookingController@exportPrint')->name('booking.preview');
    Route::get('export/{type}/{user}/{fromdate}/{todate}/{customer}/{driver}', 'Admin\BookingController@exportFile')->name('booking.export');

    Route::get('job/postcode-sum/{user}/{fromdate}/{todate}/{customer}/{driver}', 'Admin\BookingController@exportPostcodeSum')->name('booking.postcode.sum');
    Route::get('job/postcode/{user}/{fromdate}/{todate}/{customer}/{driver}', 'Admin\BookingController@exportPostcode')->name('booking.postcode');

    Route::get('import/view', 'Admin\BookingController@importExportView')->name('booking.import.view');
    Route::post('import/store', 'Admin\BookingController@importFile')->name('booking.import.store');
    Route::delete('deletefile/{id}', 'Admin\BookingController@destroyFile')->name('booking.deletefile');
    Route::delete('deletefile2/{id}', 'Admin\BookingController@destroyFile2')->name('booking.deletefile2');
    Route::post('delete/multi', 'Admin\BookingController@deletemulti')->name('booking.deletemulti');

    Route::post('mail-job', 'Admin\BookingController@sendJobToMail')->name('booking.mail');
    Route::get('job-status/{id}/{status}', 'Admin\BookingController@JobStatus')->name('booking.jobstatus');
    Route::get('multijob-status', 'Admin\BookingController@MultiJobStatus')->name('booking.multi.jobstatus');

    Route::post('collection-auto', 'Admin\BookingController@collectionAuto')->name('booking.collection.auto');
    Route::post('delivery-auto', 'Admin\BookingController@deliveryAuto')->name('booking.delivery.auto');

    Route::get('export-driver/pdf/{user}/{fromdate}/{todate}/{customer}/{driver}', 'Admin\BookingController@exportDriver')->name('booking.pdf.driver');
    Route::get('invoice/{user}', 'Admin\BookingController@InvoiceGen')->name('booking.invoice');

    Route::get('similar/jobs', 'Admin\BookingController@similarJobs')->name('booking.similar');
    Route::get('customer/rates', 'Admin\BookingController@customerRates')->name('customer.rates');

    Route::post('custom-search', 'Admin\BookingController@customSearch')->name('booking.custom.search');

    Route::get('booking-pod/{id}', 'Admin\BookingController@PODStatus')->name('booking.pod');
    Route::get('booking-locker/{id}', 'Admin\BookingController@LockJob')->name('booking.locker');
    Route::post('edit/heartbeat/{id}', 'Admin\BookingController@editHeartbeat')->name('booking.edit.heartbeat');
    Route::post('edit/release/{id}', 'Admin\BookingController@editRelease')->name('booking.edit.release');
    Route::get('edit/access-requests/{id}', 'Admin\BookingController@pendingAccessRequest')->name('booking.edit.requests');
    Route::post('edit/access-requests/{id}/{requestId}', 'Admin\BookingController@respondAccessRequest')->name('booking.edit.requests.respond');
    Route::post('locked/request/{id}', 'Admin\BookingController@lockRequestAccess')->name('booking.locked.request');
    Route::post('locked/force/{id}', 'Admin\BookingController@lockForceAccess')->name('booking.locked.force');
    Route::get('locked/status/{id}', 'Admin\BookingController@lockRequestStatus')->name('booking.locked.status');

    /* Driver contact */
    Route::get('driver/contact', 'Admin\BookingController@driverContact')->name('booking.driver.contact');
    Route::get('driver/contact/info', 'Admin\BookingController@driverContactInfo')->name('booking.driver.info');

    /* Units modal */
    Route::get('units/all', 'Admin\BookingController@allUnits')->name('booking.units.all');
    Route::get('units/contacts', 'Admin\BookingController@allDriverContacts')->name('booking.units.contacts');
    Route::post('units/transfer', 'Admin\BookingController@transferUnits')->name('booking.units.transfer');
    Route::get('units/storage-card', 'Admin\BookingController@storageUnitCard')->name('booking.units.storageCard');

    // download POD
    Route::get('download/pod', 'Admin\BookingController@downloadFile')->name('booking.download.pod');

    // Collected Orders
    Route::get('collected-order/delete/{id}', 'Admin\BookingController@deleteCollectedOrder')->name('collected.order.delete');
    Route::post('collected-order/store', 'Admin\CollectedOrdersController@store')->name('collected.order.store');

    // Edit pod
    Route::get('edit/pod/{id}', 'Admin\BookingController@editPOD')->name('booking.edit.pod');
    Route::post('update/pod/{id}', 'Admin\BookingController@updatePOD')->name('booking.update.pod');

});
