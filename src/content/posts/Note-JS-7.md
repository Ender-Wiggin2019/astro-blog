---
title: 学习笔记 | JS 高级程序设计-第7章-迭代器与生成器
pubDate: 2024-03-03 22:03:00.0
updated: 2024-03-03 22:03:00.0
categories: ['学习笔记']
tags: ['TS',  '网站开发']
description: '整理一下之前的笔记，当做复习。'
---

## 迭代器

ES6 之后支持。

任何实现Iterable接口的数据结构都可以被实现Iterator接口的结构“消费”（consume）。迭代器（iterator）是按需创建的一次性对象。每个迭代器都会关联一个可迭代对象，而迭代器会暴露迭代其关联可迭代对象的API。迭代器无须了解与其关联的可迭代对象的结构，只需要知道如何取得连续的值。这种概念上的分离正是Iterable和Iterator的强大之处。

### 可迭代协议

同时具备两种能力：

1. 支持迭代的自我识别能力
2. 创建实现Iterator接口的对象的能力

这会暴露一个属性作为“默认迭代器”，而且这个属性必须使用特殊的Symbol.iterator作为键。这个默认迭代器属性必须引用一个迭代器工厂函数，调用这个工厂函数必须返回一个新迭代器。

### 迭代器协议

`next()`方法返回的迭代器对象`IteratorResult`包含两个属性：

- `done`是一个布尔值，表示是否还可以再次调用`next()`取得下一个值。`done: true`状态称为“耗尽”。
- `value`包含可迭代对象的下一个值（`done`为`false`），或者undefined（done为true）。

注意，迭代器维护着一个指向可迭代对象的引用，因此迭代器会阻止垃圾回收程序回收可迭代对象。

显式的迭代器实现：

```js
    // 这个类实现了可迭代接口（Iterable）
    // 调用默认的迭代器工厂函数会返回
    // 一个实现迭代器接口（Iterator）的迭代器对象
    class Foo {
      [Symbol.iterator]() {
        return {
          next() {
            return { done: false, value: 'foo' };
          }
        }
      }
    }
    let f = new Foo();
    // 打印出实现了迭代器接口的对象
    console.log(f[Symbol.iterator]()); // { next: f() {} }
    // Array类型实现了可迭代接口（Iterable）
    // 调用Array类型的默认迭代器工厂函数
    // 会创建一个ArrayIterator的实例
    let a = new Array();
    // 打印出ArrayIterator的实例
    console.log(a[Symbol.iterator]()); // Array Iterator {}
```

### 自定义迭代器

```js
    class Counter {
      // Counter的实例应该迭代limit次
      constructor(limit) {
        this.count = 1;
        this.limit = limit;
      }
      next() {
        if (this.count <= this.limit) {
          return { done: false, value: this.count++ };
        } else {
          return { done: true, value: undefined };
        }
      }
      [Symbol.iterator]() {
        return this;
      }
    }
    let counter = new Counter(3);
    for (let i of counter) {
      console.log(i);
    }
    // 1
    // 2
    // 3
```

但是，上面的构造中，每个实例只能被迭代一次。因此需要使用闭包：

```js
    class Counter {
      constructor(limit) {
        this.limit = limit;
      }
      [Symbol.iterator]() {
        let count=1,
            limit=this.limit;
        return{
          next(){
            if(count<=limit){
              return{done: false, value: count++};
            }else{
              return{done: true, value: undefined};
            }
          }
        };
      }
    }
    let counter = new Counter(3);
    for (let i of counter) { console.log(i); }
    // 1
    // 2
    // 3
    for (let i of counter) { console.log(i); }
    // 1
    // 2
    // 3
```

因为每个迭代器也实现了Iterable接口，所以它们可以用在任何期待可迭代对象的地方，比如for-of循环：

```js
    let arr = [3, 1, 4];
    let iter = arr[Symbol.iterator]();
    for (let item of arr) { console.log(item); }
    // 3
    // 1
    // 4
    for (let item of iter) { console.log(item); }
    // 3
    // 1
    // 4
```

### 提前终止迭代器

可选的return()方法用于指定在迭代器提前关闭时执行的逻辑，必须返回一个有效的IteratorResult对象。简单情况下，可以只返回{ done: true }。

例如在上面的例子中，可以加入如下函数：

```js
//...
return() {
	return {done: true};
}
```

因为return()方法是可选的，所以并非所有迭代器都是可关闭的。要知道某个迭代器是否可关闭，可以测试这个迭代器实例的return属性是不是函数对象。不过，仅仅给一个不可关闭的迭代器增加这个方法并不能让它变成可关闭的。这是因为调用return()不会强制迭代器进入关闭状态。即便如此，return()方法还是会被调用。

```js
    let a = [1, 2, 3, 4, 5];
    let iter = a[Symbol.iterator]();
    iter.return=function(){
      console.log('Exitingearly');
      return{done: true};
    };
    for (let i of iter) {
      console.log(i);
      if (i > 2) {
        break
      }
    }
    // 1
    // 2
    // 3
    //提前退出
    for (let i of iter) {
      console.log(i);
    }
    // 4
    // 5
```

## 生成器

生成器是ECMAScript 6新增的一个极为灵活的结构，拥有在一个函数块内暂停和恢复代码执行的能力。

生成器的形式是一个函数，函数名称前面加一个星号（＊）表示它是一个生成器。只要是可以定义函数的地方，就可以定义生成器。但是**箭头函数不能用来定义生成器函数**。

调用生成器函数会产生一个生成器对象。生成器对象一开始处于暂停执行（suspended）的状态。与迭代器相似，生成器对象也实现了Iterator接口，因此具有next()方法。调用这个方法会让生成器开始或恢复执行。

生成器对象实现了Iterable接口，它们默认的迭代器是自引用的：

```js
    function＊ generatorFn() {}
    console.log(generatorFn);
    // f＊ generatorFn() {}
    console.log(generatorFn()[Symbol.iterator]);
    // f [Symbol.iterator]() {native code}
    console.log(generatorFn());
    // generatorFn {<suspended>}
    console.log(generatorFn()[Symbol.iterator]());
    // generatorFn {<suspended>}
    const g = generatorFn();
    console.log(g === g[Symbol.iterator]());
    // true
```

### 通过yield中断执行

yield关键字可以让生成器停止和开始执行，也是生成器最有用的地方。生成器函数在遇到yield关键字之前会正常执行。遇到这个关键字后，执行会停止，函数作用域的状态会被保留。停止执行的生成器函数只能通过在生成器对象上调用next()方法来恢复执行。

通过yield关键字退出的生成器函数会处在done: false状态；通过return关键字退出的生成器函数会处于done: true状态。

```js
    function＊ generatorFn() {
      yield 1;
      yield 2;
      yield 3;
    }
    for (const x of generatorFn()) {
      console.log(x);
    }
```

除了可以作为函数的中间返回语句使用，yield关键字还可以作为函数的中间参数使用。上一次让生成器函数暂停的yield关键字会接收到传给next()方法的第一个值。

注意，第一次调用next()传入的值不会被使用，因为这一次调用是为了开始执行生成器函数：

```js
    function＊ generatorFn(initial) {
      console.log(initial);
      console.log(yield);
      console.log(yield);
    }
    let generatorObject = generatorFn('foo');
    generatorObject.next('bar');  //foo
    generatorObject.next('baz');   // baz
    generatorObject.next('qux');   // qux
```

调用`generatorObject.next('bar')`时，由于这是第一次调用`next`方法，传入的参数并不会发送给Generator函数。这是因为Generator函数的执行上下文尚未建立，所以传给第一次`next`方法的参数会被忽略。此调用会执行到第一个`yield`处，打印出`'foo'`（因为这是Generator函数接收到的初始参数），然后函数暂停执行。

可以通过生成器快速实现`range`：

```js
    function＊ range(start, end) {
      while(end > start) {
        yield start++;
      }
    }
    for (const x of range(4, 7)) {
      console.log(x);
    }
    // 4
    // 5
    // 6
    function＊ zeroes(n) {
      while(n--) {
        yield 0;
      }
    }
    console.log(Array.from(zeroes(8))); // [0, 0, 0, 0, 0, 0, 0, 0]
```

可以使用星号增强yield的行为，让它能够迭代一个可迭代对象，从而一次产出一个值：

```js
    function＊ generatorFn() {
      yield＊[1, 2];
      yield＊[3, 4];
      yield＊[5, 6];
    }
    for (const x of generatorFn()) {
      console.log(x);
    }
```

**注意**，`yield＊`的值是关联迭代器返回`done: true`时的`value`属性。对于普通迭代器来说，这个值是`undefined`：

```js
    function＊ generatorFn() {
      console.log('iter value:', yield＊ [1, 2, 3]);
    }
    for (const x of generatorFn()) {
      console.log('value:', x);
    }
    // value: 1
    // value: 2
    // value: 3
    //itervalue: undefined
```

对于生成器函数产生的迭代器来说，这个值就是**生成器函数返回的值**。

yield＊最有用的地方是实现递归操作：

```js
    function＊ nTimes(n) {
      if (n > 0) {
        yield ＊ nTimes(n-1);
        yield n-1;
      }
    }
```

图数据结构非常适合递归遍历，而递归生成器恰好非常合用。为此，生成器函数必须接收一个可迭代对象，产出该对象中的每一个值，并且对每个值进行递归。这个实现可以用来测试某个图是否连通，即是否没有不可到达的节点。只要从一个节点开始，然后尽力访问每个节点就可以了。

### 提前终止生成器

与迭代器类似，生成器也支持“可关闭”的概念。一个实现Iterator接口的对象一定有next()方法，还有一个可选的return()方法用于提前终止迭代器。生成器对象除了有这两个方法，还有第三个方法：throw()。

```js
    function＊ generatorFn() {
      for (const x of [1, 2, 3]) {
        yield x;
      }
    }
    const g = generatorFn();
    console.log(g.next());      // { done: false, value: 1 }
    console.log(g.return(4));   // { done: true, value: 4 }
    console.log(g.next());      // { done: true, value: undefined }
```

与迭代器不同，所有生成器对象都有return()方法，只要通过它进入关闭状态，就无法恢复了。后续调用next()会显示done: true状态，而提供的任何返回值都不会被存储或传播。

throw()方法会在暂停的时候将一个提供的错误注入到生成器对象中。如果错误未被处理，生成器就会关闭。
假如生成器函数内部处理了这个错误，那么生成器就不会关闭，而且还可以恢复执行。错误处理会跳过对应的yield，因此在这个例子中会跳过一个值。比如：

```js
    function＊ generatorFn() {
      for (const x of [1, 2, 3]) {
        try {
          yield x;
        } catch(e) {}
      }
    }
    const g = generatorFn();
    console.log(g.next()); // { done: false, value: 1}
    g.throw('foo');
    console.log(g.next()); // { done: false, value: 3}
```

注意,如果生成器对象还没有开始执行，那么调用throw()抛出的错误不会在函数内部被捕获，因为这**相当于在函数块外部抛出了错误**。
