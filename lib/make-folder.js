var path = require('path'),
    fs = require('fs'),
    utils = require('./utils'),
    stat = utils.denodeify(fs.stat);

var _getCreatedAt = function(dirpath) {
  return stat(dirpath).then(function(stats) {
    return stats.mtime;
  });
};

module.exports = function(dirpath) {
  return _getCreatedAt(dirpath).then(function(createdAt) {
    return {
      name: utils.nameFor(dirpath),
      created_at: createdAt,
      tracks: []
    };
  });
};
