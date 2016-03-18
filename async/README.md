## 52 周玩转 52 Node 包 丨 async
🙊 [查看全部计划](https://github.com/DotHide/node-52weeks)

**第 01 周（2016.03.07）** [async](https://www.npmjs.com/package/async) 篇

### async 简介
> 引用官方的话：async 是一个工具模块，用于为异步的 Javascript 提供爽滑干脆的方法集。尽管最初被设计用于 Node 服务端，但它也可以直接在浏览器中运行。

由于编写本文的时候 2.0 还在 pre 阶段，因此本文主要基于它的 1.5.2 稳定版。

async 主要方法有 3 大类（集合、流程控制、工具集），提供了近 40 个方法，包括常规的「功能性」方法（map, reduce, filter, each 等）和一些异步控制流的常规模式（并行、串行、瀑布等）。所有这些方法都假设你遵循了 Node.js 的规范，提供了一个单个的回调作为 async 方法的最后一个参数。

其中一些方法可以根据以下形式得到扩展方法

- <name\>**S**eries：如 each，可以在后面直接加 Series，变为 eachSeries 方法，这样的方法每次同时只执行一个异步操作，在集合操作中较多；
- <name\>**L**imit：如 eachLimit，它表示给每次同时执行异步操作设定一个次数的上限
- 下文中的黑体 **S** 和 **L** 表示该方法是否支持以上两种扩展方法

#### 集合操作（Collections）
- `each` **SL**
- `forEachOf` **SL**
- `map` **SL**
- `filter` **SL**
- `reject` **SL**
- `reduce` `reduceRight`
- `detect` **SL**
- `sortBy`
- `some` **L**
- `every` **L**
- `concat` **S**

#### 流程控制（Control Flow）
- `series` 
- `parallel` **L**
- `whilst` `doWhilst`
- `until` `doUntil`
- `during` `doDuring`
- `forever`
- `waterfall`
- `compose`
- `seq`
- `applyEach` **S**
- `queue` `priorityQueue`
- `cargo`
- `auto`
- `retry`
- `iterator`
- `times` **SL**

#### 工具集（Utils）
- `apply`
- `nextTick`
- `memoize`
- `unmemoize`
- `ensureAsync`
- `constant`
- `asyncify`
- `wrapSync`
- `log`
- `dir`
- `noConflict`

### 玩转 async
接下来，我将从这些方法中挑选一些出来，作为娱乐和分析，限于篇幅不宜过长，我尽可能挑选具有代表性的方法，其他方法其实就是某些方法的变种。我们首先来玩 `each` 方法。

#### each
`each` 顾名思义就是每个，就是把一个集合中的每个元素都做一次操作，由于我们玩的是异步工具，因此它允许每个元素同时做操作，做的最快的最先完成，整个集合操作的时间取决于时间最慢的那个元素的操作。我们来举一个访问网址的例子：

> 用到了两个必要组件 `node-fetch` 和 `present` 分别用来获取网页和计算运行时间

```js
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

var a = function() {
  var start = present();
  // 并行执行访问网址操作，执行顺序不保证
  async.each(urls, fetchUrls, function(err) {
    var end = present();
    if (err) { console.log('xxx> Error: ', err); }
    console.log('===> each Finished.', (end - start).toFixed(2) + 'ms');
  });
}

a();

/* 输出结果
 * ===> Reached:  http://www.qq.com OK 289.21ms
 * ===> Reached:  https://nodejs.org/en/ OK 326.42ms
 * ===> Reached:  https://www.google.com.hk OK 435.10ms
 * ===> Reached:  https://www.baidu.com OK 467.60ms
 * ===> Reached:  https://github.com OK 1666.13ms
 * ===> each Finished. 1676.90ms
*/
```

我们发现他的输出顺序与我们数组原始循序不一致，那是因为 each 不保证顺序，每个元素就像是赛跑一样，大家同时起跑，谁快谁就排第一。最后的完成时间，也反应出它只跟跑得最慢的那个有关，至于为什么时间不等于跑的最慢的那个呢？我的理解是裁判统计时间需要花时间吧，也就是说 `each` 这个方法本身的运算也需要一定的时间。

接着我们来看它的两个扩展方法，`eachSeries` 和 `eachLimit` ，正如前面提到的，Series 是强制串行处理，就是把原来一起跑变成一个一个跑，Limit 则是限制一次跑的人数，比如3个人一跑，因此它需要额外的传一个上限值参数。下面我们分别来看下：

```js
...
var b = function() {
  var start = present();
  // 串行执行访问网址操作，执行顺序依据数组元素顺序
  async.eachSeries(urls, fetchUrls, function(err) {
    var end = present();
    if (err) { console.log('xxx> Error: ', err); }
    console.log('===> eachSeries Finished.', (end - start).toFixed(2) + 'ms');
  });
}

b();

/* 输出结果
 * ===> Reached:  http://www.qq.com OK 755.59ms
 * ===> Reached:  https://github.com OK 2121.04ms
 * ===> Reached:  https://www.baidu.com OK 262.49ms
 * ===> Reached:  https://www.google.com.hk OK 279.92ms
 * ===> Reached:  https://nodejs.org/en/ OK 242.90ms
 * ===> eachSeries Finished. 3663.89ms
*/
```

此时我们可以看到，它的输出顺序与数组的元素顺序是一致的，且它整个过程的耗时应该等于每个元素所花时间的总和，并加上自身的运行时间。

```js
...
var c = function() {
  var start = present();
  // 并行执行访问网址操作，但限制最多同时执行 3 个，同样不保证执行顺序
  console.time('eachLimit');
  async.eachLimit(urls, 3, fetchUrls, function(err) {
    var end = present();
    if (err) { console.log('xxx> Error: ', err); }
    console.log('===> eachLimit Finished.', (end - start).toFixed(2) + 'ms');
  });
}

c();

/* 输出结果
 * ===> Reached:  http://www.qq.com OK 209.35ms
 * ===> Reached:  https://www.baidu.com OK 222.55ms
 * ===> Reached:  https://nodejs.org/en/ OK 143.33ms
 * ===> Reached:  https://www.google.com.hk OK 204.14ms
 * ===> Reached:  https://github.com OK 1009.46ms
 * ===> eachLimit Finished. 1010.35ms
*/
```

可以看出，它相当于随机的分组赛跑，第 1 组跑完了再跑第 2 组，它的整个过程耗时应该等于每组最慢的时间相加，再加上自身运行时间的总和。

其实到这里进一步观察可以发现，`eachSeries` 方法就相当于 `eachLimit` 方法的 limit 值设置为 1 的情况；`each` 则是 limit 值设为数组的长度或者无穷大（Infinity）。

接下来说下其他的一些集合方法，在我看来其他的方法无非是 `each` 的一种变体，只是侧重点不一样罢了。
##### forEachOf
跟 `each` 几乎一样，唯一的不同在于它支持的是对象，它能遍历对象的所有属性，并能获取每个属性的key和value。
##### map
如果说 `each` 看重的是过程，那 `map` 看重的就是结果。`each` 只是预览版，`map` 才是最终版。`map` 可以返回每个元素处理后结果的集合。
##### filter
俗称过筛子，留下需要的元素。须注意的是：此时 `callback` 只能接受 true 或者 false
##### reject
反过来过筛子，剔除不要的元素。须注意的是：此时 `callback` 只能接受 true 或者 false
##### detect
选排头兵，只要符合条件的第一个人。
##### some
过筛子的海选版，只要有一个符合条件，callback 就为 true
##### every
过筛子的精华版，要求每个都符合条件，callback 才为 true
##### concat
类似字符串拼接，这里是将输出结果连起来。
##### sortBy
对结果排序后输出，请注意这个方法是没有 `Series` 和 `Limit` 的

#### series
串行执行，对每个任务函数进行串行的执行，每个任务都需要等到上一个完成后才开始执行，有点像接力赛，一个接一个，任何一个跑失败了就终止，然后 callback 马上抛出错误。如果全都顺利跑完，callback 就在完成时输出所有结果。就拿上面的任务来举例吧，a b c 三个函数作为三个任务：
```js
...
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

d();

/* 输出结果
 * ===> Reached:  https://www.baidu.com OK 366.60ms
 * ===> Reached:  https://nodejs.org/en/ OK 376.16ms
 * ===> Reached:  https://www.google.com.hk OK 384.39ms
 * ===> Reached:  https://github.com OK 1395.95ms
 * ===> Reached:  http://www.qq.com OK 1473.65ms
 * ===> each Finished. 1474.15ms
 * ===> Reached:  http://www.qq.com OK 250.59ms
 * ===> Reached:  https://github.com OK 921.96ms
 * ===> Reached:  https://www.baidu.com OK 221.75ms
 * ===> Reached:  https://www.google.com.hk OK 200.53ms
 * ===> Reached:  https://nodejs.org/en/ OK 146.65ms
 * ===> eachSeries Finished. 1742.10ms
 * ===> Reached:  http://www.qq.com OK 150.28ms
 * ===> Reached:  https://www.baidu.com OK 216.38ms
 * ===> Reached:  https://www.google.com.hk OK 192.21ms
 * ===> Reached:  https://nodejs.org/en/ OK 151.59ms
 * ===> Reached:  https://github.com OK 973.34ms
 * ===> eachLimit Finished. 974.30ms
 * Total:  4192.51ms
*/
```

#### parallel
并行执行，所有任务一起跑。
```js
...
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

e();

/* 输出结果
 * ===> Reached:  http://www.qq.com OK 188.40ms
 * ===> Reached:  http://www.qq.com OK 225.51ms
 * ===> Reached:  http://www.qq.com OK 256.70ms
 * ===> Reached:  https://www.google.com.hk OK 314.46ms
 * ===> Reached:  https://nodejs.org/en/ OK 334.17ms
 * ===> Reached:  https://www.baidu.com OK 431.10ms
 * ===> Reached:  https://www.baidu.com OK 448.82ms
 * ===> Reached:  https://www.google.com.hk OK 243.98ms
 * ===> Reached:  https://nodejs.org/en/ OK 281.63ms
 * ===> Reached:  https://github.com OK 1451.68ms
 * ===> each Finished. 1464.44ms
 * ===> Reached:  https://github.com OK 1452.40ms
 * ===> eachLimit Finished. 1457.35ms
 * ===> Reached:  https://github.com OK 1284.20ms
 * ===> Reached:  https://www.baidu.com OK 217.83ms
 * ===> Reached:  https://www.google.com.hk OK 216.63ms
 * ===> Reached:  https://nodejs.org/en/ OK 224.90ms
 * ===> eachSeries Finished. 2133.25ms
 * Total:  2165.98ms
*/
```

很显然，并行要比串行快不少吧 +_+

#### whilst 和 doWhilst
相当于 while 和 doWhile，就是做循环，利用测试函数重复回调方法。个人觉得没啥好多说的。

#### until 和 doUntil
跟上面一样，上面是当什么时候怎么样，until 是先做一遍再判断。

#### waterfall
名字很美，其实就是串行的变种，就是前一个做完了将结果交给后面一个，适用于标准化的渐进流程。需要注意的是，waterfall 的第一个 function 的第一个参数必须传 callback。例如：

```js
...
// 第一个方法的第一个 callback 必须传 callback
var f = function(callback) {
  callback(null, 1 + 1);
}

var g = function(n, callback) {
  callback(null, n * 2);
}

var h = function(n, callback) {
  callback(null, n - 2);
}

var i = function() {
  async.waterfall([f, g, h],
    function(err, result) {
      console.log('result: ', result);
    });
}

i(); // result: 2
```

如果你必须要在第一个 function 传参的话，只能这样使用：

```js
...
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
  async.waterfall([
      // 如果第一个方法必须传参，这里需要这样处理
      async.apply(f, 1),
      g, h
    ],
    function(err, result) {
      console.log('result: ', result);
    });
}

i(); // result: 2
```

#### compose
组合方法，它的作用是解决异步函数的传参调用，如：`f()`，`g()`，`h()` 三个函数需要实现这样的调用关系，`f(g(h()))`，如果是同步操作没有问题，但如果每个函数都是异步的话，就达不到预期的结果了，例如：

```js
...
var j1 = function(n) {
  setTimeout(function() {
    return n + 1;
  }, 10);
}

var k1 = function(n) {
  setTimeout(function() {
    return n * 2;
  }, 10);
}

var l1 = function() {
  var result = k1(j1());
  console.log(result);
}

l1(); // undefined
```

因此，我们需要使用 compose 方法来组合它们：

```js
...
var j = function(n, callback) {
  setTimeout(function() {
    callback(null, n + 1);
  }, 10);
}

var k = function(n, callback) {
  setTimeout(function() {
    callback(null, n * 2);
  }, 10);
}

var l = function() {
  // 需要注意的是，compose 的参数顺序，需要将先最后做的放最前面，最先做的放最后
  var fn = async.compose(k, j);
  fn(4, function(err, result) {
    console.log('result: ', result);
  });
}

l(); // result: 10
```

（未完待续...）