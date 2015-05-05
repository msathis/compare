$(function(){

  var fs = require('remote').require('fs');
  var path = require('remote').require('path');
  var crypto = require('remote').require('crypto');
  var dialog = require('remote').require('dialog');
  var checksum = require('remote').require('checksum');
  var read = require('remote').require('fs-readdir-recursive');

  var folderList = {}, comparedResults = [];
  var spinnerHtml = '<div class="preloader-wrapper tiny active center-align">'
    + '<div class="spinner-layer spinner-blue-only"><div class="circle-clipper left">'
    + '<div class="circle"></div></div><div class="gap-patch">'
    + '<div class="circle"></div></div><div class="circle-clipper right">'
    + '<div class="circle"></div></div></div></div>';


  clear();

  function clear() {
    folderList = {left: {files: [], path: ''}, right: {files: [], path: ''}};
    $('.preloader-wrapper, .results-list, .folder-selected').addClass('hidden');
    $('.folder-select').removeClass('hidden');
  }

  $('.button-clear').click(function() {
    clear();
  });

  $( "body" ).on( "click", ".diff", function() {
    var i = this.dataset.index;
    if (i) {
      window.open('file://' + __dirname + '/diff.html?left='
      + encodeURIComponent(folderList.left.path + '/' + comparedResults[i].left)
      + '&right=' + encodeURIComponent(folderList.right.path + '/' + comparedResults[i].right));
    }
  });

  $('.folder-select').click(function() {

    var folder = dialog.showOpenDialog({
      title: 'Select a Folder to Compare',
      properties: [ 'openDirectory' ]
    });
    if (folder) {
      prepareLayout.bind(this)(false);
      var files = read(folder[0]);
      folderList[this.dataset.position] = {
        files: files,
        path: folder[0]
      };
      if (folderList.left.path && folderList.right.path) {
        prepareLayout.bind(this)(true);
        comparedResults = compareFolders(folderList['left'], folderList['right']);
        displayResults(comparedResults);
        populateCompareStatus(comparedResults);
      }
    }
  });

  var compareFolders = function(left, right, done) {
    var leftFiles = left.files, rightFiles = right.files;
    var results = [], i = 0, j = 0, total = leftFiles.length + rightFiles.length;
    while(i != leftFiles.length || j != rightFiles.length) {
      if (leftFiles[i] == rightFiles[j]) {
        results.push({left: leftFiles[i], right: rightFiles[j]});
        i++;
        j++;
      } else if (!rightFiles[j] || (leftFiles[i] < rightFiles[j])) {
        results.push({left: leftFiles[i]});
        i++;
      } else {
        results.push({right: rightFiles[j]});
        j++;
      }
    }
    return results;
  };

  var prepareLayout = function(bothSidesReady) {
    $(this).addClass("hidden");
    if (bothSidesReady) {
      $('.preloader-wrapper').removeClass("hidden");
      $('.folder-selected').addClass("hidden");
    } else {
      $(this).siblings('.folder-selected').removeClass("hidden");
    }
  };

  var displayResults = function(files) {

    var leftFolderName = path.basename(folderList.left.path);
    var rightFolderName = path.basename(folderList.right.path);
    var leftHtml = '<li class="collection-header"><h4>'+ leftFolderName +'</h4></li>';
    var rightHtml = '<li class="collection-header"><h4>'+ leftFolderName +'</h4></li>';

    var leftListDiv = $('.left-bar .results-list').find('ul').html(leftHtml);
    var rightListDiv = $('.right-bar .results-list').find('ul').html(rightHtml);
    var middleListDiv = $('.middle-bar .results-list').find('ul').html('<li class="collection-header"><h4>Status</h4></li>');
    var color = '';

    $('.left-bar .preloader-wrapper').addClass("hidden");
    $('.left-bar .results-list').removeClass("hidden");
    $('.right-bar .preloader-wrapper').addClass("hidden");
    $('.right-bar .results-list').removeClass("hidden");
    $('.middle-bar .results-list').removeClass("hidden");

    for(var i in files) {
      var maxHeight = 0, $divs = [];
      if (folderList.left.path) {
        var filePath = files[i].left;
        var $li = $('<li class="collection-item">' +
        (filePath || '') + '</li>');
        leftListDiv.append($li);
        maxHeight = $li.height();
        $divs.push($li[0]);
      }
      if (folderList.right.path) {
        var filePath = files[i].right;
        var $li = $('<li class="collection-item">' +
        (filePath || '') + '</li>');
        rightListDiv.append($li);
        maxHeight = maxHeight < $li.height() ? $li.height(): maxHeight;
        $divs.push($li[0]);
      }

      if (folderList.left.path && folderList.right.path) {
        var $li = $('<li class="fadeIn animated collection-item">'+ spinnerHtml +'</li>');
        middleListDiv.append($li);
        $divs.push($li[0]);
        $($divs).height(maxHeight);
      }
    }
  };

  var populateCompareStatus = function(files, i) {
    var color = '', i = 0;
    compareFile(files, i , color);
  };

  var compareFile = function(files, i, color) {
    isFilesSame(files[i], function(sameName, sameContent) {
      color = setCompareStatus(i, sameName, sameContent, color);
      i++;
      if (i < files.length) {
        compareFile(files, i, color);
      }
    });
  };

  var isFilesSame = function(file, done) {

    if (file.left !== file.right) {
      done(false, false);
    } else {

      var leftHash, rightHash;

      checksum.file(folderList.left.path + "/" + file.left, function (err, sum) {
        leftHash = sum;
        if (rightHash)
          done(true, rightHash === leftHash);
      });

      checksum.file(folderList.right.path + "/" + file.right, function (err, sum) {
        rightHash = sum;
        if (leftHash)
          done(true, rightHash === leftHash);
      });
    }
  };

  var setCompareStatus = function(i, sameName, sameContent, color) {
    var html = '';
    if (sameName && sameContent) {
      color = color != 'green' ? 'green' : 'green lighten-1';
      html = '<i class="mdi-action-done-all small"></i>';
    } else if (sameName) {
      color = color != 'yellow' ? 'yellow' : 'yellow lighten-1';
      html = '<a href="#!" class="secondary-content diff" data-index="'+ i +'"><i class="mdi-action-cached small"></i></a>';
    } else {
      color = color != 'red' ? 'red' : 'red lighten-2'
      html = '<a href="#!" class="secondary-content diff" data-index="'+ i +'"><i class="mdi-action-cached small"></i></a>';
    }
    $('.middle-bar .results-list li:nth-child('+ (i + 2) +')')
      .html(html).addClass(color);
    $('.left-bar .results-list li:nth-child('+ (i + 2) +')').addClass(color);
    $('.right-bar .results-list li:nth-child('+ (i + 2) +')').addClass(color);
    return color;
  };

});
