var utils = require('./utils'),
    isProcessed = require('./is-processed'),
    path = require('path'),
    FILES_GLOB = path.join(process.argv[2], '*.@(mp3|flac|ogg|m4a)')

module.exports = function() {
  return isProcessed.initialize().then(function() {
    return utils.glob(FILES_GLOB);

  }).then(function(filepaths) {
    return filepaths.filter(function(f) {
      return !isProcessed.isProcessed(utils.nameFor(f));
    });
  });
};
