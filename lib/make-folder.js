var utils = require('./utils');

module.exports = function(dirpath) {
  return utils.getCreatedAt(dirpath).then(function(createdAt) {
    return {
      path: utils.nameFor(dirpath),
      created_at: createdAt,
      tracks: []
    };
  });
};
