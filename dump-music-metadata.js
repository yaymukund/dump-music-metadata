var getFolders = require('./lib/get-folders'),
    makeFolder = require('./lib/make-folder'),
    makeTrack = require('./lib/make-track'),
    store = require('./lib/store'),
    utils = require('./lib/utils'),
    path = require('path');

var totalCount, processedCount = 0;

var progress = function(msg) {
  console.log(msg+' '+ (++processedCount) +'/'+totalCount);
};

var _isFolderProcessed = function(dirpath) {
  return store.exists({ name: utils.nameFor(dirpath) });
};

var _processFolder = function(dirpath) {
  _isFolderProcessed(dirpath).then(function(isProcessed) {
    if (isProcessed) {
      progress('Skipping track');
      return null;
    }

    var tracks = utils.glob('**/*.@(mp3|flac)', { cwd: dirpath }).then(function(filepaths) {
      filepaths = filepaths.map(function(p) { return dirpath + '/'+p; });
      return utils.RSVP.all(filepaths.map(makeTrack));
    });

    return utils.RSVP.hash({
      folder: makeFolder(dirpath),
      tracks: tracks
    })
  }).then(function(res) {
    if (!res) {
      return store.findBy({ name: utils.nameFor(dirpath) });
    };

    res.folder.tracks = res.tracks;
    progress('Creating track');
    return store.create(res.folder);
  });
};

getFolders().then(function(dirpaths) {
  totalCount = dirpaths.length;
  return dirpaths.map(_processFolder);
}).then(function() {
  console.log('Finished processing folders');
}).catch(console.log);
