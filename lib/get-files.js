var utils = require('./utils'),
    path = require('path');

module.exports = function() {
  var p = path.join(process.argv[2], '*.@(mp3|flac)');
  console.log('Finding files that match '+p);
  return utils.glob(p);
};
