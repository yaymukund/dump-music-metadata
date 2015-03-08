var utils = require('./utils'),
    isProcessed = require('./is-processed'),
    path = require('path'),
    FOLDERS_GLOB = path.join(process.argv[2], '*/');

module.exports = function() {
  return isProcessed.initialize().then(function() {
    return utils.glob(FOLDERS_GLOB);

  }).then(function(dirpaths) {
    return dirpaths.filter(function(d) {
      return !isProcessed.isProcessed(utils.nameFor(d));
    });
  });
};
