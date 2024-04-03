---
title: 学习笔记 | JS 高级程序设计-第4章-变量、作用域与内存
pubDate: 2024-03-01 22:01:00.0
updated: 2024-03-01 22:01:00.0
categories: ['学习笔记']
tags: ['TS',  'Web开发']
description: '整理一下之前的笔记，当做复习。'
---

## 原始值与引用值

- 原始值大小固定，因此保存在栈内存上
- 从一个变量到另一个变量复制原始值会创建该值的第二个副本
- 引用值是对象，存储在堆内存上
- 包含引用值的变量实际上只包含指向相应对象的一个指针，而不是对象本身

原始值不能有属性，尽管尝试给原始值添加属性不会报错。

```js
    let name = "Nicholas";
    name.age = 27;
    console.log(name.age);   // undefined
```

原始类型的初始化可以只使用原始字面量形式。如果使用的是new关键字，则JavaScript会创建一个Object类型的实例，但其行为类似原始值。

```js
    let name1 = "Nicholas";
    let name2 = new String("Matt");
    name1.age = 27;
    name2.age = 26;
    console.log(name1.age);     // undefined
    console.log(name2.age);     // 26
    console.log(typeof name1); // string
    console.log(typeof name2); // object
```

所有函数参数都是按值传递，也就是复制一份值。如果值是引用则复制一份引用值，两个变量指向同一个引用。

```js
    function setName(obj) {
      obj.name = "Nicholas";
      obj=newObject();
      obj.name="Greg";
    }
    let person = new Object();
    setName(person);
    console.log(person.name);   // "Nicholas"
```

`typeof` 判断 `null` 会判断为 `object`：

```js
    let s = "Nicholas";
    let b = true;
    let i = 22;
    let u;
    let n = null;
    let o = new Object();
    console.log(typeof s); // string
    console.log(typeof i); // number
    console.log(typeof b); // boolean
    console.log(typeof u); // undefined
    console.log(typeof n); // object
    console.log(typeof o); // object
```

## 执行上下文与作用域

每个函数调用都有自己的上下文。当代码执行流进入函数时，函数的上下文被推到一个上下文栈上。在函数执行完之后，上下文栈会弹出该函数上下文，将控制权返还给之前的执行上下文。ECMAScript程序的执行流就是通过这个上下文栈进行控制的。

代码执行时的标识符解析是通过沿作用域链逐级搜索标识符名称完成的。搜索过程始终从作用域链的最前端开始，然后逐级往后，直到找到标识符。

执行上下文主要有全局上下文和函数上下文两种（eval()调用内部存在第三种上下文），但有其他方式来增强作用域链：
1. try/catch语句的catch块（包含要抛出的错误对象的声明的变量对象）
2. with语句（向作用域链前端添加指定的对象）

### 变量声明

在使用var声明变量时，变量会被自动添加到最接近的上下：
- 在函数中，最接近的上下文就是函数的局部上下文
- 在with语句中，最接近的上下文也是函数上下文
- 如果变量未经声明就被初始化了，那么它就会自动被添加到全局上下文

`let` 是块级作用域，由最近的一对 `{}` 界定。同一作用域重复的块会报错。

对于`const`，如果想让整个对象都不能修改，可以使用`Object.freeze()`，这样再给属性赋值时虽然不会报错，但会静默失败。

## 垃圾回收

### 标记清理

mark-and-sweep：当变量进入上下文，比如在函数内部声明一个变量时，这个变量会被加上存在于上下文中的标记。

给变量加标记的方式有很多种。比如，当变量进入上下文时，反转某一位；或者可以维护“在上下文中”和“不在上下文中”两个变量列表，可以把变量从一个列表转移到另一个列表。

垃圾回收程序运行的时候，会标记内存中存储的所有变量。然后，它会将所有在上下文中的变量，以及被在上下文中的变量引用的变量的标记去掉。在此之后再被加上标记的变量就是待删除的了，原因是任何在上下文中的变量都访问不到它们了。随后垃圾回收程序做一次内存清理，销毁带标记的所有值并收回它们的内存。

### 引用计数

其思路是对每个值都记录它被引用的次数。声明变量并给它赋一个引用值时，这个值的引用数为1。如果同一个值又被赋给另一个变量，那么引用数加1。类似地，如果保存对该值引用的变量被其他值给覆盖了，那么引用数减1。当一个值的引用数为0时，就说明没办法再访问到这个值了，因此可以安全地收回其内存了。垃圾回收程序下次运行的时候就会释放引用数为0的值的内存。

```js
    function problem() {
      let objectA = new Object();
      let objectB = new Object();
      objectA.someOtherObject = objectB;
      objectB.anotherObject = objectA;
    }
```

循环引用问题会导致内存无法释放。

### 性能

现代垃圾回收程序会基于对JavaScript运行时环境的探测来决定何时运行。探测机制因引擎而异，但基本上都是根据已分配对象的大小和数量来判断的。比如，根据V8团队2016年的一篇博文的说法：“在一次完整的垃圾回收之后，V8的堆增长策略会根据活跃对象的数量外加一些余量来确定何时再次垃圾回收。”

将内存占用量保持在一个较小的值可以让页面性能更好。优化内存占用的最佳手段就是保证在执行代码时只保存必要的数据。如果数据不再必要，那么把它设置为null，从而释放其引用。这也可以叫作解除引用。这个建议最适合全局变量和全局对象的属性。局部变量在超出作用域后会被自动解除引用。

#### 隐藏类和删除操作

运行期间，V8会将创建的对象与隐藏类关联起来，以跟踪它们的属性特征。能够共享相同隐藏类的对象性能会更好，V8会针对这种情况进行优化，但不一定总能够做到。比如下面的代码：

```js
    function Article() {
      this.title = 'Inauguration Ceremony Features Kazoo Band';
    }
    let a1 = new Article();
    let a2 = new Article();
```

V8会在后台配置，让这两个类实例**共享相同的隐藏类**，因为这两个实例共享同一个构造函数和原型。但是如果对其中一个实例进行了修改，那么他们就会对应不同的隐藏类。

解决方案就是避免JavaScript的“先创建再补充”（ready-fire-aim）式的动态属性赋值，并在构造函数中一次性声明所有属性:

```js
    function Article(opt_author) {
      this.title = 'Inauguration Ceremony Features Kazoo Band';
      this.author = opt_author;
    }
    let a1 = new Article();
    let a2 = new Article('Jake');
```

删除和增加类似，因此最佳实践是把不想要的属性设置为null。这样可以保持隐藏类不变和继续共享，同时也能达到删除引用值供垃圾回收程序回收的效果：

```js
    function Article() {
      this.title = 'Inauguration Ceremony Features Kazoo Band';
      this.author = 'Jake';
    }
    let a1 = new Article();
    let a2 = new Article();
    a1.author = null;
```

### 内存泄漏

调用outer()会导致分配给name的内存被泄漏。以上代码执行后创建了一个内部闭包，只要返回的函数存在就不能清理name，因为闭包一直在引用着它。
```js
    let outer = function() {
      let name = 'Jake';
      return function() {
        return name;
      };
    };
```

#### 静态分配与对象池

```js
    function addVector(a, b) {
      let resultant = new Vector();
      resultant.x = a.x + b.x;
      resultant.y = a.y + b.y;
      return resultant;
    }
```

调用这个函数时，会在堆上创建一个新对象，然后修改它，最后再把它返回给调用者。如果这个矢量对象的生命周期很短，那么它会很快失去所有对它的引用，成为可以被回收的值。假如这个矢量加法函数频繁被调用，那么垃圾回收调度程序会发现这里对象更替的速度很快，从而会更频繁地安排垃圾回收。

该问题的解决方案是不要动态创建矢量对象，比如可以修改上面的函数，让它使用一个已有的矢量对象：

```js
    function addVector(a, b, resultant) {
      resultant.x = a.x + b.x;
      resultant.y = a.y + b.y;
      return resultant;
    }
```

但是这需要在其他地方实例化矢量参数resultant，但这个函数的行为没有变。那么在哪里创建矢量可以不让垃圾回收调度程序盯上呢？

一个策略是使用对象池（注意，可能是过早优化）。在初始化的某一时刻，可以创建一个对象池，用来管理一组可回收的对象。应用程序可以向这个对象池请求一个对象、设置其属性、使用它，然后在操作完成后再把它还给对象池。

```js
    // vectorPool是已有的对象池
    let v1 = vectorPool.allocate();
    let v2 = vectorPool.allocate();
    let v3 = vectorPool.allocate();
    v1.x = 10;
    v1.y = 5;
    v2.x = -3;
    v2.y = -6;
    addVector(v1, v2, v3);
    console.log([v3.x, v3.y]); // [7, -1]
    vectorPool.free(v1);
    vectorPool.free(v2);
    vectorPool.free(v3);
    // 如果对象有属性引用了其他对象
    // 则这里也需要把这些属性设置为null
    v1 = null;
    v2 = null;
    v3 = null;
```

如果对象池只按需分配矢量（在对象不存在时创建新的，在对象存在时则复用存在的），那么这个实现本质上是一种贪婪算法，有单调增长但为静态的内存。这个对象池必须使用某种结构维护所有对象，数组是比较好的选择。

不过，使用数组来实现，必须留意不要招致额外的垃圾回收。比如下面这个例子：

```js
    let vectorList = new Array(100);
    let vector = new Vector();
    vectorList.push(vector);
```

数组大小可变，会先移除一个100的数组，在新建一个200的数组，很容易导致GC。
