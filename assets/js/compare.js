var fs = require('remote').require('fs');
var path = require('remote').require('path');
var crypto = require('remote').require('crypto');
var dialog = require('remote').require('dialog');
var checksum = require('remote').require('checksum');
var read = require('remote').require('fs-readdir-recursive');

function Compare() {
  this.folderList = {};
  this.comparedResults = [];
  this.filters = {hidden: true, identical: true};
};

Compare.prototype.clear = function() {
    this.folderList = {left: {files: [], path: ''}, right: {files: [], path: ''}};
    $('.preloader-wrapper, .results-list, .folder-selected').addClass('hidden');
    $('.folder-select').removeClass('hidden');
    $('.nav-item').addClass('hidden').removeClass('animated');
}

Compare.prototype.diff = function(i) {
  window.open('file://' + __dirname + '/diff.html?left='
  + encodeURIComponent(this.folderList.left.path + '/' + (this.comparedResults[i].left || this.comparedResults[i].right))
  + '&right=' + encodeURIComponent(this.folderList.right.path + '/' + (this.comparedResults[i].right || this.comparedResults[i].left))
  + '&index=' + i);
}

Compare.prototype.filter = function(filter) {
  this.filters.hidden = $('#check-hidden-files').is(':checked');
  this.filters.identical = $('#check-identical-files').is(':checked');
  $('.collection-item.green').toggleClass('hidden', !this.filters.identical);
  $('.collection-item.hidden-file').toggleClass('hidden', !this.filters.hidden);
}

Compare.prototype.showFileDialog = function(el) {
  var folder = dialog.showOpenDialog({
    title: 'Select a Folder to Compare',
    properties: [ 'openDirectory' ]
  });
  if (folder) {
    this.prepareLayout.bind(el)(false);
    var files = read(folder[0]);
    this.folderList[el.dataset.position] = {
      files: files,
      path: folder[0]
    };
    if (this.folderList.left.path && this.folderList.right.path) {
      this.prepareLayout.bind(el)(true);
      this.comparedResults = this.compareFolders(this.folderList['left'], this.folderList['right']);
      this.displayResults(this.comparedResults);
      this.populateCompareStatus(this.comparedResults);
    }
  }
}

Compare.prototype.compareFolders = function(left, right, done) {
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

Compare.prototype.prepareLayout = function(bothSidesReady) {
  $(this).addClass("hidden");
  if (bothSidesReady) {
    $('.nav-item').removeClass('hidden').addClass('animated');
    $('.preloader-wrapper').removeClass("hidden");
    $('.folder-selected').addClass("hidden");
  } else {
    $('.button-clear-wrap').removeClass('hidden').addClass('animated');
    $(this).siblings('.folder-selected').removeClass("hidden");
  }
};

Compare.prototype.displayResults = function(files) {

  var leftFolderName = path.basename(this.folderList.left.path);
  var rightFolderName = path.basename(this.folderList.right.path);
  var leftHtml = '<li class="collection-header"><h4>'+ leftFolderName +'</h4></li>';
  var rightHtml = '<li class="collection-header"><h4>'+ leftFolderName +'</h4></li>';

  var leftListDiv = $('.left-bar .results-list').find('ul').html(leftHtml);
  var rightListDiv = $('.right-bar .results-list').find('ul').html(rightHtml);
  var middleListDiv = $('.middle-bar .results-list').find('ul').html('<li class="collection-header"><h4>Status</h4></li>');

  $('.left-bar .preloader-wrapper').addClass("hidden");
  $('.left-bar .results-list').removeClass("hidden");
  $('.right-bar .preloader-wrapper').addClass("hidden");
  $('.right-bar .results-list').removeClass("hidden");
  $('.middle-bar .results-list').removeClass("hidden");

  for(var i in files) {

    var maxHeight = 0, $divs = [], classString =  '';
    classString = (files[i].left || files[i].right || '').indexOf('.') === 0 ? 'hidden-file' : '';

    var filePath = files[i].left;
    var $li = $('<li class="collection-item fadeIn animated '+ classString +'">' +
    (filePath || '') + '</li>');
    leftListDiv.append($li);
    maxHeight = $li.height();
    $divs.push($li[0]);

    var filePath = files[i].right;
    $li = $('<li class="collection-item fadeIn animated '+ classString +'">' +
    (filePath || '') + '</li>');
    rightListDiv.append($li);
    maxHeight = maxHeight < $li.height() ? $li.height(): maxHeight;
    $divs.push($li[0]);

    var $li = $('<li class="fadeIn animated collection-item '+ classString +'">'
      + $('#spinner_template').html() +'</li>');
    middleListDiv.append($li);
    $divs.push($li[0]);
    $($divs).height(maxHeight);
  }
};

Compare.prototype.populateCompareStatus = function(files, i) {
  var color = '', i = 0;
  this.compareFile(files, i , color);
};

Compare.prototype.compareFile = function(files, i, color) {
  this.isFilesSame(files[i], function(sameName, sameContent) {
    this.setCompareStatus(i, sameName, sameContent);
    i++;
    if (i < files.length) {
      this.compareFile(files, i, color);
    }
  }.bind(this));
};

Compare.prototype.refreshCompareStatus = function(i) {
  this.isFilesSame(this.comparedResults[i], function(sameName, sameContent) {
    this.setCompareStatus(i, sameName, sameContent);
  }.bind(this));
}

Compare.prototype.isFilesSame = function(file, done) {

  if (file.left !== file.right) {
    done(false, false);
  } else {

    var leftHash, rightHash;

    checksum.file(this.folderList.left.path + "/" + file.left, function (err, sum) {
      leftHash = sum;
      if (rightHash)
        done(true, rightHash === leftHash);
    });

    checksum.file(this.folderList.right.path + "/" + file.right, function (err, sum) {
      rightHash = sum;
      if (leftHash)
        done(true, rightHash === leftHash);
    });
  }
};

Compare.prototype.setCompareStatus = function(i, sameName, sameContent) {
  var html = '', color = '';
  if (sameName && sameContent) {
    color = 'green' + (this.filters.identical ? '' : ' hidden');
    html = '<i class="mdi-action-done-all small"></i>';
  } else if (sameName) {
    color = 'yellow';
    html = '<a href="#!" class="secondary-content diff" data-index="'+ i +'"><i class="mdi-action-cached small"></i></a>';
  } else {
    color = 'red' ;
    html = '<a href="#!" class="secondary-content diff" data-index="'+ i +'"><i class="mdi-action-cached small"></i></a>';
  }
  $('.middle-bar .results-list li:nth-child('+ (i + 2) +')')
    .html(html).removeClass('green yellow red').addClass(color);
  $('.left-bar .results-list li:nth-child('+ (i + 2) +')').removeClass('green yellow red').addClass(color);
  $('.right-bar .results-list li:nth-child('+ (i + 2) +')').removeClass('green yellow red').addClass(color);
};
