var fs = require('fs'),
    utils = require('./utils'),
    path = require('path');

// title|album|date|track|artist for later versions of avprobe
// TAG:title|TAG:album|TAG:track|TAG:artist|TAG:date is for older versions.
var TAG_LINE_REGEX = /^(duration|title|album|date|track|artist|TAG:artist|TAG:title|TAG:album|TAG:track|TAG:date)=(.+)$/;

var _getTags = function(filepath) {
  var tags = {},
      cmd = 'avprobe -loglevel quiet'+
                   ' -show_format'+
                   ' "'+filepath+'"';

  return utils.exec(cmd).then(function(res) {
    res[0].split("\n").forEach(function(line) {
      var m = line.match(TAG_LINE_REGEX);

      if (m) {
        var key = m[1].replace('TAG:', '');
        tags[key] = m[2];
      }
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
