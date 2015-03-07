var getFolders = require('./get-folders'),
    makeFolder = require('./make-folder'),
    makeTrack = require('./make-track'),
    store = require('./store'),
    utils = require('./utils'),
    path = require('path');

var totalCount, processedCount = 0;

var _nameFor = function(dirpath) {
  var name = path.relative(process.argv[2], dirpath);
  return name.split(path.sep)[0];
};

var _isFolderProcessed = function(dirpath) {
  return store.exists({ name: _nameFor(dirpath) });
};

var _processFolder = function(dirpath) {
  _isFolderProcessed(dirpath).then(function(isProcessed) {
    if (isProcessed) { return null }

    var tracks = utils.glob('*.@(mp3|flac)', { cwd: dirpath }).then(function(filepaths) {
      filepaths = filepaths.map(function(p) { return dirpath + '/'+p; });
      return utils.RSVP.all(filepaths.map(makeTrack));
    });

    return utils.RSVP.hash({
      folder: makeFolder(dirpath),
      tracks: tracks
    })
  }).then(function(res) {
    if (!res) {
      return store.findBy({ name: _nameFor(dirpath) });
    };

    res.folder.tracks = res.tracks;
    console.log('Creating '+ (++processedCount) +'/'+totalCount);
    return store.create(res.folder);
  });
};

getFolders().then(function(dirpaths) {
  totalCount = dirpaths.length;
  return dirpaths.map(_processFolder);
}).then(function() {
  console.log('Finished processing folders');
}).catch(console.log);
