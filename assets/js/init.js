var compare = new Compare();

$(function(){

  compare.clear();

  $('.button-clear').click(function() {
    compare.clear();
  });

  $( "body" ).on( "click", ".diff", function() {
    var i = this.dataset.index;
    if (i) {
      compare.diff(i);
    }
  });

  $('.folder-select').click(function() {
    compare.showFileDialog(this);
  });

  $('#check-identical-files, #check-hidden-files').on('change', function(){
    compare.filter();
  });

  window.onmessage = function(e){
    if (e.data.type && e.data.type == 'refreshDiff') {
      compare.refreshCompareStatus(e.data.index);
    }
  };

});
