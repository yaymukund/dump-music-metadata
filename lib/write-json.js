var fs = require('fs'),
    path = require('path'),
    utils = require('./utils'),
    writeFile = utils.denodeify(fs.writeFile);

module.exports = function(payload) {
  var json = JSON.stringify(payload),
      filepath = path.join(process.argv[3], payload.folder.path+'.json');

  return writeFile(filepath, json);
};
