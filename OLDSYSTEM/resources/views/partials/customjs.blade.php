<script type="text/javascript">
  function viewAll(url) {
    $("body").fadeOut('slow', function()
    {
      $("body").load(url);
      $("body").fadeIn('slow');
      table.ajax.reload();
    });
  }
  /* Get Edit ID  */
  function editForm(url,id) {
    $(".content-loader").fadeOut('slow', function()
    {
      $(".content-loader").fadeIn('slow');
      $(".content-loader").load(url+'/'+id);
      $.getScript("{{asset('templates/admin/assets/js/custom.js')}}");
      $('.dropdown-toggle').dropdown();
    });
  }
  function viewDetails(url,id) {
    $(".content-loader").fadeOut('slow', function()
    {
      $(".content-loader").fadeIn('slow');
      $(".content-loader").load(url +'/' +id);
      $.getScript("{{asset('templates/admin/assets/js/custom.js')}}");
      $('.dropdown-toggle').dropdown();
    });
  }

  function insertForm(url) {
    $(".content-loader").fadeOut('slow', function () {
      $(".content-loader").fadeIn('slow');
      $(".content-loader").load(url);
      $.getScript("{{asset('templates/admin/assets/js/custom.js')}}");
      $('.dropdown-toggle').dropdown();
    });
  }
  /*Delete table rows*/
  function deleteData(url,dataId) {
    var csrf_token = $('meta[name="csrf-token"]').attr('content');
    $.confirm({
      title: 'Delete Confirmation',
      content: 'Are you sure you want to delete this item?',
      type: 'blue',
      buttons: {
        confirm: function () {
          $.ajax({
            url: url + '/' + dataId,
            type: 'POST',
            data: {'_method': 'DELETE', '_token': csrf_token},
            success: function (data) {
              if (data.success === true) {
                table.ajax.reload();
              }
            },
            error: function (data) {
              if (data.error === true) {
                $.alert({title: 'Message Alert!', content: data.message, type: 'red'});
              }
            }
          });
        },
        cancel: function () {
          $.alert('No action was performed');
        }
      }
    });
  }

  /*Delete File*/
  function deleteFile(url,dataId) {
    var csrf_token = $('meta[name="csrf-token"]').attr('content');
    $.confirm({
      title: 'Delete Confirmation',
      content: 'Are you sure you want to delete this record?',
      buttons: {
        confirm: function () {
          $.ajax({
            url: url + '/' + dataId,
            type: 'POST',
            data: {'_method': 'DELETE', '_token': csrf_token},
            success: function (data) {
              if (data.success === true) {
                $('div[data-id="row-' + dataId + '"]').slideUp("slow");
                $.alert({title: 'Message Alert!', content: data.message, type: 'blue'});
              }
            },
            error: function (data) {
              if (data.error === true) {
                $.alert({title: 'Message Alert!', content: data.message, type: 'red'});
              }
            }
          });
        },
        cancel: function () {
          $.alert('No action was performed');
        }
      }
    });
  }
  /*Checkbox for Delete*/
  function toggleBtn() {
    $('input[type="checkbox"]').change(function () {
      $('.btnDelete')[$('input[type=checkbox]:checked').length ? 'slideDown' : 'slideUp']('fast');
    });
  }
  $("#checkAll").click(function () {
    $('input:checkbox').not(this).prop('checked', this.checked);
    if ($(this).is(":checked")) {
      $(".btnDelete").show();
    }else {
      $(".btnDelete").hide();
    }
  });


  /*Form ajax*/
  $(document).ready(function () {
    $('#hezecomform').on('submit', function (e) {
      e.preventDefault();
      $('#btnStatus').attr('disabled', '');
      $(".hts-flash").html('<div class="loader"></div>Processing...');
      $(this).ajaxSubmit({
        target: '.hts-flash',
        success: afterSuccess
      });
    });
  });
  $(document).ready(function () {
    $('#hezecomform2').on('submit', function (e) {
      e.preventDefault();
      $('#btnStatus').attr('disabled', '');
      $(".hts-flash2").html('<div class="loader"></div>Processing...');
      $(this).ajaxSubmit({
        target: '.hts-flash',
        success: afterSuccess2,
        timeout: 10000
      });
    });
  });
  function afterSuccess(data) {
    $(".hts-flash").fadeIn('slow', function(){
      if(data.success===true) {
        $(".hts-flash").html('<div class="alert alert-success">' + data.message + '</div>');
      }
      if(data.success==='delete') {
        //$.alert({title: 'Message Alert!', content: data.message, type: 'blue'});
        $(".hts-flash").html('<div class="alert alert-success">' + data.message + '</div>');
        table.ajax.reload();
      }
      if(data.error===true) {
        $(".hts-flash").html('<div class="alert alert-danger">' + data.message + '</div>');
      }
      $('#btnStatus').removeAttr('disabled'); //enable submit button
      $("html, body").animate({
        scrollTop: 0
      }, 600);
    });
  }
  function afterSuccess2(data) {
    $(".hts-flash2").fadeIn('slow', function(){
      if(data.success===true) {
        $(".hts-flash2").html('<div class="alert alert-success">' + data.message + '</div>');
      }
      if(data.error===true) {
        $(".hts-flash2").html('<div class="alert alert-danger">' + data.message + '</div>');
      }
      $('#btnStatus').removeAttr('disabled'); //enable submit button
    });
  }
  //gallery
  baguetteBox.run('.app-gallery', {
    buttons: false
  });

  //MULTI FIELDS
  var startingNo = -1;
  var $node = "";
  for(varCount=0;varCount<=startingNo;varCount++){
    var displayCount = varCount+1;
    $node += '<p><input type="file" name="filename[]" class="styler btn btn-default"><span class="removeVar btn btn-sm btn-danger">Remove</span></p>';
  }
  $('form').prepend($node);
  $('form').on('click', '.removeVar', function(){
    $(this).parent().remove();
  });
  $('#addVar').on('click', function(){
    varCount++;
    $node = ' <p><input type="file" name="filename[]"  class="styler btn btn-default"><span class="removeVar btn btn-sm btn-danger ">Remove</span></p>';
    $(this).parent().before($node);
  });

  $(document).ready(function ($) {
    var url = window.location.href;
    var activePage = url;
    $('.metisMenu li a').each(function () {
      var linkPage = this.href;
      if (activePage == linkPage) {
        $(this).closest("li").addClass("active");
      }
    });
  });
</script>
