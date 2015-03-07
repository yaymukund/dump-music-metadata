var counters = {};

exports.create = function(name, totalCount) {
  counters[name] = { total: totalCount, done: 0 };
  console.log('TODO '+totalCount+' '+name);
};

exports.progress = function(name) {
  var counter = counters[name];
  counter.done++;
  console.log('Done '+name+' '+counter.done+'/'+counter.total);
};
