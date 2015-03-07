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
    var name = path.relative(process.argv[2], dirpath);
    name = name.split(path.sep)[0];

    return {
      name: name,
      created_at: createdAt,
      tracks: []
    };
  });
};
