---
title: 学习笔记 | JS 高级程序设计-第6章-集合引用类型
pubDate: 2024-03-01 22:03:00.0
updated: 2024-03-01 22:03:00.0
categories: ['学习笔记']
tags: ['TS',  '网站开发']
description: '整理一下之前的笔记，当做复习。'
---

## Object

在使用对象字面量表示法定义对象时，并不会实际调用Object构造函数。

## Array

数组中每个槽位可以存储任意类型的数据。这意味着可以创建一个数组，它的第一个元素是字符串，第二个元素是数值，第三个是对象。ECMAScript数组也是动态大小的，会随着数据添加而自动增长。

在使用Array构造函数时，也可以省略new操作符。

Array构造函数还有两个ES6新增的用于创建数组的静态方法：

- from()用于将类数组结构转换为数组实例
- of()用于将一组参数转换为数组实例。

Array.from()还接收第二个可选的映射函数参数。这个函数可以直接增强新数组的值，而无须像调用Array.from().map()那样先创建一个中间数组。
还可以接收第三个可选参数，用于指定映射函数中this的值。但这个重写的this值在箭头函数中不适用。

```js
    const a1 = [1, 2, 3, 4];
    const a2 = Array.from(a1, x => x ＊＊ 2);
    const a3 = Array.from(a1, function(x) {return x ＊＊ this.exponent}, {exponent: 2});
    console.log(a2);   // [1, 4, 9, 16]
    console.log(a3);   // [1, 4, 9, 16]
```

- 数组length属性的独特之处在于，它不是只读的。**通过修改length属性**，可以从数组末尾删除或添加元素。
- Array.isArray()判断是否是数组
- 在ES6中，Array的原型上暴露了3个用于检索数组内容的方法：keys()、values()和entries()。keys()返回数组索引的迭代器，values()返回数组元素的迭代器，而entries()返回索引/值对的迭代器
- ES6新增了两个方法：
	- 批量复制方法copyWithin() 会按照指定范围浅复制数组中的部分内容，然后将它们插入到指定索引开始的位置。开始索引和结束索引则与fill()使用同样的计算方法：
	- 填充数组方法fill()，负值索引从数组末尾开始计算，静默忽略超出数组边界、零长度及方向相反的索引范围
- reverse()和sort()都返回调用它们的数组的引用

### 补充：fill的运行逻辑

在算法中，比如需要创建一个长度为n的二维数组作为初始化，如果是如下写法会导致意外情况：

```js
const res: string[][] = new Array(numRows).fill([]);
// 或者
const res: string[][] = new Array(numRows).fill(new Array<string>());
```

这是因为fill实际上会先创建一个实例，然后再把这个实例赋给每一个子项，也就是说每一项都共享同一个引用。
因此正规写法应该是：

```js
const res: string[][] = new Array(numRows).fill(0).map(_ => new Array<string>());
```

### concat

打平数组参数的行为可以重写，方法是在参数数组上指定一个特殊的符号：`Symbol.isConcatSpreadable`。这个符号能够阻止`concat()`打平参数数组。相反，把这个值设置为true可以强制打平类数组对象：

```js
    let colors = ["red", "green", "blue"];
    let newColors = ["black", "brown"];
    let moreNewColors = {
      [Symbol.isConcatSpreadable]: true,
      length: 2,
      0: "pink",
      1: "cyan"
    };
    newColors[Symbol.isConcatSpreadable] = false;
    // 强制不打平数组
    let colors2 = colors.concat("yellow", newColors);
    // 强制打平类数组对象
    let colors3 = colors.concat(moreNewColors);
    console.log(colors);    // ["red", "green", "blue"]
    console.log(colors2);   // ["red", "green", "blue", "yellow", ["black", "brown"]]
    console.log(colors3);   // ["red", "green", "blue", "pink", "cyan"]
```

### splice

- 删除。需要给splice()传2个参数：要删除的第一个元素的位置和要删除的元素数量。可以从数组中删除任意多个元素，比如splice(0,2)会删除前两个元素。
- 插入。需要给splice()传3个参数：开始位置、0（要删除的元素数量）和要插入的元素，可以在数组中指定的位置插入元素。第三个参数之后还可以传第四个、第五个参数，乃至任意多个要插入的元素。比如，splice(2,0, "red", "green")会从数组位置2开始插入字符串"red"和"green"。
- 替换。splice()在删除元素的同时可以在指定位置插入新元素，同样要传入3个参数：开始位置、要删除元素的数量和要插入的任意多个元素。要插入的元素数量不一定跟删除的元素数量一致。比如，splice(2, 1, "red","green")会在位置2删除一个元素，然后从该位置开始向数组中插入"red"和"green"。

splice()方法始终返回这样一个数组，它包含从数组中被删除的元素（如果没有删除元素，则返回空数组）。

```js
    let colors = ["red", "green", "blue"];
    let removed = colors.splice(0,1);   // 删除第一项
    alert(colors);                          // green, blue
    alert(removed);                         // red，只有一个元素的数组
    removed = colors.splice(1, 0, "yellow", "orange");    // 在位置1 插入两个元素
    alert(colors);                                                 // green, yellow, orange, blue
    alert(removed);                                                // 空数组
    removed = colors.splice(1, 1, "red", "purple");   // 插入两个值，删除一个元素
    alert(colors);                                            // green,red,purple,orange,blue
    alert(removed);                                           // yellow，只有一个元素的数组
```

reduce()方法从数组第一项开始遍历到最后一项。而reduceRight()从最后一项开始遍历至第一项。
这两个方法都接收两个参数：

1. 对每一项都会运行的归并函数
2. 可选的以之为归并起点的初始值。

传给reduce()和reduceRight()的函数接收4个参数：上一个归并值、当前项、当前项的索引和数组本身。这个函数返回的任何值都会作为下一次调用同一个函数的第一个参数。如果没有给这两个方法传入可选的第二个参数（作为归并起点值），则第一次迭代将从数组的第二项开始，因此传给归并函数的第一个参数是数组的第一项，第二个参数是数组的第二项。

```js
    let values = [1, 2, 3, 4, 5];
    let sum = values.reduce((prev, cur, index, array) => prev + cur);
    alert(sum);   // 15
```

## Map

set()方法返回映射实例，因此可以把多个操作连缀起来

### Object与Map对比

1. 内存占用，Map更加节约空间
2. 插入性能，差不多，Map略微快一点
3. 查找性能，几乎一致。如果键值对数量少或者使用连续整数，Object快一点。
4. 删除性能，完爆Object

### WeakMap

弱映射中的键只能是Object或者继承自Object的类型，尝试使用非对象设置键会抛出TypeError。值的类型没有限制。

WeakMap中“weak”表示弱映射的键不属于正式的引用，不会阻止垃圾回收。
但要注意的是，值并不weak，只要键存在，键/值对就会存在于映射中，并被当作对值的引用，因此就不会被当作垃圾回收。

```js
    const wm = new WeakMap();
    const container = {
      key: {}
    };
    wm.set(container.key, "val");
    function removeReference() {
      container.key = null;
    }
```

WeakMap实例之所以限制只能用对象作为键，是为了保证只有通过键对象的引用才能取得值。如果允许原始值，那就没办法区分初始化时使用的字符串字面量和初始化之后使用的一个相等的字符串了。

一些应用：

1. 私有变量。私有变量会存储在弱映射中，以对象实例为键，以私有成员的字典为值。
2. DOM节点元数据。因为WeakMap实例不会妨碍垃圾回收，所以非常适合保存关联元数据。

## Set

- add()和delete()操作是幂等的。delete()返回一个布尔值，表示集合中是否存在要删除的值
- Set会维护值插入时的顺序，因此支持按顺序迭代
- 因为values()是默认迭代器，所以可以直接对集合实例使用扩展操作，把集合转换为数组
- 集合的entries()方法返回一个迭代器，可以按照插入顺序产生包含两个元素的数组，这两个元素是集合中每个值的重复出现

### WeakSet

类似WeakMap，存的是弱值
