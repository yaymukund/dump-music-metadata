var fs = require('fs'),
    path = require('path'),
    utils = require('./utils'),
    writeFile = utils.denodeify(fs.writeFile),
    appendFile = utils.denodeify(fs.appendFile);

var EMPTY_FILE = path.join(process.argv[3], 'empty');

exports.writeJson = function(payload) {
  var json = JSON.stringify(payload),
      filepath = path.join(process.argv[3], payload.folder.path+'.json');

  return writeFile(filepath, json);
};

exports.createEmpty = function() {
  return appendFile(EMPTY_FILE, '');
};

exports.writeEmpty = function(name) {
  return appendFile(EMPTY_FILE, name+"\n");
};
