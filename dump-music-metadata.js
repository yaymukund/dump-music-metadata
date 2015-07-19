var counter = require('./lib/counter'),
    makeFolder = require('./lib/make-folder'),
    makeTrack = require('./lib/make-track'),
    getFiles = require('./lib/get-files'),
    getFolders = require('./lib/get-folders'),
    writer = require('./lib/writer'),
    utils = require('./lib/utils'),
    path = require('path');

utils.RSVP.on('error', function(err) {
  console.log(err.message, err.stack);
});

var _initializeStore = function() {
  return utils.mkdirp(process.argv[3]).then(function() {
    return writer.createEmpty();
  });
};

var _processFolder = function(dirpath) {
  var opts = { cwd: dirpath },
      tracks = utils.glob('**/*.@(mp3|ogg|m4a)', opts).then(function(filepaths) {
        var promises = filepaths.map(function(p) {
          p = path.join(dirpath, p);
          return makeTrack(p);
        });

        return utils.RSVP.all(promises);
      });

  return utils.RSVP.hash({
    folder: makeFolder(dirpath),
    tracks: tracks
  }).then(function(res) {
    res.tracks = utils.compact(res.tracks);

    var isAllErrors = res.tracks.every(function(t) {
      return !!t.error;
    });

    if (!res.tracks.length || isAllErrors) {
      counter.progress('dirs', 'Nothing found in '+res.folder.path);
      var name = utils.nameFor(dirpath);
      return writer.writeEmpty(name);
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
    return writer.writeJson({
      folder: res.folder,
      tracks: [res.track]
    });
  });
};

_initializeStore().then(getFolders).then(function(dirpaths) {
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
  return writer.writeEntireDB();
}).then(function() {
  console.log('Written db to '+process.argv[4]);
});
