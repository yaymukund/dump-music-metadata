'use strict';
const TAG_LINE_REGEX = /^(original_path|duration|title|album|date|track|artist|TAG:artist|TAG:title|TAG:album|TAG:track|TAG:date)=(.+)$/;

let fs = require('fs');
let path = require('path');
let directory = process.argv[2];
let musicRoot = process.argv[3];
let tracks = [];
let folders = new Map();
let ProgressBar = require('progress');

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

console.log(`Reading files from ${directory}`);

readTags(directory).then(files => {
  let progress = new ProgressBar('[:bar] :current/:total Building tracks list...', {
    clear: true,
    total: files.length
  });

  files.forEach(file => {
    let filepath = path.join(__dirname, directory, file);
    makeTrack(filepath);
    progress.tick();
  });

  progress = new ProgressBar('[:bar] :current/:total Building folders list...', {
    clear: true,
    total: tracks.length
  });

  console.log('Building folders list...');
  tracks.forEach(track => {
    let folder = makeFolderFor(track);
    track.folder_id = folder.id;
    progress.tick();
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
