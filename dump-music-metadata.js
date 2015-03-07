var path = require('path'),
    fs = require('fs'),
    glob = require('glob'),
    mm = require('musicmetadata'),
    RSVP = require('rsvp'),
    MUSIC_DIR = process.argv[2],
    store = {
      failed: [],
      folderIndex: {},
      folders: [],
      tracks: [],
    }, numFiles;

var getFiles = function() {
  var deferred = RSVP.defer(),
      matcher = path.join(MUSIC_DIR, '**/*.@(mp3|flac)');

  glob(matcher, function(err, files) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(files);
    }
  });

  return deferred.promise;
};

var getTags = function(filepath) {
  var deferred = RSVP.defer(),
      stream = fs.createReadStream(filepath);

  musicmetadata(stream, function(err, tags) {
    if (err) {
      console.log('Failed on '+filepath);
      deferred.reject(err);
    } else {
      deferred.resolve(tags);
    }
  });

  return deferred.promise;
};

var dirpathFor = function(filepath) {
  return path.relative(MUSIC_DIR, filepath).split(path.sep)[0];
};

var getCreatedAt = function(name) {
  var deferred = RSVP.defer(),
      folderPath = path.join(MUSIC_DIR, name);

  fs.stat(folderPath, function(err, stats) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(stats.mtime);
    }
  });

  return deferred.promise;
};

var getOrMakeFolder = function(filepath) {
  var name = dirpathFor(filepath);

  if (store.folderIndex[name]) {
    return RSVP.resolve(store.folderIndex[name]);
  }

  var deferred = RSVP.defer(),
      folder = {
        id: store.folders.length,
        name: name
      };

  store.folderIndex[name] = folder;
  store.folders.push(folder);

  return getCreatedAt(name).then(function(createdAt) {
    folder.created_at = createdAt;
    return folder;
  });
};

// var getField = function(tags, field) {
//   var val = undefined;
// 
//   if (tags[field]) {
//     val = tags[field];
//   } else if (tags.v2 && tags.v2[field]) {
//     val = tags.v2[field];
//   } else if (tags.v1 && tags.v1[field]) {
//     val = tags.v1[field];
//   }
// 
//   if (val && val.replace) { val = val.replace(/\0/g, ''); }
//   return val;
// };

var makeTrack = function(filepath) {
  console.log('Starting file '+filepath);
  return RSVP.hash({
    tags: getTags(filepath),
    folder: getOrMakeFolder(filepath)
  }).then(function(res) {
    var track = {
      id: store.tracks.length,
      length_seconds: res.tags.duration,
      title: res.tags.title,
      album: res.tags.album,
      artist: res.tags.artist.join(', '),
      year: res.tags.year,
      track_number: res.tags.track.no,
      genre: res.tags.genre,
      folder_id: res.folder.id
    };

    store.tracks.push(track);
    console.log('Finished track '+store.tracks.length+'/'+store.tracksCount);
    return track;
  }).catch(function(err) {
    console.log('caught error', err);

    if (err.instanceOf(RangeError)) {
      console.log('caught range error');
      store.failed.push(file);
      return null;
    }

    console.log('throwing');
    throw err;
  });
};

getFiles().then(function(files) {
  store.tracksCount = files.length;
  var promises = files.map(makeTrack);
  return RSVP.all(promises);
}).then(function() {
  var json = JSON.stringify({
    tracks: store.tracks,
    folders: store.folders
  });

  console.log('Writing to '+process.argv[3]);
  fs.writeFile(process.argv[3], json, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log(store.failed);
      console.log('Wrote JSON to '+process.argv[3]);
    }
  });
}).catch(function(err) {
  console.log('Errored with: ', err);
});
