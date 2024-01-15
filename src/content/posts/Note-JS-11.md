---
title: 学习笔记 | JS 高级程序设计-第11章-异步
pubDate: 2023-11-22 21:01:00.0
updated: 2023-11-22 21:01:00.0
categories: ['学习笔记']
tags: ['TS',  '网站开发']
description: ' '
---
## 起源

早期 JS 实现需要通过计时器和回调实现异步，会导致多层嵌套的“回调地狱”。

```js
function double(value, success, failure) {
  setTimeout(() => {
    try {
      if (typeof value !== "number") {
        throw "Must provide number as first argument";
      }
      success(2 * value);
    } catch (e) {
      failure(e);
    }
  }, 1000);
}
const successCallback = (x) => {
  double(x, (y) => console.log(`Success: ${y}`));
};
const failureCallback = (e) => console.log(`Failure: ${e}`);
double(3, successCallback, failureCallback); // Success: 12（大约1000 毫秒之后）
```

## 期约 Promise

2010年，CommonJS项目实现的Promises/A规范日益流行起来。后续出现了多种期约实现，2012年Promises/A+组织 fork 了CommonJS的Promises/A建议，并以相同的名字制定了Promises/A+规范。这个规范最终成为了ECMAScript6规范实现的范本。

### 状态机

期约是一个有状态的对象，可能处于如下3种状态之一：
- 待定（pending）
- 兑现（fulfilled，或resolved）-> 产生一个私有内部值 value
- 拒绝（rejected）-> 产生一个私有内部理由 reason

期约的状态是私有的，不能直接通过JavaScript检测到。这主要是为了避免根据读取到的期约状态，以同步方式处理期约对象。另外，期约的状态也不能被外部JavaScript代码修改。这与不能读取该状态的原因是一样的：期约故意将异步行为封装起来，从而隔离外部的同步代码。

### 执行函数

由于期约的状态是私有的，所以只能在内部进行操作。内部操作在期约的执行器函数中完成（resolve 和 reject）。

执行器函数是**同步**执行的。这是因为执行器函数是期约的初始化程序。

无论resolve()和reject()中的哪个被调用，状态转换都不可撤销了。于是继续修改状态会静默失败。

#### Promise.resolve()

通过调用Promise.resolve()静态方法，可以实例化一个解决的期约。这个解决的期约的值对应着传给Promise.resolve()的**第一个**参数。

```js
setTimeout(console.log, 0, Promise.resolve());
// Promise <resolved>: undefined
setTimeout(console.log, 0, Promise.resolve(3));
// Promise <resolved>: 3
// 多余的参数会忽略
setTimeout(console.log, 0, Promise.resolve(4, 5, 6));
// Promise <resolved>: 4
```

Promise.resolve()是一个幂等方法，如果传入的参数本身是一个期约，那它的行为就类似于一个空包装。

```js
let p = Promise.resolve(7);
setTimeout(console.log, 0, p === Promise.resolve(p));
// true
setTimeout(console.log, 0, p === Promise.resolve(Promise.resolve(p)));
// true
```

注意，这个静态方法能够包装任何非期约值，包括错误对象，并将其转换为解决的期约。

```js
let p = Promise.resolve(new Error('foo')); setTimeout(console.log, 0, p);
//Promise<resolved>: Error: foo
```

#### Promise.reject()

Promise.reject()会实例化一个拒绝的期约并抛出一个异步错误（这个错误不能通过try/catch捕获，而只能通过拒绝处理程序捕获）。

关键在于，`Promise.reject()`并没有照搬`Promise.resolve()`的幂等逻辑。如果给它传一个期约对象，则这个期约会成为它返回的拒绝期约的理由。

```js
setTimeout(console.log, 0, Promise.reject(Promise.resolve()));
// Promise <rejected>: Promise <resolved>
```

期约真正的异步特性：它们是同步对象（在同步执行模式中使用），但也是异步执行模式的媒介。比如下面的例子：
```js
try {
    thrownewError('foo');
  } catch(e) {
    console.log(e); // Error: foo
  }
  try {
    Promise.reject(newError('bar'));
  } catch(e) {
    console.log(e);
  }
  //Uncaught(inpromise)Error: bar
```

拒绝期约的错误并没有抛到执行同步代码的线程里，而是通过浏览器异步消息队列来处理的。因此，try/catch块并不能捕获该错误。代码一旦开始以异步模式执行，则唯一与之交互的方式就是使用异步结构——更具体地说，就是期约的方法。

期约可以以任何理由拒绝，包括undefined，但最好统一使用错误对象。这样做主要是因为创建错误对象可以让浏览器捕获错误对象中的**栈追踪信息**，而这些信息对调试是非常关键的。
### 期约的实例方法

期约实例的方法是连接外部同步代码与内部异步代码之间的桥梁。这些方法可以访问异步操作返回的数据，处理期约成功和失败的结果，连续对期约求值，或者添加只有期约进入终止状态时才会执行的代码。

#### Thenable接口

在ECMAScript暴露的异步结构中，任何对象都有一个`then()`方法。这个方法被认为实现了Thenable接口。

```js
class MyThenable {
	then() {}
}
```

#### Promise.prototype.then()

这个`then()`方法接收最多两个参数：`onResolved` 处理程序和`onRejected`处理程序。这两个参数都是可选的。传给then()的任何**非函数类型**的参数都会被静默忽略。

`Promise.prototype.then()`方法返回一个新的期约实例。
这个新期约实例基于`onResovled`处理程序的返回值构建。换句话说，该处理程序的返回值会通过`Promise.resolve()`包装来生成新期约。如果没有提供这个处理程序，则`Promise.resolve()`就会包装上一个期约解决之后的值。如果没有显式的返回语句，则`Promise.resolve()`会包装默认的返回值`undefined`。

`onRejected`处理程序也与之类似：`onRejected`处理程序返回的值也会被`Promise.resolve()`包装。

#### Promise.prototype.catch()

这个方法就是一个语法糖，调用它就相当于调用`Promise.prototype. then(null, onRejected)`。

#### Promise.prototype.finally()

`Promise.prototype.finally()`方法用于给期约添加`onFinally`处理程序，这个处理程序在期约转换为解决或拒绝状态时都会执行。这个方法可以避免`onResolved`和o`nRejected`处理程序中出现冗余代码。但`onFinally`处理程序没有办法知道期约的状态是解决还是拒绝，所以这个方法主要用于添加清理代码。

这个新期约实例不同于`then()`或`catch()`方式返回的实例。因为`onFinally`被设计为一个**状态无关**的方法，所以在大多数情况下它将表现为父期约的传递（父期约什么值，它就是什么值）。对于已解决状态和被拒绝状态都是如此。

特殊情况：
- 返回待定期约
- `onFinally`处理程序抛出了错误（显式抛出或返回了一个拒绝期约）

#### 非重入期约方法

“非重入”（non-reentrancy）特性保证了当期约进入落定状态时，与该状态相关的处理程序仅仅会被排期，而非立即执行。

```js
    let synchronousResolve;
    // 创建一个期约并将解决函数保存在一个局部变量中
    let p = new Promise((resolve) => {
      synchronousResolve = function() {
        console.log('1: invoking resolve()');
        resolve();
        console.log('2: resolve() returns');
      };
    });
    p.then(() => console.log('4: then() handler executes'));
    synchronousResolve();
    console.log('3: synchronousResolve() returns');
    // 实际的输出：
    //1: invokingresolve()
    // 2: resolve()returns
    // 3: synchronousResolve() returns
    // 4: then() handler executes
```


### 期约连锁与期约合成

把期约逐个地串联起来称为期约连锁。
要真正执行异步任务，可以让每个执行器都返回一个期约实例。这样就可以让每个后续期约都等待之前的期约，也就是**串行化异步任务**。

```js
let p1 = new Promise((resolve, reject) => {
  console.log('p1 executor');
  setTimeout(resolve, 1000);
});
p1.then(() => new Promise((resolve, reject) => {
    console.log('p2 executor');
    setTimeout(resolve, 1000);
  }))
  .then(() => new Promise((resolve, reject) => {
    console.log('p3 executor');
    setTimeout(resolve, 1000);
  }))
  .then(() => new Promise((resolve, reject) => {
    console.log('p4 executor');
    setTimeout(resolve, 1000);
  }));
// p1 executor（1 秒后）
// p2 executor（2 秒后）
// p3 executor（3 秒后）
// p4 executor（4 秒后）
```

把生成期约的代码提取到一个工厂函数中，就可以写成这样：

```js
function delayedResolve(str) {
  return new Promise((resolve, reject) => {
    console.log(str);
    setTimeout(resolve, 1000);
  });
}
delayedResolve('p1 executor')
  .then(() => delayedResolve('p2 executor'))
  .then(() => delayedResolve('p3 executor'))
  .then(() => delayedResolve('p4 executor'))
// p1 executor（1 秒后）
// p2 executor（2 秒后）
// p3 executor（3 秒后）
// p4 executor（4 秒后）
```

这种写法优化了之前的“回调地狱”问题：

```js
function delayedExecute(str, callback = null) {
  setTimeout(() => {
	console.log(str);
	callback && callback();
  }, 1000)
}
delayedExecute('p1 callback', () => {
  delayedExecute('p2 callback', () => {
	delayedExecute('p3 callback', () => {
	  delayedExecute('p4 callback');
	});
  });
});
// p1 callback（1 秒后）
// p2 callback（2 秒后）
// p3 callback（3 秒后）
// p4 callback（4 秒后）
```

#### Promise.all()和Promise.race()

`Promise.all()`静态方法创建的期约会在一组期约全部解决之后再解决。这个静态方法接收一个可迭代对象，返回一个新期约。

合成的期约只会在每个包含的期约都解决之后才解决。如果至少有一个包含的期约待定，则合成的期约也会待定。

如果有期约拒绝，则第一个拒绝的期约会将自己的理由作为合成期约的拒绝理由。之后再拒绝的期约不会影响最终期约的拒绝理由。不过，这并不影响所有包含期约正常的拒绝操作。合成的期约会静默处理所有包含期约的拒绝操作。

`Promise.race()`静态方法返回一个包装期约，是一组集合中最先解决或拒绝的期约的镜像。这个方法接收一个可迭代对象，返回一个新期约。无论是解决还是拒绝，只要是第一个落定的期约，`Promise.race()`就会包装其解决值或拒绝理由并返回新期约。

#### 串行期约合成

```js
function addTwo(x) {return x + 2; }
function addThree(x) {return x + 3; }
function addFive(x) {return x + 5; }
functioncompose(...fns){
  return(x)=>fns.reduce((promise, fn)=>promise.then(fn), Promise.resolve(x))
}
let addTen = compose(addTwo, addThree, addFive);
addTen(8).then(console.log); // 18
```

## 期约扩展

### 期约取消

```js
class CancelToken {
  constructor(cancelFn) {
	this.promise = new Promise((resolve, reject) => {
	  cancelFn(resolve);
	});
  }
}
```

```html
<button id="start">Start</button>
<button id="cancel">Cancel</button>
<script>
class CancelToken {
  constructor(cancelFn) {
	this.promise = new Promise((resolve, reject) => {
	  cancelFn(() => {
		setTimeout(console.log, 0, "delay cancelled");
		resolve();
	  });
	});
  }
}
const startButton = document.querySelector('#start');
const cancelButton = document.querySelector('#cancel');
function cancellableDelayedResolve(delay) {
  setTimeout(console.log, 0, "set delay");
  return new Promise((resolve, reject) => {
	const id = setTimeout((() => {
	  setTimeout(console.log, 0, "delayed resolve");
	  resolve();
	}), delay);
	const cancelToken = new CancelToken((cancelCallback) =>
	  cancelButton.addEventListener("click", cancelCallback));
	cancelToken.promise.then(() => clearTimeout(id));
  });
}
startButton.addEventListener("click", () => cancellableDelayedResolve(1000));
</script>
```

### 期约进度通知

扩展原有的 `Promise` 类：
```js
class TrackablePromise extends Promise {
  constructor(executor) {
    const notifyHandlers = []; // 储存通知回调函数
    super((resolve, reject) => { // 传递新的执行器函数
      return executor(resolve, reject, (status) => {
        notifyHandlers.map((handler) => handler(status));
      });
    });
    this.notifyHandlers = notifyHandlers;
  }
  notify(notifyHandler) {
    // 允许外部代码注册一个通知处理函数，该函数会在 executor 函数中的 notify 被调用时执行。
    console.log("previous", this.notifyHandlers);
    this.notifyHandlers.push(notifyHandler);
    console.log("after", this.notifyHandlers);
    return this; // 链式调用
  }
}
```

用法：

```js
let p = new TrackablePromise((resolve, reject, fn) => {
  function countdown(x) {
    if (x > 0) {
      fn(`${20 * x}% remaining`);
      setTimeout(() => countdown(x - 1), 1000);
    } else {
      resolve();
    }
  }
  countdown(5);
});
// 注册 notify handler 函数
p.notify((x) => setTimeout(console.log, 0, "progress:", x));
p.then(() => setTimeout(console.log, 0, "completed"));
```

上面的例子中只有 `notifyHandlers` 只注册了一个通知函数，但是因为 `notify` 支持链式调用，所以可以注册多个。

## 异步函数 async/await

使用`async`关键字可以让函数具有异步特征，但总体上其代码仍然是同步求值的。而在参数或闭包方面，异步函数仍然具有普通函数的正常行为。

不过，异步函数如果使用`return`关键字返回了值（如果没有`return`则会返回`undefined`），这个值会被`Promise.resolve()`包装成一个期约对象。异步函数始终返回期约对象。

异步函数的返回值期待（但实际上并不要求）一个实现`thenable`接口的对象，但常规的值也可以。如果返回的是实现`thenable`接口的对象，则这个对象可以由提供给`then()`的处理程序“解包”。如果不是，则返回值就被当作已经解决的期约。

```js
    // 返回一个原始值
    async function foo() {
      return 'foo';
    }
    foo().then(console.log);
    // foo
    // 返回一个没有实现thenable接口的对象
    async function bar() {
      return ['bar'];
    }
    bar().then(console.log);
    // ['bar']
    // 返回一个实现了thenable接口的非期约对象
    async function baz() {
      const thenable={
        then(callback){callback('baz');}
      };
      return thenable;
    }
    baz().then(console.log);
    // baz
    // 返回一个期约
    async function qux() {
      return Promise.resolve('qux');
    }
    qux().then(console.log); // 返回期约等效于返回期约的值
    // qux
```

与在期约处理程序中一样，在异步函数中抛出错误会返回拒绝的期约：
```js
    async function foo() {
      console.log(1);
      throw 3;
    }
    // 给返回的期约添加一个拒绝处理程序
    foo().catch(console.log);
    console.log(2);
    // 1
    // 2
    // 3
```

`await`关键字会暂停执行异步函数后面的代码，让出JavaScript运行时的执行线程。这个行为与生成器函数中的yield关键字是一样的。`await`关键字同样是尝试“解包”对象的值，然后将这个值传给表达式，再异步恢复异步函数的执行。

`await`关键同样字期待一个实现`thenable`接口的对象，则这个对象可以由`await`来“解包”。

注意：对拒绝的期约使用`await`则会释放（unwrap）错误值（**将拒绝期约返回**）。

```js
    async function foo() {
      console.log(1);
      await Promise.reject(3);
      console.log(4); // 这行代码不会执行！
    }
    // 给返回的期约添加一个拒绝处理程序
    foo().catch(console.log);
    console.log(2);
    // 1
    // 2
    // 3
```

JavaScript运行时在碰到`await`关键字时，会记录在哪里暂停执行。等到`await`右边的值可用了，JavaScript运行时会向**消息队列**中推送一个任务，这个任务会恢复异步函数的执行。

```js
    async function foo() {
      console.log(await Promise.resolve('foo'));
    }
    async function bar() {
      console.log(await 'bar'); // 等价于await Promise.resolve('bar')
    }
    async function baz() {
      console.log('baz');
    }
    foo();
    bar();
    baz();
    // baz
    // foo
	// bar
```

```js
    async function foo() {
      console.log(2);
      await null;
      console.log(4);
    }
    console.log(1);
    foo();
    console.log(3);
    // 1
    // 2
    // 3
    // 4
```

### 栈追踪与内存管理

```js
    function fooPromiseExecutor(resolve, reject) {
      setTimeout(reject, 1000, 'bar');
    }
    function foo() {
      new Promise(fooPromiseExecutor);
    }
    foo();
    // Uncaught (in promise) bar
    //    setTimeout
    //    setTimeout (async)
    //   fooPromiseExecutor
    //   foo
```

栈追踪信息应该相当直接地表现JavaScript引擎当前栈内存中函数调用之间的嵌套关系。在超时处理程序执行时和拒绝期约时，我们看到的错误信息包含嵌套函数的标识符，那是被调用以创建最初期约实例的函数。
可是，我们知道这些函数已经返回了，因此栈追踪信息中不应该看到它们。但是因为JavaScript引擎会在创建期约时尽可能保留完整的调用栈。当然，这意味着栈追踪信息会占用内存，从而带来一些计算和存储成本。

```js
    function fooPromiseExecutor(resolve, reject) {
      setTimeout(reject, 1000, 'bar');
    }
    asyncfunction foo() {
      awaitnew Promise(fooPromiseExecutor);
    }
    foo();
    // Uncaught (in promise) bar
    //   foo
    //   asyncfunction(async)
    //   foo
```
如果是异步的话，`fooPromiseExecutor()`已经返回，所以它不在错误信息中。但`foo()`此时被挂起了，并没有退出。JavaScript运行时可以简单地在嵌套函数中存储指向包含函数的指针，就跟对待同步函数调用栈一样。这个指针实际上存储在内存中，可用于在出错时生成栈追踪信息。这样就不会像之前的例子那样带来额外的消耗，因此在重视性能的应用中是可以优先考虑的。
