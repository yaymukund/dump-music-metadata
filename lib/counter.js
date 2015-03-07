var counters = {};

exports.create = function(name, totalCount) {
  counters[name] = { total: totalCount, done: 0 };
  console.log('TODO '+totalCount+' '+name);
};

exports.progress = function(name, msg) {
  var counter = counters[name];
  counter.done++;
  msg = 'Done '+name+' '+counter.done+'/'+counter.total+' '+msg;
  console.log(msg);
};
