var fs = require('fs'),
    utils = require('./utils'),
    mm = utils.denodeify(require('musicmetadata')),
    path = require('path');

module.exports = function(filepath) {
  var stream = fs.createReadStream(filepath),
      tags = mm(stream, { duration: true }),
      createdAt = utils.getCreatedAt(filepath);

  return utils.RSVP.hash({
    tags: tags,
    createdAt: createdAt
  }).then(function(res) {
    return {
      length_seconds: res.tags.duration,
      title: res.tags.title,
      album: res.tags.album,
      artist: res.tags.artist.join(', '),
      year: res.tags.year,
      track_number: res.tags.track.no,
      genre: res.tags.genre,
      created_at: res.createdAt,
      path: path.relative(process.argv[2], filepath)
    };
  });
};
