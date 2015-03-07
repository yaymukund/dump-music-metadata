var getUnprocessed = require('./lib/get-unprocessed'),
    counter = require('./lib/counter'),
    makeFolder = require('./lib/make-folder'),
    makeTrack = require('./lib/make-track'),
    store = require('./lib/store'),
    utils = require('./lib/utils'),
    path = require('path');

utils.RSVP.on('error', console.log);

var _processFolder = function(dirpath) {
  var opts = { cwd: dirpath },
      tracks = utils.glob('**/*.@(mp3|flac|ogg|m4a)', opts).then(function(filepaths) {
        filepaths = filepaths.map(function(p) {
          return dirpath + '/'+p;
        });
        return utils.RSVP.all(filepaths.map(makeTrack));
      });

  return utils.RSVP.hash({
    folder: makeFolder(dirpath),
    tracks: tracks
  }).then(function(res) {
    var name = utils.nameFor(dirpath);
    if (!res.tracks.length) {
      console.log('Nothing found in '+res.folder.path);
      return;
    }

    counter.progress('dirs', 'Finished '+res.folder.path);
    res.folder.tracks = res.tracks;
    return store.append(res.folder);
  });
};

var _processFile = function(filepath) {
  return utils.RSVP.hash({
    folder: makeFolder(filepath),
    track: makeTrack(filepath)
  }).then(function(res) {
    counter.progress('tracks', 'Finished '+res.folder.path);
    res.folder.tracks = [res.track];
    return store.append(res.folder);
  });
};

getUnprocessed('*/').then(function(dirpaths) {
  counter.create('dirs', dirpaths.length);
  return utils.RSVP.all(dirpaths.map(_processFolder));
}).then(function() {
  console.log('Finished queuing folders');
  return getUnprocessed('*.@(mp3|flac|ogg|m4a)');
}).then(function(filepaths) {
  counter.create('tracks', filepaths.length);
  return utils.RSVP.all(filepaths.map(_processFile));
}).then(function() {
  console.log('Flushing store');
  return store.flush();
}).then(function() {
  console.log('Finished writing tracks');
}).catch(console.log);
