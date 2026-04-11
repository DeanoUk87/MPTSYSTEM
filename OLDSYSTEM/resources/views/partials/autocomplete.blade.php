<script type="text/javascript">
  /*Customers Details*/
  $("#customersAutocomplete1").autocomplete({
    minLength:2,
    source: function (request, response) {
      var csrf_token = $('meta[name="csrf-token"]').attr('content');
      $.ajax({
        url: "{{route('customers.address.auto')}}",//url
        data: { searchText: request.term, '_token': csrf_token},
        dataType: "json",
        type: "POST",
        success: function (data) {
          response($.map(data, function (item) {
            return {
              label: item.value,
              customer: item.value,
              id: item.id
            }
          }))
        },
        error: function (xhr, status, err) {
          alert("Error")
        }
      });
    },
    select: function (even, ui) {
      if (document.getElementById('collection_address1') !== null) {
        $.getJSON('{{ route('customers.address.byid', ['id' => '__ID__']) }}'.replace('__ID__', ui.item.id), function (data) {
          $('#collectionAutocomplete').val(data.name);
          $('#collection_address1').val(data.address);
          $('#collection_address2').val(data.address2);
          $('#collection_area').val(data.city);
          $('#collection_postcode').val(data.postcode);
          $('#collection_contact').val(data.contact);
          $('#collection_phone').val(data.phone);
        });
        $('#customer_id').val(ui.item.id);
      } else {
        window.location.href ='{{route('booking.create')}}?cust='+ui.item.id;
      }
    }
  });

  /*Customers Details*/
  $("#customersAutocomplete2").autocomplete({
    minLength:2,
    source: function (request, response) {
      var csrf_token = $('meta[name="csrf-token"]').attr('content');
      $.ajax({
        url: "{{route('customers.address.auto')}}",//url
        data: { searchText: request.term, '_token': csrf_token},
        dataType: "json",
        type: "POST",
        success: function (data) {
          response($.map(data, function (item) {
            return {
              label: item.value,
              customer: item.value,
              id: item.id
            }
          }))
        },
        error: function (xhr, status, err) {
          alert("Error")
        }
      });
    },
    select: function (even, ui) {
      window.location.href ='{{route('booking.index',['user'=>0])}}?fromdate=0&todate=0&customer'+ui.item.id+'&driver=0';
    }
  });

  /*Customers Details*/
  $("#customersAutocomplete").autocomplete({
    minLength:2,
    source: function (request, response) {
      var csrf_token = $('meta[name="csrf-token"]').attr('content');
      $.ajax({
        url: "{{route('customers.address.auto')}}",//url
        data: { searchText: request.term, '_token': csrf_token},
        dataType: "json",
        type: "POST",
        success: function (data) {
          response($.map(data, function (item) {
            return {
              label: item.value,
              customer: item.value,
              id: item.id
            }
          }))
        },
        error: function (xhr, status, err) {
          alert("Error")
        }
      });
    },
    select: function (even, ui) {
      $("#customer_id").val(ui.item.id);
    }
  });

  /*Collection Details*/
  $("#collectionAutocomplete").autocomplete({
    minLength:2,
    source: function (request, response) {
      var csrf_token = $('meta[name="csrf-token"]').attr('content');
      $.ajax({
        url: "{{route('viaaddress.address')}}",//url
        data: { searchText: request.term, '_token': csrf_token},
        dataType: "json",
        type: "POST",
        success: function (data) {
          response($.map(data, function (item) {
            return {
              label: item.value,
              name: item.value,
              address1: item.address1,
              address2: item.address2,
              area: item.area,
              country: item.country,
              postcode: item.postcode,
              contact: item.contact,
              phone: item.phone
            }
          }))
        },
        error: function (xhr, status, err) {
          alert("Error")
        }
      });
    },
    select: function (even, ui) {
      $("#collection_name").val(ui.item.name);
      $("#collection_address1").val(ui.item.address1);
      $("#collection_address2").val(ui.item.address2);
      $("#collection_area").val(ui.item.area);
      $("#collection_country").val(ui.item.country);
      $("#collection_postcode").val(ui.item.postcode);
      $("#collection_contact").val(ui.item.contact);
      $("#collection_phone").val(ui.item.phone);
    }
  });

  /*Delivery Details */
  $("#deliveryAutocomplete").autocomplete({
    minLength:2,
    source: function (request, response) {
      var csrf_token = $('meta[name="csrf-token"]').attr('content');
      $.ajax({
        url: "{{route('viaaddress.address')}}",//url
        data: { searchText: request.term, '_token': csrf_token},
        dataType: "json",
        type: "POST",
        success: function (data) {
          response($.map(data, function (item) {
            return {
              label: item.value,
              name: item.value,
              address1: item.address1,
              address2: item.address2,
              area: item.area,
              country: item.country,
              postcode: item.postcode,
              contact: item.contact,
              phone: item.phone
            }
          }))
        },
        error: function (xhr, status, err) {
          alert("Error")
        }
      });
    },
    select: function (even, ui) {
      $("#delivery_name").val(ui.item.name);
      $("#delivery_address1").val(ui.item.address1);
      $("#delivery_address2").val(ui.item.address2);
      $("#delivery_area").val(ui.item.area);
      $("#delivery_country").val(ui.item.country);
      $("#delivery_postcode").val(ui.item.postcode);
      $("#delivery_contact").val(ui.item.contact);
      $("#delivery_phone").val(ui.item.phone);
    }
  });

  /*Invoice Details*/
  $("#invoiceAutocomplete").autocomplete({
    minLength:2,
    source: function (request, response) {
      var csrf_token = $('meta[name="csrf-token"]').attr('content');
      $.ajax({
        url: "{{route('invoices.auto')}}",//url
        data: { searchText: request.term, '_token': csrf_token},
        dataType: "json",
        type: "POST",
        success: function (data) {
          response($.map(data, function (item) {
            return {
              label: item.number,
              number: item.number,
              title: item.title
            }
          }))
        },
        error: function (xhr, status, err) {
          alert("Error")
        }
      });
    },
    select: function (even, ui) {
      $("#invoice_number").val(ui.item.number);
    }
  });

  /*Drivers Details*/
  $("#driverAutocomplete").autocomplete({
    minLength:2,
    source: function (request, response) {
      var csrf_token = $('meta[name="csrf-token"]').attr('content');
      $.ajax({
        url: "{{route('driver.auto')}}",//url
        data: { searchText: request.term, '_token': csrf_token},
        dataType: "json",
        type: "POST",
        success: function (data) {
          response($.map(data, function (item) {
            return {
              label: item.value,
              driver: item.value,
              id: item.id
            }
          }))
        },
        error: function (xhr, status, err) {
          alert("Error")
        }
      });
    },
    select: function (even, ui) {
      $("#driver_id").val(ui.item.id);
    }
  });

  /*Drivers Details*/
  $("#vehicleAutocomplete").autocomplete({
    minLength:1,
    source: function (request, response) {
      var csrf_token = $('meta[name="csrf-token"]').attr('content');
      $.ajax({
        url: "{{route('vehicle.auto')}}",//url
        data: { searchText: request.term, '_token': csrf_token},
        dataType: "json",
        type: "POST",
        success: function (data) {
          response($.map(data, function (item) {
            return {
              label: item.value,
              vehicle: item.value,
              id: item.id
            }
          }))
        },
        error: function (xhr, status, err) {
          alert("Error")
        }
      });
    },
    select: function (even, ui) {
      $("#vehicle_id").val(ui.item.id);
    }
  });

  /*Drivers Details*/
  $("#secondManAutocomplete").autocomplete({
    minLength:1,
    source: function (request, response) {
      var csrf_token = $('meta[name="csrf-token"]').attr('content');
      $.ajax({
        url: "{{route('driver.auto')}}",//url
        data: { searchText: request.term, '_token': csrf_token},
        dataType: "json",
        type: "POST",
        success: function (data) {
          response($.map(data, function (item) {
            return {
              label: item.value,
              driver: item.value,
              id: item.id
            }
          }))
        },
        error: function (xhr, status, err) {
          alert("Error")
        }
      });
    },
    select: function (even, ui) {
      $("#secondMan_id").val(ui.item.id);
    }
  });
  /*Drivers Details*/
  $("#ratesAutocomplete").autocomplete({
    minLength:1,
    source: function (request, response) {
      var csrf_token = $('meta[name="csrf-token"]').attr('content');
      $.ajax({
        url: "{{route('rates.auto')}}",//url
        data: { searchText: request.term, '_token': csrf_token},
        dataType: "json",
        type: "POST",
        success: function (data) {
          response($.map(data, function (item) {
            return {
              label: item.value,
              rates: item.value,
              id: item.rate_per_mile
            }
          }))
        },
        error: function (xhr, status, err) {
          alert("Error")
        }
      });
    },
    select: function (even, ui) {
      $("#customerRate").val(ui.item.id).show();
      $("#customerRate2").val(ui.item.id);
    }
  });
  /*Drivers Details*/
  $("#userAutocomplete").autocomplete({
    minLength:1,
    source: function (request, response) {
      var csrf_token = $('meta[name="csrf-token"]').attr('content');
      $.ajax({
        url: "{{route('user.auto')}}",//url
        data: { searchText: request.term, '_token': csrf_token},
        dataType: "json",
        type: "POST",
        success: function (data) {
          response($.map(data, function (item) {
            return {
              label: item.value,
              user: item.value,
              id: item.id
            }
          }))
        },
        error: function (xhr, status, err) {
          alert("Error")
        }
      });
    },
    select: function (even, ui) {
      $("#user_id").val(ui.item.id);
    }
  });

  /*Via Details */
  @for($num=1; $num<=3; $num++)
  $("#nameAutocomplete-{{$num}}").autocomplete({
    minLength:2,
    source: function (request, response) {
      var csrf_token = $('meta[name="csrf-token"]').attr('content');
      $.ajax({
        url: "{{route('viaaddress.address')}}",//url
        data: { searchText: request.term, '_token': csrf_token},
        dataType: "json",
        type: "POST",
        success: function (data) {
          response($.map(data, function (item) {
            return {
              label: item.value,
              name: item.value,
              address1: item.address1,
              address2: item.address2,
              area: item.area,
              country: item.country,
              postcode: item.postcode,
              contact: item.contact,
              phone: item.phone
            }
          }))
        },
        error: function (xhr, status, err) {
          alert("Error")
        }
      });
    },
    select: function (even, ui) {
      $("#name-{{$num}}").val(ui.item.name);
      $("#address1-{{$num}}").val(ui.item.address1);
      $("#address2-{{$num}}").val(ui.item.address2);
      $("#area-{{$num}}").val(ui.item.area);
      $("#country-{{$num}}").val(ui.item.country);
      $("#postcode-{{$num}}").val(ui.item.postcode);
      $("#contact-{{$num}}").val(ui.item.contact);
      $("#phone-{{$num}}").val(ui.item.phone);
    }
  });
  @endfor

  {{--Archive--}}
  /*Customers Details*/
  $("#oldCustomersAutocomplete").autocomplete({
    minLength:2,
    source: function (request, response) {
      var csrf_token = $('meta[name="csrf-token"]').attr('content');
      $.ajax({
        url: "{{route('oldCustomers.address.auto')}}",//url
        data: { searchText: request.term, '_token': csrf_token},
        dataType: "json",
        type: "POST",
        success: function (data) {
          response($.map(data, function (item) {
            return {
              label: item.value,
              customer: item.value,
              id: item.id
            }
          }))
        },
        error: function (xhr, status, err) {
          alert("Error")
        }
      });
    },
    select: function (even, ui) {
      $("#customer_id").val(ui.item.id);
    }
  });
  /*Drivers Details*/
  $("#oldDriverAutocomplete").autocomplete({
    minLength:2,
    source: function (request, response) {
      var csrf_token = $('meta[name="csrf-token"]').attr('content');
      $.ajax({
        url: "{{route('oldDriver.address.auto')}}",//url
        data: { searchText: request.term, '_token': csrf_token},
        dataType: "json",
        type: "POST",
        success: function (data) {
          response($.map(data, function (item) {
            return {
              label: item.value,
              driver: item.value,
              id: item.id
            }
          }))
        },
        error: function (xhr, status, err) {
          alert("Error")
        }
      });
    },
    select: function (even, ui) {
      $("#driver_id").val(ui.item.id);
    }
  });
</script>
