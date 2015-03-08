var utils = require('./utils'),
    PROCESSED_FILES;

exports.initialize = function() {
  return utils.readdir(process.argv[3]).then(function(files) {
    PROCESSED_FILES = files.map(function(f) {
      return f.slice(0, -5);
    });
  });
};

exports.isProcessed = function(p) {
  return PROCESSED_FILES.indexOf(p) !== -1;
};
