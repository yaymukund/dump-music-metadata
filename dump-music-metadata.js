var counter = require('./lib/counter'),
    makeFolder = require('./lib/make-folder'),
    makeTrack = require('./lib/make-track'),
    getFiles = require('./lib/get-files'),
    getFolders = require('./lib/get-folders'),
    writer = require('./lib/writer'),
    utils = require('./lib/utils'),
    path = require('path');

utils.RSVP.on('error', console.log);

var _processFolder = function(dirpath) {
  var opts = { cwd: dirpath },
      tracks = utils.glob('**/*.@(mp3|flac|ogg|m4a)', opts).then(function(filepaths) {
        filepaths = filepaths.map(function(p) {
          return path.join(dirpath, p);
        });

        return utils.RSVP.all(filepaths.map(makeTrack));
      });

  return utils.RSVP.hash({
    folder: makeFolder(dirpath),
    tracks: tracks
  }).then(function(res) {
    if (!res.tracks.length) {
      counter.progress('dirs', 'Nothing found in '+res.folder.path);
      var name = utils.nameFor(dirpath);
      writer.touch(name)
      return;
    }

    counter.progress('dirs', 'Finished '+res.folder.path);
    return writer.writeJson(res);
  });
};

var _processFile = function(filepath) {
  return utils.RSVP.hash({
    folder: makeFolder(filepath),
    track: makeTrack(filepath)
  }).then(function(res) {
    counter.progress('tracks', 'Finished '+res.folder.path);
    return writer.writeJson(res);
  });
};

getFolders().then(function(dirpaths) {
  counter.create('dirs', dirpaths.length);
  return utils.RSVP.all(dirpaths.map(_processFolder));
}).then(function() {
  console.log('Finished queuing folders');
  return getFiles();
}).then(function(filepaths) {
  counter.create('tracks', filepaths.length);
  return utils.RSVP.all(filepaths.map(_processFile));
}).then(function() {
  console.log('Finished writing tracks');
}).catch(console.log);
