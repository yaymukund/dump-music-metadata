var path = require('path'),
    utils = require('./utils'),
    PROCESSED_FILES;

exports.initialize = function() {
  return utils.readdir(process.argv[3]).then(function(files) {
    PROCESSED_FILES = files.map(function(f) {
      return f.slice(0, -5);
    });
  }).then(function() {
    var emptyFilePath = path.join(process.argv[3], 'empty');
    return utils.readFile(emptyFilePath);
  }).then(function(data) {
    var names = data.toString().split("\n");
    PROCESSED_FILES.push.apply(PROCESSED_FILES, names);
  });
};

exports.isProcessed = function(p) {
  return PROCESSED_FILES.indexOf(p) !== -1;
};
