var path = require('path'),
    RSVP = exports.RSVP = require('rsvp'),
    Store = exports.Store = require('nedb');

var _makeCallback = function(deferred) {
  return function(err, res) {
    if (err)
      deferred.reject(err);
    else
      deferred.resolve(res);
  };
};

exports.denodeify = function(fn) {
  return function() {
    var d = RSVP.defer(),
        args = Array.prototype.slice.call(arguments),
        _done = _makeCallback(d);

    args.push(_done)
    fn.apply(null, args)
    return d.promise;
  };
};

exports.nameFor = function(dirpath) {
  var name = path.relative(process.argv[2], dirpath);
  return name.split(path.sep)[0];
};

exports.glob = exports.denodeify(require('glob'));
