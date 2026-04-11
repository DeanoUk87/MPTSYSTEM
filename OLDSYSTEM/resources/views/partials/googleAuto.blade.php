<script type="text/javascript">
  var HTSGoogleMaps1 = HTSGoogleMaps1 || {};
  HTSGoogleMaps1.Utilities = (function () {
    var _getUserLocation = function (successCallback, failureCallback) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
          successCallback(position);
        }, function () {
          failureCallback(true);
        });
      } else {
        failureCallback(false);
      }
    };
    return {
      GetUserLocation: _getUserLocation
    }
  })();

  HTSGoogleMaps1.Application = (function () {
    var _geocoder;
    var _init = function () {
      _geocoder = new google.maps.Geocoder;
      HTSGoogleMaps1.Utilities.GetUserLocation(function (position) {
        var latLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        _autofillFromUserLocation(latLng);
        _initAutocompletes(latLng);
      }, function (browserHasGeolocation) {
        _initAutocompletes();
      });
    };

    var _initAutocompletes = function (latLng) {
      $('.places-autocomplete').each(function () {
        var input = this;
        var isPostalCode = $(input).is('[id$=collection_postcode]');
        var autocomplete = new google.maps.places.Autocomplete(input, {
          types: [isPostalCode ? '(regions)' : 'address']
        });
        if (latLng) {
          _setBoundsFromLatLng(autocomplete, latLng);
        }
        autocomplete.addListener('place_changed', function () {
          _placeChanged(autocomplete, input);
        });

        $(input).on('keydown', function (e) {
          if (e.keyCode === 13 && $('.pac-container:visible').length > 0) {
            e.preventDefault();
          }
        });
      });

      /*PLAN B*/
      $('.places-autocomplete2').each(function () {
        var input = this;
        var isPostalCode = $(input).is('[id$=delivery_postcode]');
        var autocomplete2 = new google.maps.places.Autocomplete(input, {
          types: [isPostalCode ? '(regions)' : 'address']
        });
        if (latLng) {
          _setBoundsFromLatLng2(autocomplete2, latLng);
        }

        autocomplete2.addListener('place_changed', function () {
          _placeChanged2(autocomplete2, input);
        });

        $(input2).on('keydown', function (e) {
          // Prevent form submit when selecting from autocomplete2 dropdown with enter key
          if (e.keyCode === 13 && $('.pac-container:visible').length > 0) {
            e.preventDefault();
          }
        });
      });
    }

    var _autofillFromUserLocation = function (latLng) {
      _reverseGeocode(latLng, function (result) {
        $('.address').each(function (i, fieldset) {
          _updateAddress({
            fieldset: fieldset,
            address_components: result.address_components
          });
        });
        $('.address2').each(function (i, fieldset) {
          _updateAddress2({
            fieldset: fieldset,
            address_components: result.address_components
          });
        });
      });
    };

    var _reverseGeocode = function (latLng, successCallback, failureCallback) {
      _geocoder.geocode({ 'location': latLng }, function(results, status) {
        if (status === 'OK') {
          if (results[1]) {
            successCallback(results[1]);
          } else {
            if (failureCallback)
              failureCallback(status);
          }
        } else {
          if (failureCallback)
            failureCallback(status);
        }
      });
    }

    var _setBoundsFromLatLng = function (autocomplete, latLng) {
      var circle = new google.maps.Circle({
        radius: 40233.6, // 25 mi radius
        center: latLng
      });
      autocomplete.setBounds(circle.getBounds());
    }

    var _setBoundsFromLatLng2 = function (autocomplete2, latLng) {
      var circle = new google.maps.Circle({
        radius: 40233.6, // 25 mi radius
        center: latLng
      });
      autocomplete2.setBounds(circle.getBounds());
    }

    var _placeChanged = function (autocomplete, input) {
      var place = autocomplete.getPlace();
      _updateAddress({
        input: input,
        address_components: place.address_components
      });
    }

    var _placeChanged2 = function (autocomplete2, input) {
      var place = autocomplete2.getPlace();
      _updateAddress2({
        input: input,
        address_components: place.address_components
      });
    }

    var _updateAddress = function (args) {
      var $fieldset;
      var isPostalCode = false;
      if (args.input) {
        $fieldset = $(args.input).closest('fieldset');
        isPostalCode = $(args.input).is('[id$=collection_postcode]');
        console.log(isPostalCode);
      } else {
        $fieldset = $(args.fieldset);
      }

      var $street = $fieldset.find('[id$=collection_address1]');
      var $street2 = $fieldset.find('[id$=collection_address2]');
      var $postalCode = $fieldset.find('[id$=collection_postcode]');
      var $city = $fieldset.find('[id$=collection_area]');
      var $country = $fieldset.find('[id$=collection_country]');
      var $state = $fieldset.find('[id$=State]');

      $("#collection_address12").val($street.val());

      if (!isPostalCode) {
        $street.val('');
        $street2.val('');
      }
      $postalCode.val('');
      $city.val('');
      $country.val('');
      $state.val('');

      var streetNumber = '';
      var route = '';

      for (var i = 0; i < args.address_components.length; i++) {
        var component = args.address_components[i];
        var addressType = component.types[0];

        switch (addressType) {
          case 'street_number':
            streetNumber = component.long_name;
            break;
          case 'route':
            route = component.short_name;
            break;
          case 'locality':
            $city.val(component.long_name);
            break;
          case 'administrative_area_level_1':
            $state.val(component.long_name);
            break;
          case 'postal_code':
            $postalCode.val(component.long_name);
            break;
          case 'country':
            $country.val(component.long_name);
            break;
        }
      }

      if (route) {
        $street.val(streetNumber && route
          ? streetNumber + ' ' + route
          : route);
      }
    }

    /*PLAN 8*/
    var _updateAddress2 = function (args) {
      var $fieldset;
      var isPostalCode = false;
      if (args.input) {
        $fieldset = $(args.input).closest('fieldset');
        isPostalCode = $(args.input).is('[id$=delivery_postcode]');
        console.log(isPostalCode);
      } else {
        $fieldset = $(args.fieldset);
      }

      var $street = $fieldset.find('[id$=delivery_address1]');
      var $street2 = $fieldset.find('[id$=delivery_address2]');
      var $postalCode = $fieldset.find('[id$=delivery_postcode]');
      var $city = $fieldset.find('[id$=delivery_area]');
      var $country = $fieldset.find('[id$=delivery_country]');
      var $state = $fieldset.find('[id$=State]');

      $("#delivery_address12").val($street.val());

      if (!isPostalCode) {
        $street.val('');
        $street2.val('');
      }
      $postalCode.val('');
      $city.val('');
      $country.val('');
      $state.val('');

      var streetNumber = '';
      var route = '';

      for (var i = 0; i < args.address_components.length; i++) {
        var component = args.address_components[i];
        var addressType = component.types[0];

        switch (addressType) {
          case 'street_number':
            streetNumber = component.long_name;
            break;
          case 'route':
            route = component.short_name;
            break;
          case 'locality':
            $city.val(component.long_name);
            break;
          case 'administrative_area_level_1':
            $state.val(component.long_name);
            break;
          case 'postal_code':
            $postalCode.val(component.long_name);
            break;
          case 'country':
            $country.val(component.long_name);
            break;
        }
      }

      if (route) {
        $street.val(streetNumber && route
          ? streetNumber + ' ' + route
          : route);
      }
    }

    return {
      Init: _init
    }
  })();
  HTSGoogleMaps1.Application.Init();
</script>


