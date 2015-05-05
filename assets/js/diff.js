function searchToObject(search) {
  return search.substring(1).split("&").reduce(function(result, value) {
    var parts = value.split('=');
    if (parts[0]) result[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    return result;
  }, {})
};

var fs = require('remote').require('fs');
var params = searchToObject(window.location.search);

$(document).ready(function () {

  $('.collection-header.left').html(params.left);
  $('.collection-header.right').html(params.right);

  $('#compare').mergely({
    width: 'auto',
    height: 'auto', // containing div must be given a height
    lhs: function(setValue) {
      setValue(fs.readFileSync(params.left,  "utf8"));
    },
    rhs: function(setValue) {
      setValue(fs.readFileSync(params.right,  "utf8"));
    },
    cmsettings: { readOnly: false, lineWrapping: true },
  });

  document.getElementById('ignorews').addEventListener('change', function() {
    $('#compare').mergely('options', { ignorews: this.checked });
  }, false);

  $('#next-diff').click(function(){
    $('#compare').mergely('scrollToDiff', 'next');
  });

  $('#prev-diff').click(function(){
    $('#compare').mergely('scrollToDiff', 'prev');
  });

});
