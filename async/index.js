var fetch = require('node-fetch');
var present = require('present');
var async = require('async');

var urls = [
  'http://www.qq.com',
  'https://github.com',
  'https://www.baidu.com',
  'https://www.google.com.hk',
  'https://nodejs.org/en/'
];

// 访问网址（3秒超时）
var fetchUrls = function(url, callback) {
  var start = present();
  return fetch(url, {
    timeout: 3000
  }).then(function(res) {
    var end = present();
    console.log('===> Reached: ', url, res.statusText, (end - start).toFixed(2) + 'ms');
    callback();
  }).catch(function(err) {
    callback(err);
  });
}

var a = function(callback) {
  var start = present();
  // 并行执行访问网址操作，执行顺序不保证
  async.each(urls, fetchUrls, function(err) {
    var end = present();
    if (err) { console.log('xxx> Error: ', err); }
    console.log('===> each Finished.', (end - start).toFixed(2) + 'ms');
    callback();
  });
}

var b = function(callback) {
  var start = present();
  // 串行执行访问网址操作，执行顺序依据数组元素顺序
  async.eachSeries(urls, fetchUrls, function(err) {
    var end = present();
    if (err) { console.log('xxx> Error: ', err); }
    console.log('===> eachSeries Finished.', (end - start).toFixed(2) + 'ms');
    callback();
  });
}

var c = function(callback) {
  var start = present();
  // 并行执行访问网址操作，但限制最多同时执行 3 个，同样不保证执行顺序
  console.time('eachLimit');
  async.eachLimit(urls, 3, fetchUrls, function(err) {
    var end = present();
    if (err) { console.log('xxx> Error: ', err); }
    console.log('===> eachLimit Finished.', (end - start).toFixed(2) + 'ms');
    callback();
  });
}

// async.series
var d = function() {
  var start = present();
  async.series([
      a,
      b,
      c
    ],
    function(err, results) {
      var end = present();
      console.log('Total: ', (end - start).toFixed(2) + 'ms');
    });
}

// async.parallel
var e = function() {
  var start = present();
  async.parallel([
      a,
      b,
      c
    ],
    function(err, results) {
      var end = present();
      console.log('Total: ', (end - start).toFixed(2) + 'ms');
    });
}

// d();
// e();

var f = function(n, callback) {
  callback(null, n + 1);
}

var g = function(n, callback) {
  callback(null, n * 2);
}

var h = function(n, callback) {
  callback(null, n - 2);
}

var i = function() {
  debugger;
  async.waterfall([
      async.apply(f, 1),
      g, h
    ],
    function(err, result) {
      console.log('result: ', result);
    });
}

// i();

var j = function(n, callback) {
  setTimeout(function() {
    callback(null, n + 1);
  }, 10);
}

var j1 = function(n) {
  setTimeout(function() {
    return n + 1;
  }, 10);
}

var k = function(n, callback) {
  setTimeout(function() {
    callback(null, n * 2);
  }, 10);
}

var k1 = function(n) {
  setTimeout(function() {
    return n * 2;
  }, 10);
}

var l = function() {
  var fn = async.compose(k, j);
  fn(4, function(err, result) {
    console.log('result: ', result);
  });
}

var l1 = function() {
  var result = k1(j1());
  console.log(result);
}

// l();
l1();
