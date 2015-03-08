var fs = require('fs'),
    utils = require('./utils'),
    path = require('path');

var TAG_LINE_REGEX = /=== (\w+) [^:]+: (.+)/;

var _getTags = function(filepath) {
  var cmd = 'id3info "'+filepath+'"';
  return utils.exec(cmd).then(function(res) {
    var tags = {};

    res[0].split("\n").filter(function(l) {
      return l.indexOf('===') === 0;
    }).forEach(function(tag) {
      var m = tag.match(TAG_LINE_REGEX);
      tags[m[1]] = m[2];
    });

    return tags;
  });
};

module.exports = function(filepath) {
  var tags = _getTags(filepath, { duration: true }),
      createdAt = utils.getCreatedAt(filepath),
      relpath = path.relative(process.argv[2], filepath);

  return utils.RSVP.hash({
    tags: tags,
    createdAt: createdAt
  }).then(function(res) {
    res.tags.created_at = res.createdAt;
    res.tags.path = relpath;
    return res.tags;
  }).catch(function(err) {
    return { error: err.message, path: relpath };
  });
};
