var fs = require('fs'),
    path = require('path'),
    utils = require('./utils'),
    writeFile = utils.denodeify(fs.writeFile);

exports.writeJson = function(payload) {
  var json = JSON.stringify(payload),
      filepath = path.join(process.argv[3], payload.folder.path+'.json');

  return writeFile(filepath, json);
};

exports.touch = function(name) {
  var filepath = path.join(process.argv[3], name+'.json');
  return writeFile(filepath, '');
};
