<script type="text/javascript">

    @php
        if(request()->input('weekend')==1 || (isset($booking) and $booking->weekend==1)){
            $weekend=1;
      }elseif(request()->input('weekend')==3 || (isset($booking) and $booking->weekend==2)){
        $weekend=3;
        }else{
            $weekend=2;
        }
    @endphp

    $(window).on('load', function() {
        $('#jobTypeModal').modal('show');
    });

  // Base per-mile rates (pence) for each driver slot – used by applyFuelSurcharge
  var subConRateBase   = 0;

  $('textarea').on('keydown', function(e){
    var that = $(this);
    if (that.scrollTop()) {
      $(this).height(function(i,h){
        return h + 20;
      });
    }
  });
  $('#mileCalculate').on('change',function(){
    var valStr = this.value;
    var valArray = valStr.split("|");
    $(".gatewayName").val(valArray[1]);
    if(valArray[0]==="manual"){
      $("#dvMile").show();
      $("#dvMile2").hide();
    }
    if(valArray[0]==="auto"){
      $("#dvMile2").show();
      $("#dvMile").hide();
    }
  });

  $('.dateNew').daterangepicker({
      singleDatePicker: true,
      timePicker: false,
      showDropdowns: true,
      autoUpdateInput: false,
      locale: {
          format: 'DD-MM-YYYY'
      }
  });

  /*Vehicle Price*/
  $('#vehicleCost').on('change',function(){
    var valStr = this.value;
    var valArray = valStr.split("|");

    $('#driverCost option').prop('selected', function() {
      return this.defaultSelected;
    });
    subConRateBase = 0;

    if(document.getElementById('miles').value.length>0)
      var miles = Number($("#miles").val().trim());
    var totalCost = (miles * (valArray[0] / 100));
    if(document.getElementById('extraCost').value.length>0)
      var extra = Number($("#extraCost").val().trim());
    if(document.getElementById('driverTotal').value.length>0)
      var driverTotal = Number($("#driverTotal").val().trim());
    if(document.getElementById('seconManCost').value.length>0)
      var seconManCost = Number($("#seconManCost").val().trim());
    if(document.getElementById('cxDriverCost').value.length>0)
      var cxDriverCost = Number($("#cxDriverCost").val().trim());
    if(valArray[0]!=='') {
      $("#vehicleRate").val(valArray[0]);
      $("#vehicleRate2").val(valArray[0]);
      $("#vehicle_id").val(valArray[1]);
      $("#driver_id").val(valArray[1]);
      $("#vehicleInfo").val(valArray[2]+' = '+valArray[0]+'/mile');
      if(document.getElementById('miles').value.length>0)
        $("#cost").val(totalCost.toFixed(2));
      $("#costCont").val(totalCost.toFixed(2));
      if(document.getElementById('profit').value!=='NaN' ) {
        $("#profit").val((totalCost + extra - driverTotal - seconManCost - cxDriverCost).toFixed(2));
      }else{
        $("#profit").val(0.00);
      }
      $("#divRate").show();
    }else{
      $("#divRate").hide();
    }
  });


  /*Driver Cost*/
  $('#driverCost').on('change',function(){
    var valStr = this.value;
    var valArray = valStr.split("|");
    var miles = Number($("#miles").val().trim());
    var costs = Number($("#cost").val().trim());
    var extra = Number($("#extraCost").val().trim());
    var seconManCost = Number($("#seconManCost").val().trim());
    var cxDriverCost = Number($("#cxDriverCost").val().trim());
    var driverPerMiles = Number(valArray[0].trim());
    var ppm = Number(($('#fuelSurcharge').val() || '').trim()) || 0;
    var driverTotal = (miles * (driverPerMiles / 100));
    // Only overwrite a manually-entered cost if the driver has a per-mile rate AND miles are known
    if (driverPerMiles > 0 && miles > 0) {
        $("#driverTotal").val(driverTotal.toFixed(2));
    } else {
        // Keep whatever the user typed; read the current field value for profit calc
        driverTotal = Number($("#driverTotal").val().trim()) || 0;
        // Show 0.00 as a default starting point if the field is still blank
        if ($("#driverTotal").val().trim() === '') {
            $("#driverTotal").val('0.00');
        }
    }
    $("#profit").val((costs+extra-driverTotal-seconManCost-cxDriverCost).toFixed(2));
    $("#driverId").val(valArray[1]);
    $("#driverVal").show();
    if(document.getElementById('profit').value.length<0){
      alert('Attention: Profit is Negative.')
    }
    // Clear SubCon contact and unit storage to prevent two unit sections showing
    $( "#driverContact" ).empty().removeAttr('data-drivermain');
    $( "#unitStorage" ).empty().removeAttr('data-subdriver');
    // Only wipe SubCon fields when an actual driver is being chosen (not when we're just clearing)
    if (valArray[1]) {
        $('#driverCost2')[0].value = '';
        $('#driverId2').val('');
        $('#seconManCost').val('0.00');
        subConRateBase = 0;
    }
    if(valArray[1])
    /*Driver Contact*/
    $.get('{{route('booking.driver.contact')}}?driverMain='+valArray[1]+'&jobId=@if(isset($booking)){{$booking->job_ref}}@endif', function(data){
      $( "#driverContact" ).html( data );
      document.getElementById('driverContact').setAttribute('data-drivermain', valArray[1]);
    });
  });

  /*SubCon Cost*/
  $('#driverCost2').on('change',function(){
    var valStr2 = this.value;
    var valArray2 = valStr2.split("|");
    var miles = Number($("#miles").val().trim());
    var costs = Number($("#cost").val().trim());
    var extra = Number($("#extraCost").val().trim());
    var driverTotal2 = Number($("#driverTotal").val().trim());
    var driverPerMiles = Number(valArray2[0].trim());
    var ppm = Number(($('#fuelSurcharge').val() || '').trim()) || 0;
    subConRateBase = driverPerMiles;
    var seconManCost = (miles * ((driverPerMiles + ppm) / 100));
    $("#seconManCost").val(seconManCost.toFixed(2));
    $("#profit").val((costs+extra-driverTotal2-seconManCost).toFixed(2));
    $("#driverId2").val(valArray2[1]);
    if(document.getElementById('profit').value.length<0){
      alert('Attention: Profit is Negative.')
    }
    // Clear Driver contact/unit sections and reset Driver dropdown to prevent conflicts
    $( "#driverContact" ).empty().removeAttr('data-drivermain');
    $( "#unitStorage" ).empty().removeAttr('data-subdriver');
    // Only wipe Driver fields when an actual SubCon is being chosen (not when clearing)
    if (valArray2[1]) {
        $('#driverCost').val('');
        $('#driverId').val('');
        $('#driverTotal').val('0.00');
    }
    if(valArray2[1])
    /* Driver Contact */
    $.get('{{route('booking.driver.contact')}}?driver='+valArray2[1]+'&jobId=@if(isset($booking)){{$booking->job_ref}}@endif', function(data){
      $( "#driverContact" ).html( data );
    });
  });

  /*CX Driver*/
  $('#driverCost3').on('change',function(){
    var valStr3 = this.value;
    var valArray3 = valStr3.split("|");
    var miles = Number($("#miles").val().trim());
    var costs = Number($("#cost").val().trim());
    var extra = Number($("#extraCost").val().trim());
    var driverTotal3 = Number($("#driverTotal").val().trim());
    var driverPerMiles = Number(valArray3[0].trim());
    var ppm = Number(($('#fuelSurcharge').val() || '').trim()) || 0;
    var cxDriverCost = (miles * ((driverPerMiles + ppm) / 100));
    $("#cxDriverCost").val(cxDriverCost.toFixed(2));
    $("#profit").val((costs+extra-driverTotal3-cxDriverCost).toFixed(2));
    $("#driverId3").val(valArray3[1]);
    if(document.getElementById('profit').value.length<0){
      alert('Attention: Profit is Negative.')
    }
  });
  //////

  @if(isset($booking) && ($booking->driver || $booking->second_man))
  $.get('{{route('booking.driver.contact')}}?driver={{$booking->driver ?: $booking->second_man}}&jobId=@if($booking){{$booking->job_ref}}@endif', function(data){
    $( "#driverContact" ).html( data );
    @if($booking->driver)
    var driverContactEl = document.getElementById('driverContact');
    if (driverContactEl) {
      driverContactEl.setAttribute('data-drivermain', '{{$booking->driver}}');
    }
    @endif
  });
  $.get('{{route('booking.driver.info')}}?driver={{$booking->driver_contact}}', function(data){
    $( "#driverContactInfo" ).html( data );
  });
  @endif


  @if(isset($booking) && $booking->driver_contact)
  $.get('{{route('booking.driver.contact')}}?subDriver={{$booking->driver_contact}}&jobId=@if($booking){{$booking->job_ref}}@endif', function(data){
    $( "#unitStorage" ).html( data );
    var unitStorageEl = document.getElementById('unitStorage');
    if (unitStorageEl) {
      unitStorageEl.setAttribute('data-subdriver', '{{$booking->driver_contact}}');
    }
  });
  @endif

  {{--@if(isset($booking) && $booking->driver && $booking->driver_contact!='')
  $.get('{{route('booking.driver.contact')}}?driverMain={{$booking->driver}}&jobId=@if($booking){{$booking->job_ref}}@endif', function(data){
    $( "#unitStorage" ).html(data);
  });
  @endif--}}

  function driverInfoSel() {
    var thDriver = document.getElementById("driverInfo").value;
    $.get('{{route('booking.driver.info')}}?driver='+thDriver, function(data){
      $( "#driverContactInfo" ).html( data );
    });
    $.get('{{route('booking.driver.contact')}}?subDriver='+thDriver+'&jobId=@if(isset($booking)){{$booking->job_ref}}@endif', function(data){
      $( "#unitStorage" ).html( data );
      // Store the active contact ID so the transfer modal can refresh correctly
      var unitStorageEl = document.getElementById('unitStorage');
      if (unitStorageEl) {
        unitStorageEl.setAttribute('data-subdriver', thDriver);
      }
    });
  }

  /*Onkey Down*/
  $('#cost').on('keyup input', function () {
  });

  $('#manual').on('keyup input', function () {
    var manual = Number($(this).val().trim());
    $("#cost").val(manual.toFixed(2));
    $("#costCont").val(manual.toFixed(2));
    $("#profit").val('');
  });

  $('#driverTotal').on('keyup input', function () {
    var costs = Number($("#cost").val().trim());
    var extra = Number($("#extraCost").val().trim());
    var seconManCost = Number($("#seconManCost").val().trim());
    var cxDriverCost = Number($("#cxDriverCost").val().trim());
    var newVal = Number($(this).val().trim());
    var total = (costs+extra-newVal-seconManCost-cxDriverCost);
    $("#profit").val(total.toFixed(2));
  });

  $('#seconManCost').on('keyup input', function () {
    var driverTotal = Number($("#driverTotal").val().trim());
    var costs = Number($("#cost").val().trim());
    var extra = Number($("#extraCost").val().trim());
    var newVal = Number($(this).val().trim());
    var cxDriverCost = Number($("#cxDriverCost").val().trim());
    var total = (costs+extra-driverTotal-newVal-cxDriverCost);
    $("#profit").val(total.toFixed(2));
  });

  $('#cxDriverCost').on('keyup input', function () {
    var driverTotal = Number($("#driverTotal").val().trim());
    var costs = Number($("#cost").val().trim());
    var extra = Number($("#extraCost").val().trim());
    var newVal = Number($(this).val().trim());
    var seconManCost = Number($("#seconManCost").val().trim());
    var total = (costs+extra-driverTotal-newVal-seconManCost);
    $("#profit").val(total.toFixed(2));
  });

  $('#extraCost').on('keyup input', function () {
    var driverTotal = Number($("#driverTotal").val().trim());
    var costs = Number($("#cost").val().trim());
    var newVal = Number($(this).val().trim());
    var seconManCost = Number($("#seconManCost").val().trim());
    var cxDriverCost = Number($("#cxDriverCost").val().trim());
    var total = (costs+newVal-driverTotal-seconManCost-cxDriverCost);
    $("#profit").val(total.toFixed(2));
  });


  $('.mileCost').on('keyup input', function () {
    var miles = Number($("#miles").val().trim());
    var perMiles = Number($("#vehicleRate").val().trim());
    var total = (miles * (perMiles/100));
    $(".totalCost").val(total.toFixed(2));
    var costs = Number($(this).val().trim());
    var extra = Number($("#extraCost").val().trim());
    var seconManCost = Number($("#seconManCost").val().trim());
    var driverTotal = Number($("#driverTotal").val().trim());
    var cxDriverCost = Number($("#cxDriverCost").val().trim());
    var totalProfit = (costs+extra-driverTotal-seconManCost-cxDriverCost);
    $("#profit").val(totalProfit.toFixed(2));
  });

  /* WAIT AND RETURN */
  $('#waitReturn').change(function() {
    if($(this).is(":checked")){
      var miles = Number($("#miles").val().trim());
      var newMiles = Math.round(miles + (miles/2));
      var perMiles = Number($("#vehicleRate").val().trim());
      var total = (newMiles * (perMiles/100));
      $("#cost").val(total.toFixed(2));
      $(".miles").val(newMiles.toFixed(2));
      var extra = Number($("#extraCost").val().trim());
      var newDriverTotal = (newMiles * (Number($("#driverPerMile").val().trim())/100));
      var seconManCost = Number($("#seconManCost").val().trim());
      var driverTotal = Number($("#driverTotal").val().trim());
      var cxDriverCost = Number($("#cxDriverCost").val().trim());
      if(newDriverTotal>0) {
        var totalProfit = (total+extra-newDriverTotal-seconManCost-cxDriverCost);
        $(".newDriverTotal").val(newDriverTotal.toFixed(2));
      }else{
        var totalProfit = (total+extra-driverTotal-seconManCost-cxDriverCost);
      }
      $("#profit").val(totalProfit.toFixed(2));
    }
    else if($(this).is(":not(:checked)")){
      var miles2 = Number($("#miles").val().trim());
      var newMiles2 = Math.round(miles2 - (miles2/3));
      var perMiles2 = Number($("#vehicleRate").val().trim());
      var total2 = (newMiles2 * (perMiles2/100));
      $("#cost").val(total2.toFixed(2));
      $(".miles").val(newMiles2.toFixed(2));
      var extra2 = Number($("#extraCost").val().trim());
      var newDriverTotal2 = (newMiles2 * (Number($("#driverPerMile").val().trim())/100));
      var seconManCost2 = Number($("#seconManCost").val().trim());
      var driverTotal2 = Number($("#driverTotal").val().trim());
      var cxDriverCost2 = Number($("#cxDriverCost").val().trim());
      if(newDriverTotal2>0) {
        var totalProfit2 = (total2+extra2-newDriverTotal2-seconManCost2)-cxDriverCost2;
        $(".newDriverTotal").val(newDriverTotal2.toFixed(2));
      }else{
        var totalProfit2 = (total2+extra2-driverTotal2-seconManCost2-cxDriverCost2);
      }
      $("#profit").val(totalProfit2.toFixed(2));
    }
  });

  /* DEAD MILEAGE */
  $('#deadMileage').change(function() {
    var driverPerMileEl = document.getElementById('driverPerMile');
    var driverPerMileVal = driverPerMileEl ? Number($(driverPerMileEl).val().trim()) : 0;

    if($(this).is(":checked")){
      var miles = Number($("#miles").val().trim());
      var deadMiles = Number($("#dead_mileage").val().trim());
      var newMiles = Math.round(miles + deadMiles);
      var perMiles = Number($("#vehicleRate").val().trim());
      var total = (newMiles * (perMiles/100));
      $("#cost").val(total.toFixed(2));
      $(".miles").val(newMiles.toFixed(2));
      var extra = Number($("#extraCost").val().trim()) || 0;
      var driverTotal = Number($("#driverTotal").val().trim()) || 0;
      var seconManCost = Number($("#seconManCost").val().trim()) || 0;
      var cxDriverCost = Number($("#cxDriverCost").val().trim()) || 0;
      var newDriverTotal = driverPerMileVal > 0 ? (newMiles * (driverPerMileVal/100)) : 0;
      if(newDriverTotal > 0) {
        $(".newDriverTotal").val(newDriverTotal.toFixed(2));
        driverTotal = newDriverTotal;
      }
      $("#profit").val((total + extra - driverTotal - seconManCost - cxDriverCost).toFixed(2));
    }
    else if($(this).is(":not(:checked)")){
      var miles2 = Number($("#miles").val().trim());
      var deadMiles2 = Number($("#dead_mileage").val().trim());
      var newMiles2 = Math.round(miles2 - deadMiles2);
      var perMiles2 = Number($("#vehicleRate").val().trim());
      var total2 = (newMiles2 * (perMiles2/100));
      $("#cost").val(total2.toFixed(2));
      $(".miles").val(newMiles2.toFixed(2));
      var extra2 = Number($("#extraCost").val().trim()) || 0;
      var driverTotal2 = Number($("#driverTotal").val().trim()) || 0;
      var seconManCost2 = Number($("#seconManCost").val().trim()) || 0;
      var cxDriverCost2 = Number($("#cxDriverCost").val().trim()) || 0;
      var newDriverTotal2 = driverPerMileVal > 0 ? (newMiles2 * (driverPerMileVal/100)) : 0;
      if(newDriverTotal2 > 0) {
        $(".driverTotal").val(newDriverTotal2.toFixed(2));
        driverTotal2 = newDriverTotal2;
      }
      $("#profit").val((total2 + extra2 - driverTotal2 - seconManCost2 - cxDriverCost2).toFixed(2));
    }
  });

  /* FUEL SURCHARGE – fixed pence-per-mile tiers (0 / 6 / 9 / 12) */
  function applyFuelSurcharge() {
      var ppm   = Number($('#fuelSurcharge').val()) || 0;
      var miles = Number(($('#miles').val() || '').trim())  || 0;
      // Base cost stored in costCont; derive from current cost minus existing surcharge if not set
      var base  = Number(($('#costCont').val() || '').trim()) || 0;
      if (base === 0) {
          var existing = Number(($('.fuel_surcharge_cost').val() || '').trim()) || 0;
          base = Math.max(0, (Number(($('#cost').val() || '').trim()) || 0) - existing);
          if (base > 0) $('#costCont').val(base.toFixed(2));
      }
      var surcharge = parseFloat(((miles * ppm) / 100).toFixed(2));
      var newTotal  = parseFloat((base + surcharge).toFixed(2));
      $('.fuel_surcharge_cost').val(surcharge.toFixed(2));
      $('.totalCost').val(newTotal.toFixed(2));
      $('.costAdd').val(newTotal.toFixed(2));
      // Also apply the surcharge ppm on top of each driver's base per-mile rate
      var fscExtra         = Number(($('#extraCost').val() || '').trim()) || 0;
      var newDriverTotal   = Number(($('#driverTotal').val() || '').trim()) || 0;
      var newSeconManCost  = Number(($('#seconManCost').val() || '').trim()) || 0;
      if (subConRateBase > 0 && miles > 0) {
          newSeconManCost = parseFloat(((miles * (subConRateBase + ppm)) / 100).toFixed(2));
          $('#seconManCost').val(newSeconManCost.toFixed(2));
      }
      var newCxDriverCost  = Number(($('#cxDriverCost').val() || '').trim()) || 0;
      // Recalculate profit
      if ($('#profit').length) {
          $('#profit').val((newTotal + fscExtra - newDriverTotal - newSeconManCost - newCxDriverCost).toFixed(2));
      }
  }
  $('#fuelSurcharge').on('change', applyFuelSurcharge);
  // Initialise stored base rates from currently-selected drivers (handles edit page on load)
  (function () {
      var d = ($('#driverCost').val() || '').split('|')[0];
      var s = ($('#driverCost2').val() || '').split('|')[0];
      if (Number(s) > 0) subConRateBase = Number(s);
  })();


  /* JOB TYPE CHANGE (edit page only) – reload vehicle rates with correct per-mile column */
  $('#jobTypeChange').on('change', function () {
      var newWeekend = $(this).val(); // 1 = Weekend, 2 = Normal, 3 = Out Of Hours
      $('#weekendValue').val(newWeekend);
      var custId = $('#custIdForRates').val() || $('#customer_id').val();
      $.get('{{ route("customer.rates") }}?cust=' + custId + '&weekend=' + newWeekend + '&edit=1', function (data) {
          $('#customerRates').html(data);
          vehicleCost(); // re-bind vehicle change handler
          // Auto-reselect the previously chosen vehicle and recalculate
          var currentVehicleId = $('#vehicle_id').val();
          if (currentVehicleId) {
              $('#vehicleCost option').each(function () {
                  var parts = $(this).val().split('|');
                  if (parts[1] && parts[1] === currentVehicleId) {
                      $(this).prop('selected', true);
                      $('#vehicleCost').trigger('change');
                      return false;
                  }
              });
          }
          // Re-apply any fuel surcharge on top of recalculated base
          setTimeout(applyFuelSurcharge, 50);
      });
  });


  $('#collection_name').on('keyup select change click blur', function () {
    var address1 = document.getElementById("delivery_address1").value;
    $('#collection_address').val(address1);

  });

  function vehicleCost(){
    /*Vehicle Price*/
    $('#vehicleCost').on('change',function(){
      var valStr = this.value;
      var valArray = valStr.split("|");
      $('#driverCost option').prop('selected', function() {
        return this.defaultSelected;
      });
      subConRateBase = 0;
      if(document.getElementById('miles').value.length>0)
        var miles = Number($("#miles").val().trim());
      var totalCost = (miles * (valArray[0] / 100));
      if(document.getElementById('extraCost').value.length>0)
        var extra = Number($("#extraCost").val().trim());
      if(document.getElementById('driverTotal').value.length>0)
        var driverTotal = Number($("#driverTotal").val().trim());
      if(document.getElementById('seconManCost').value.length>0)
        var seconManCost = Number($("#seconManCost").val().trim());
      if(document.getElementById('seconManCost').value.length>0)
        var cxDriverCost = Number($("#cxDriverCost").val().trim());
      if(valArray[0]!=='') {
        $("#vehicleRate").val(valArray[0]);
        $("#vehicleRate2").val(valArray[0]);
        $("#vehicle_id").val(valArray[1]);
        $("#driver_id").val(valArray[1]);
        $("#vehicleInfo").val(valArray[2]+' = '+valArray[0]+'/mile');
        if(document.getElementById('miles').value.length>0)
          $("#cost").val(totalCost.toFixed(2));
        $("#costCont").val(totalCost.toFixed(2));
        if(document.getElementById('profit').value!=='NaN' ) {
          $("#profit").val((totalCost + extra - driverTotal - seconManCost-cxDriverCost).toFixed(2));
        }else{
          $("#profit").val(0.00);
        }
        $("#divRate").show();
        applyFuelSurcharge();
      }else{
        $("#divRate").hide();
      }
    });
  }


  /* LOAD CUSTOMERS RATE TO BOOKING PAGE */
  $.get('{{route('customer.rates')}}?cust={{request()->input('cust')}}&weekend={{$weekend}}', function(data){
    $( "#customerRates" ).html( data );
    vehicleCost();
  });

  $('.refreshRates').on('click', function() {
    $.get('{{route('customer.rates')}}?cust={{request()->input('cust')}}&weekend={{$weekend}}', function(data){
      $( "#customerRates" ).html( data );
      vehicleCost();
    });
  });

  @if(request()->input('edit') and $booking)
  /*Get similar jobs*/
  var customerSimilar = document.getElementById("customer_id").value;
  var addressSimilar1 = document.getElementById("collection_postcode").value;
  var addressSimilar2 = document.getElementById("delivery_postcode").value;
  var vehicleSimilar  = document.getElementById("vehicle_id") ? document.getElementById("vehicle_id").value : '';
  $.get('{{route('booking.similar',['jobId'=>$booking->job_ref])}}&customer='+customerSimilar+'&address1='+addressSimilar1+'&address2='+addressSimilar2+'&vehicle='+vehicleSimilar, function(data){
    $( "#similarJobs" ).html( data );
  });
  @endif

  $(document).ready(function () {
    $('#hezecomformRates').on('submit', function (e) {
      e.preventDefault();
      $('#btnStatus').attr('disabled', '');
      $(".hts-flash").html('<div class="loader"></div>Processing...');
      $(this).ajaxSubmit({
        target: '.hts-flash',
        success: afterSuccessRates,
        timeout: 10000
      });
    });
  });


  function afterSuccessRates(data) {
    $(".hts-flash").fadeIn('slow', function(){
      if(data.success===true) {
        $.get('{{route('customer.rates')}}?cust={{request()->input('cust')}}&weekend={{$weekend}}', function(data){
          $( "#customerRates" ).html( data );
          vehicleCost();
        });
        $(".hts-flash").html('<div class="alert alert-success">Changes Saved!</div>');
        $('#customerModalRates').modal('hide');
      }
      if(data.error===true) {
        $(".hts-flash").html('<div class="alert alert-danger">' + data.message + '</div>');
      }
      $('#btnStatus').removeAttr('disabled');
    });
  }

  /*CRAFTYCLICKS*/
  var cc_object = new clickToAddress({
    accessToken: "{{env('CRAFTY_CLICKS_API_KEY')}}",
    onResultSelected: function(c2a, elements, address){
      var address1 = document.getElementById("collection_name").value;
      var address2 = document.getElementById("delivery_name").value;
      $.get('{{route('viaaddress.name')}}?postcode='+address1+'&type=Collection', function(data){
        $('#collectionAutocomplete').val(data);
      });
      $.get('{{route('viaaddress.name')}}?postcode='+address2+'&type=Delivery', function(data){
        $('#deliveryAutocomplete').val(data);
      });
    },
    defaultCountry: 'gbr', // Sets the default country to the UK
    getIpLocation: false, // Sets default country based on IP
  });
  cc_object.attach({
    search: 'collection_search',
    company: 'collection_name',
    town: 'collection_area',
    postcode: 'collection_postcode',
    county: 'collection_state',
    country: 'collection_country',
    line_1: 'collection_address1',
    line_2: 'collection_address2'
  });
  cc_object.attach({
    search:		'delivery_search',
    company:   'delivery_name',
    town:		'delivery_area',
    postcode:	'delivery_postcode',
    county:		'delivery_state',
    country:	'delivery_country',
    line_1:		'delivery_address1',
    line_2:		'delivery_address2'
  });
  /*VIA ADDRESSES*/
  @for($num=1; $num<=6; $num++)
  cc_object.attach({
    search:		'search-{{$num}}',
    company:	'name-{{$num}}[]',
    town:		'area-{{$num}}[]',
    postcode:	'postcode-{{$num}}[]',
    county:		'state-{{$num}}[]',
    country:	'country-{{$num}}[]',
    line_1:		'address1-{{$num}}[]',
    line_2:		'address2-{{$num}}[]'
  });
    @endfor

</script>
