'use strict';
const TAG_LINE_REGEX = /^(original_path|duration|title|album|date|track|artist|TAG:artist|TAG:title|TAG:album|TAG:track|TAG:date)=(.+)$/;

let fs = require('fs');
let readline = require('readline');
let path = require('path');
let directory = 'tags.cache';
let musicRoot = process.argv[2];
let destDir = process.argv[3];
let tracks = [];
let folders = new Map();

// Run with musicRoot and destDir
//
// e.g.:
//
// node process-tags.js ~/music ~/www/music-app
//

function _getTrackNumber(num) {
  num = num || 0;
  return parseInt(num, 10);
}

function readTags(directory) {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        reject(err);
      } else {
        files = files.filter(f => f.endsWith('.tags'));
        resolve(files);
      }
    });
  });
}

function relativePathFor(filepath) {
  return path.relative(musicRoot, filepath);
}

function filenameFor(filepath) {
  let start = filepath.lastIndexOf('/')+1,
      end = filepath.lastIndexOf('.');

  return filepath.substr(start, end - start);
}

function notify(text) {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(text);
}

let trackId = 0;
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

  track.id = trackId++;
  track.title = track.title || filenameFor(track.original_path);
  track.album = track.album || '?';
  track.artist = track.artist || '?';
  track.date = track.date || '?';
  track.path = relativePathFor(track.original_path).replace(/#/g, '%23');

  if (track.track) {
    track.trackNumber = _getTrackNumber(track.track);
  }

  tracks.push(track);
}

function getCreatedAt(filepath) {
  filepath = path.resolve(musicRoot, filepath);
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

function _folderPathFor(track) {
  let filepath = relativePathFor(track.original_path);
  return path.dirname(filepath);
}

function makeFolderFor(track) {
  let folderPath = _folderPathFor(track);
  delete track.original_path;

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

function writeFileSync(name, contents) {
  let fullPath = path.join(destDir, name);
  console.log(`Writing ${fullPath}`);
  fs.writeFileSync(fullPath, contents);
}

console.log(`Reading files from ${directory}`);

readTags(directory).then(files => {
  console.log();

  files.forEach((file, i) => {
    notify(`Making track ${i}/${files.length}`);
    let filepath = path.join(__dirname, directory, file);
    makeTrack(filepath);
  });

  console.log();

  tracks.forEach((track, i) => {
    notify(`Making folder ${i}/${tracks.length}`);
    let folder = makeFolderFor(track);
    track.folder_id = folder.id;
  });

  console.log();

  let indexJson = generateIndex(),
      json = {
        tracks,
        folders: Array.from(folders.values())
      };

  writeFileSync('metadata.json', JSON.stringify(json));
  writeFileSync('metadata_index.json', JSON.stringify(indexJson));
});
