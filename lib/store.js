var utils = require('./utils'),
    store = new utils.Store({ filename: './store.nedb', autoload: true }),
    buffer = [];

var _create = store.insert.bind(store);
exports.create = utils.denodeify(_create);

exports.append = function(item) {
  buffer.push(item);
  item = utils.RSVP.resolve(item);

  if (buffer.length > 100) {
    return exports.flush().then(function() {
      return item;
    });

  } else {
    return item;
  }
};

exports.flush = function() {
  _buffer = buffer;
  buffer = [];
  return exports.create(_buffer);
};

var _find = store.find.bind(store);
exports.findBy = utils.denodeify(_find);

var _count = store.count.bind(store);
exports.count = utils.denodeify(_count);

exports.compact = function() {
  store.persistence.compactDatafile();
};

// Used by indexing script:
exports._store = store;
