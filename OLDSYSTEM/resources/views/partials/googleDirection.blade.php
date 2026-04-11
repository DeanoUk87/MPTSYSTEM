<script>
    function initMap() {
        var directionsService = new google.maps.DirectionsService;
        var directionsDisplay = new google.maps.DirectionsRenderer;
        var ctaLayer = new google.maps.KmlLayer('{{asset('ULEZone2.kml')}}');
        var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 6,
            center: {lat: 54.4, lng: -3.6},
            disableDefaultUI: true,
            scrollwheel: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
        });
        directionsDisplay.setMap(map);
        ctaLayer.setMap(map);

        document.getElementById('submit').addEventListener('click', function () {
            calculateAndDisplayRoute(directionsService, directionsDisplay);
            /*Get similar jobs*/
            var customerSimilar = document.getElementById("customer_id").value;
            var addressSimilar1 = document.getElementById("collection_postcode").value;
            var addressSimilar2 = document.getElementById("delivery_postcode").value;
            $.get('{{route('booking.similar')}}?customer='+customerSimilar+'&address1='+addressSimilar1+'&address2='+addressSimilar2, function(data){
                $("#similarJobs").html(data);
                $(".similar").show();
            });
            ctaLayer.setMap(map);
        });

        @if(isset($booking))
        window.addEventListener('load', function () {
            calculateAndDisplayRoute(directionsService, directionsDisplay);
            ctaLayer.setMap(map);
        });
        @endif

    }

    function calculateAndDisplayRoute(directionsService, directionsDisplay) {
        var waypts = [];

        @if(isset($booking) && $booking->delivery_address1)
        @if(count($addresses)>0)
        @foreach($addresses as $value)
        waypts.push({
            location: "{{$value->postcode}}, {{$value->address1}} {{$value->address2}} {{$value->area}} {{$value->country}}",
            stopover: true
        });
        @endforeach
        @endif
        @endif

        var address1Fields = document.getElementsByClassName('address1-1');
        var address2Fields = document.getElementsByClassName('address2-1');
        var areaFields = document.getElementsByClassName('area-1');
        var countryFields = document.getElementsByClassName('country-1');
        var postcodeFields = document.getElementsByClassName('postcode-1');

        for (var i = 0; i < address1Fields.length; i++) {
            var viaAddress1 = address1Fields[i] ? address1Fields[i].value.trim() : '';
            var viaAddress2 = address2Fields[i] ? address2Fields[i].value.trim() : '';
            var viaArea = areaFields[i] ? areaFields[i].value.trim() : '';
            var viaCountry = countryFields[i] ? countryFields[i].value.trim() : '';
            var viaPostcode = postcodeFields[i] ? postcodeFields[i].value.trim() : '';
            var viaLocation = [viaPostcode, viaAddress1, viaAddress2, viaArea, viaCountry].filter(Boolean).join(' ');

            // Ignore weak accidental values (for example country-only autofill)
            var hasViaPoint = viaPostcode.length > 0 || viaAddress1.length > 0 || viaArea.length > 0;
            if (hasViaPoint && viaLocation.length > 0) {
                waypts.push({
                    location: viaLocation,
                    stopover: true
                });
            }
        }

        /* Collection */
        var Caddress1 = document.getElementById('collection_address1') ? document.getElementById('collection_address1').value.trim() : '';
        var Caddress2 = document.getElementById('collection_address2') ? document.getElementById('collection_address2').value.trim() : '';
        var Carea = document.getElementById('collection_area') ? document.getElementById('collection_area').value.trim() : '';
        var Ccountry = document.getElementById('collection_country') ? document.getElementById('collection_country').value.trim() : '';
        var Cpostcode = document.getElementById('collection_postcode') ? document.getElementById('collection_postcode').value.trim() : '';

        /* Delivery */
        var Daddress1 = document.getElementById('delivery_address1') ? document.getElementById('delivery_address1').value.trim() : '';
        var Daddress2 = document.getElementById('delivery_address2') ? document.getElementById('delivery_address2').value.trim() : '';
        var Darea = document.getElementById('delivery_area') ? document.getElementById('delivery_area').value.trim() : '';
        var Dcountry = document.getElementById('delivery_country') ? document.getElementById('delivery_country').value.trim() : '';
        var Dpostcode = document.getElementById('delivery_postcode') ? document.getElementById('delivery_postcode').value.trim() : '';

        var avoidToll = !!(document.getElementById('avoidTolls') && document.getElementById('avoidTolls').checked);

        @if(isset($booking))
        var bookingOrigin = "{{$booking->collection_postcode}} {{$booking->collection_address1}} {{$booking->collection_address2}} {{$booking->collection_area}} {{$booking->collection_country}}";
        var bookingDestination = "{{$booking->delivery_postcode}} {{$booking->delivery_address1}} {{$booking->delivery_address2}} {{$booking->delivery_area}} {{$booking->delivery_country}}";
        @endif

        // Prefer postcode for route matching consistency with external postcode checks.
        // Fall back to full address only when postcode is missing.
        var theOrigin = Cpostcode
            ? [Cpostcode, Ccountry].filter(Boolean).join(' ')
            : [Caddress1, Caddress2, Carea, Ccountry].filter(Boolean).join(' ');
        var theDestination = Dpostcode
            ? [Dpostcode, Dcountry].filter(Boolean).join(' ')
            : [Daddress1, Daddress2, Darea, Dcountry].filter(Boolean).join(' ');

        @if(isset($booking))
        if (!theOrigin) {
            theOrigin = bookingOrigin;
        }
        if (!theDestination) {
            theDestination = bookingDestination;
        }
        @endif

        var summaryPanel = document.getElementById('directions-panel');
        if (!theOrigin || !theDestination) {
            if (summaryPanel) {
                summaryPanel.innerHTML = '<span style="color:#c0392b;">Please fill collection and delivery addresses before calculating mileage.</span>';
            }
            return;
        }

        directionsService.route({
            origin: theOrigin,
            destination: theDestination,
            waypoints: waypts,
            optimizeWaypoints: false,
            travelMode: 'DRIVING',
            region: 'uk',
            avoidTolls: avoidToll,
        }, function(response, status) {
            if (status === 'OK' && response.routes && response.routes.length > 0) {
                directionsDisplay.setDirections(response);
                summaryPanel.innerHTML = '';

                var totalDist = 0;
                var totalTime = 0;
                var myroute = response.routes[0];
                for (var legIndex = 0; legIndex < myroute.legs.length; legIndex++) {
                    totalDist += myroute.legs[legIndex].distance.value;
                    totalTime += myroute.legs[legIndex].duration.value;
                }

                totalDist = Number((totalDist * 0.000621371192).toFixed(2));
                var roundedMiles = Math.round(totalDist);

                var vehicleCostEl = document.getElementById('vehicleCost');
                var vehicleRateEl = document.getElementById('vehicleRate');
                var ratePerMile = vehicleRateEl ? Number(vehicleRateEl.value) : 0;
                if (!ratePerMile && vehicleCostEl && vehicleCostEl.value) {
                    var vehicle = vehicleCostEl.value.split('|');
                    ratePerMile = Number(vehicle[0]) || 0;
                }
                var theTotalCost = (roundedMiles * (ratePerMile / 100)).toFixed(2);

                document.getElementById('totalTime').innerHTML = 'Total time: ' + secondsToString(totalTime);
                document.getElementById('totalTimeVal').value = secondsToString(totalTime);

                @if(isset($booking))
                document.getElementById('miles').value='{{round($booking->miles)}}';
                @if($booking->manual_amount>0)
                document.getElementById('cost').value='{{$booking->manual_amount}}';
                document.getElementById('profit').value='{{$booking->manual_amount}}';
                @else
                document.getElementById('cost').value='{{$booking->cost}}';
                document.getElementById('profit').value='{{$booking->cost-$booking->driver_cost-$booking->extra_cost}}';
                @endif
                @endif

                {{--Change mileage and code input--}}
                @if(isset($booking))
                if(document.getElementById('new_mileage').checked && theTotalCost>0){
                    document.getElementById('miles').value = roundedMiles;
                    document.getElementById('cost').value = theTotalCost;
                }
                if(!document.getElementById('new_mileage').checked && theTotalCost>0){
                    document.getElementById('miles').value = '{{round($booking->miles)}}';
                    document.getElementById('cost').value = '{{$booking->cost}}';
                }
                @endif

                @if(!isset($booking))
                document.getElementById('miles').value = roundedMiles;
                document.getElementById('cost').value = theTotalCost;
                @endif

                {{--Avoid tolls--}}
                @if(isset($booking) && $booking->avoid_tolls)
                if(!document.getElementById('avoidTolls').checked && theTotalCost>0){
                    document.getElementById('miles').value = roundedMiles;
                    document.getElementById('cost').value = theTotalCost;
                }
                @endif

                @if(isset($booking) && !$booking->avoid_tolls)
                if(document.getElementById('avoidTolls').checked && theTotalCost>0){
                    document.getElementById('miles').value = roundedMiles;
                    document.getElementById('cost').value = theTotalCost;
                }
                @endif

                /*Driver*/
                var valArray = document.getElementById('driverCost').value.split('|');
                var miles = Number($('#miles').val().trim());
                var costs = Number($('#cost').val().trim());
                var extra = Number($('#extraCost').val().trim());
                var seconManCost = Number($('#seconManCost').val().trim());
                var cxDriverCost = Number($('#cxDriverCost').val().trim());
                var driverPerMiles = Number(valArray[0].trim());
                var driverTotal = Number($('#driverTotal').val().trim()) || 0;
                if(valArray[0]!=='') {
                    // Only auto-calculate if driver has a per-mile rate; otherwise keep manual entry
                    if (driverPerMiles > 0) {
                        driverTotal = (miles * (driverPerMiles/100));
                        $('#driverTotal').val(driverTotal.toFixed(2));
                    } else if ($('#driverTotal').val().trim() === '') {
                        $('#driverTotal').val('0.00');
                    }
                    $('#profit').val((costs+extra-driverTotal-seconManCost-cxDriverCost).toFixed(2));
                    $('#driverId').val(valArray[1]);
                    $('#driverVal').show();
                }else{
                    $('#profit').val((costs+extra-driverTotal-seconManCost-cxDriverCost).toFixed(2));
                    $('#driverVal').hide();
                }
            } else {
                if (summaryPanel) {
                    summaryPanel.innerHTML = '<span style="color:#c0392b;">Unable to calculate route (' + status + '). Please check collection, delivery, and via postcodes.</span>';
                }
            }
        });
    }

    function secondsToString(seconds)
    {
        var numyears = Math.floor(seconds / 31536000);
        var numdays = Math.floor((seconds % 31536000) / 86400);
        var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
        var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
        var numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
        if(numdays) {
            return numdays + " days " + numhours + " hrs " + numminutes + " mins ";
        }else{
            return numhours + " hrs " + numminutes + " min ";
        }
    }
</script>
<script async defer
        src="https://maps.googleapis.com/maps/api/js?key={{config('services.google.api_key')}}&callback=initMap&libraries=places&sensor=false">
</script>
