var fs = require('fs'),
    path = require('path'),
    utils = require('./utils');

var EMPTY_FILE = path.join(process.argv[3], 'empty'),
    ALL_JSON = path.join(process.argv[3], '*.json'),
    DB_DUMP = path.join(process.argv[3], 'store.json');

exports.writeJson = function(payload) {
  var json = JSON.stringify(payload),
      filepath = path.join(process.argv[3], payload.folder.path+'.json');

  return utils.writeFile(filepath, json);
};

exports.createEmpty = function() {
  return utils.appendFile(EMPTY_FILE, '');
};

exports.writeEmpty = function(name) {
  return utils.appendFile(EMPTY_FILE, name+"\n");
};

exports.writeEntireDB = function() {
  var folders = [],
      tracks = [];

  return utils.glob(ALL_JSON).then(function(jsonFiles) {
    var promises = jsonFiles.map(function(p) {
      p = path.join(process.cwd(), p);
      return utils.readFile(p, 'utf-8');
    });

    return utils.RSVP.all(promises);
  }).then(function(jsons) {
    jsons.forEach(function(json) {
      json = JSON.parse(json);
      json.folder.id = folders.length;

      json.tracks.forEach(function(t) {
        t.folder_id = json.folder.id;
        tracks.push(t);
      });

      folders.push(json.folder);
    });

    var payload = JSON.stringify({
      folders: folders,
      tracks: tracks
    });

    return utils.writeFile(DB_DUMP, payload);
  });
};
