'use strict';
const TAG_LINE_REGEX = /^(filename|duration|title|album|date|track|artist|TAG:artist|TAG:title|TAG:album|TAG:track|TAG:date)=(.+)$/;

let fs = require('fs'),
    path = require('path'),
    directory = process.argv[2],
    musicRoot = process.argv[3],
    tracks = [],
    folders = new Map();

function _getTrackNumber(num) {
  num = num || 0;
  return parseInt(num, 10);
}

function readFiles(directory) {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

function pathFor(filepath) {
  return path.relative(musicRoot, filepath);
}

function filenameFor(filepath) {
  let start = filepath.lastIndexOf('/')+1,
      end = filepath.lastIndexOf('.');

  return filepath.substr(start, end - start);
}

function makeTrack(filepath) {
  let output = fs.readFileSync(filepath, { encoding: 'utf8' }),
      track = {};

  output.split("\n").forEach(line => {
    let match = line.match(TAG_LINE_REGEX);

    if (match) {
      let key = match[1].replace('TAG:', '');
      track[key] = match[2];
    }
  });

  track.title = track.title || filenameFor(track.filename);
  track.album = track.album || '?';
  track.artist = track.artist || '?';
  track.date = track.date || '?';
  track.path = pathFor(track.filename).replace('#', '%23');

  if (track.track) {
    track.trackNumber = _getTrackNumber(track.track);
  }

  delete track.filename;
  tracks.push(track);
}

function getCreatedAt(filepath) {
  filepath = path.join(__dirname, musicRoot, filepath);
  return fs.statSync(filepath).mtime;
}

let folderId = 0;
function _makeFolder(folderPath) {
  let folder = {
    created_at: getCreatedAt(folderPath),
    path: folderPath,
    id: folderId++
  };

  folders.set(folderPath, folder);
  return folder;
}

function makeFolderFor(track) {
  let folderPath = path.dirname(track.path);

  if (folderPath === '.') {
    folderPath = track.path;
  }

  if (folders.has(folderPath)) {
    return folders.get(folderPath);
  } else {
    return _makeFolder(folderPath);
  }
}

function generateIndex() {
  return tracks.map(track => {
    return {
      id: track.id,
      search: `${track.title}|${track.album}|${track.artist}`
    }
  });
}

console.log(`Reading files from ${directory}`);

readFiles(directory).then(files => {
  console.log('Building tracks list...');
  files.forEach(file => {
    let filepath = path.join(__dirname, directory, file);
    makeTrack(filepath);
  });

  console.log('Building folders list...');
  tracks.forEach(track => {
    let folder = makeFolderFor(track);
    track.folder_id = folder.id;
  });

  console.log('Building metadata_index...');
  let indexJson = generateIndex(),
      json = {
        tracks,
        folders: Array.from(folders.values())
      };

  console.log('Writing metadata files...');
  fs.writeFileSync('metadata.json', JSON.stringify(json));
  fs.writeFileSync('metadata_index.json', JSON.stringify(indexJson));
});
