function searchToObject(search) {
  return search.substring(1).split("&").reduce(function(result, value) {
    var parts = value.split('=');
    if (parts[0]) result[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    return result;
  }, {})
};

var fs = require('fs');
var params = searchToObject(window.location.search);

$(document).ready(function () {

  $('.collection-header.left').html(params.left);
  $('.collection-header.right').html(params.right);

  $('#compare').mergely({
    width: 'auto',
    height: 'auto', // containing div must be given a height
    lhs: function(setValue) {
      try {
        setValue(fs.readFileSync(params.left,  "utf8"));
      } catch (e) {
        console.log('File not found..' + params.left);
      }
    },
    rhs: function(setValue) {
      try {
        setValue(fs.readFileSync(params.right,  "utf8"));
      } catch (e) {
        console.log('File not found..' + params.right);
      }
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

  $('#move-to-right').click(function(){
  	var rightTxt = $('#compare').mergely('get', 'rhs');
  	$('#compare').mergely('lhs', rightTxt);
  });

  $('#move-to-left').click(function(){
  	var leftTxt = $('#compare').mergely('get', 'lhs');
  	$('#compare').mergely('rhs', leftTxt);
  });

  $('#button-save').click(function() {
    var leftTxt = $('#compare').mergely('get', 'lhs');
    fs.writeFileSync(params.left, leftTxt, 'utf8');
    var rightTxt = $('#compare').mergely('get', 'rhs');
    fs.writeFileSync(params.right, rightTxt, 'utf8');
    window.opener.postMessage({type: 'refreshDiff', index: parseInt(params.index)}, 'file://');
    alert('saved');
  });

});
