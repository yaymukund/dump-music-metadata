'use strict';
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

function pathFor(json) {
  return path.relative(musicRoot, json.filename);
}

function filenameFor(filepath) {
  let start = filepath.lastIndexOf('/')+1,
      end = filepath.lastIndexOf('.');

  return filepath.substr(start, end - start);
}

function makeTrack(filepath) {
  let json = require(filepath).format,
      track;

  json.tags = json.tags || {};
  filepath = pathFor(json);

  track = {
    id: tracks.length,
    title: json.title || json.tags.title || filenameFor(filepath),
    album: json.album || json.tags.album || '?',
    artist: json.artist || json.tags.artist || '?',
    date: json.date || json.tags.date || '?',
    path: filepath.replace('#', '%23'),
    duration: json.duration
  };

  track.track = json.track || json.tags.track;

  if (track.track) {
    track.trackNumber = _getTrackNumber(track.track);
  }

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
  files.forEach(file => {
    let filepath = path.join(__dirname, directory, file);
    makeTrack(filepath);
  });

  tracks.forEach(track => {
    let folder = makeFolderFor(track);
    track.folder_id = folder.id;
  });

  let indexJson = generateIndex(),
      json = {
        tracks,
        folders: Array.from(folders.values())
      };

  fs.writeFileSync('metadata.json', JSON.stringify(json));
  fs.writeFileSync('metadata_index.json', JSON.stringify(indexJson));
});
