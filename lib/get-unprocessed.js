var store = require('./store'),
    utils = require('./utils'),
    path = require('path');

module.exports = function(matcher) {
  var names;
  matcher = path.join(process.argv[2], matcher);
  console.log('Finding unprocessed '+matcher);

  return utils.glob(matcher).then(function(_paths) {
    names = _paths.map(utils.nameFor);
    return store.findBy({ name: { $in: names }});

  }).then(function(folders) {
    var processed = folders.map(function(f) {
      return f.name;
    });

    return names.filter(function(n) {
      return processed.indexOf(n) === -1;
    }).map(function(n) {
      return path.join(process.argv[2], n);
    });
  });;
};
