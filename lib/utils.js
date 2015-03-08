var path = require('path'),
    fs = require('fs'),
    RSVP = exports.RSVP = require('rsvp'),
    Store = exports.Store = require('nedb'),
    mkdirp = require('mkdirp');

var _makeCallback = function(deferred) {
  return function(err, res) {
    if (err)
      deferred.reject(err);
    else {
      if (arguments.length > 2) {
        var res = Array.prototype.slice.call(arguments, 1);
      };

      deferred.resolve(res);
    }
  };
};

var denodeify = exports.denodeify = function(fn) {
  return function() {
    var d = RSVP.defer(),
        args = Array.prototype.slice.call(arguments),
        _done = _makeCallback(d);

    args.push(_done)
    fn.apply(null, args)
    return d.promise;
  };
};

exports.readdir = denodeify(fs.readdir);
exports.mkdirp = denodeify(mkdirp);
exports.glob = denodeify(require('glob'));
exports.readFile = denodeify(fs.readFile);
exports.writeFile = denodeify(fs.writeFile);
exports.appendFile = denodeify(fs.appendFile);
exports.exec = denodeify(require('exec-queue'));

exports.nameFor = function(dirpath) {
  var name = path.relative(process.argv[2], dirpath);
  return name.split(path.sep)[0];
};

var _stat = denodeify(fs.stat);

exports.getCreatedAt = function(path) {
  return _stat(path).then(function(stats) {
    return stats.mtime;
  });
};

exports.compact = function(arr) {
  return arr.filter(function(i) { return !!i; });
};
