var fs = require('fs'),
    utils = require('./utils'),
    mm = utils.denodeify(require('musicmetadata'));

module.exports = function(filepath) {
  var stream = fs.createReadStream(filepath);

  return mm(stream, { duration: true }).then(function(tags) {
    return {
      length_seconds: tags.duration,
      title: tags.title,
      album: tags.album,
      artist: tags.artist.join(', '),
      year: tags.year,
      track_number: tags.track.no,
      genre: tags.genre
    };
  });
};
