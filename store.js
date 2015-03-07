var utils = require('./utils'),
    store = new utils.Store({ filename: './store.nedb', autoload: true });

var _create = store.insert.bind(store);
exports.create = utils.denodeify(_create);

var _find = store.find.bind(store);
exports.findBy = utils.denodeify(_find);

var _count = store.count.bind(store);
exports.count = utils.denodeify(_count);

exports.exists = function(doc) {
  return exports.count(doc).then(function(count) {
    return count !== 0;
  });
};
