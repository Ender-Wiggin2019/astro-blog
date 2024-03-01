---
title: 学习笔记 | JS 高级程序设计-第5章-基本引用类型
pubDate: 2024-03-01 22:02:00.0
updated: 2024-03-01 22:02:00.0
categories: ['学习笔记']
tags: ['TS',  '网站开发']
description: '整理一下之前的笔记，当做复习。'
---

## RegExp

```js
    let expression = /pattern/flags;
    // 也可以
    let pattern = new RegExp("[bc]at", "i");
```

每个正则表达式可以带零个或多个flags（标记），用于控制正则表达式的行为：

- g：全局模式，表示查找字符串的全部内容，而不是找到第一个匹配的内容就结束
- i：不区分大小写，表示在查找匹配时忽略pattern和字符串的大小写
- m：多行模式，表示查找到一行文本末尾时会继续查找
- y：粘附模式，表示只查找从lastIndex开始及之后的字符串
- u: Unicode模式，启用Unicode匹配
- s:dotAll模式，表示元字符．匹配任何字符（包括`\n`或`\r`）。

### 实例方法

- `exec()`，返回的是包含匹配项的array，以及额外属性`index`和`input`。
- `test()`，返回布尔值

## 原始值包装类型

每当用到某个原始值的方法或属性时，后台都会创建一个相应原始包装类型的对象，从而暴露出操作原始值的各种方法。大致流程如下：

1. 创建一个String类型的实例
2. 调用实例上的特定方法
3. 销毁实例（执行完当前行代码后立刻销毁）

另外，Object构造函数作为一个工厂方法，能够根据传入值的类型返回相应原始值包装类型的实例。比如：

```js
    let obj = new Object("some text");
    console.log(obj instanceof String);   // true
```

使用new调用原始值包装类型的构造函数，与调用同名的转型函数并不一样。
```js
    let value = "25";
    let number = Number(value);     // 转型函数
    console.log(typeof number);     // "number"
    let obj = new Number(value);    // 构造函数
    console.log(typeof obj);         // "object"
```

如果想得到数值最适当的形式，那么可以使用toPrecision()。

```js
    let num = 99;
    console.log(num.toPrecision(1));//"1e+2"
    console.log(num.toPrecision(2));//"99"
    console.log(num.toPrecision(3));//"99.0"
```

#### Number

Number.isInteger()方法，用于辨别一个数值是否保存为整数。
Number.isSafeInteger()可以判断数字是否在 IEEE754 安全范围之内。

#### String

```js
    let message = "abcde";
    console.log(message.charAt(2)); // "c"

    // Unicode "Latin small letter C"的编码是U+0063
    console.log(message.charCodeAt(2));   // 99
    // 十进制99 等于十六进制63
    console.log(99 === 0x63);               // true
```

- `fromCharCode()`方法用于根据给定的UTF-16码元创建字符串中的字符。
- 改成`CodePoint`码点可以适配多字符情况。
- `normalize()`加上对应方法可以比对字符是否实质相同

##### 字符串操作方法

- `cancat` 或者 `+`
- `slice/substring(start, end)` 不包括end
	- `slice` 负数将所有负值参数都当成字符串长度加上负参数值
	- `substring` 所有负数均为0
- `substr(start, len)`(第二个参数负数时视为0)

##### 字符串位置方法

- `indexOf`
- `lastIndexOf`

都包含可选的第二个参数，表示开始搜索的位置

##### 字符串包含方法

- `startsWith` 包含可选的第二个参数，表示开始搜索的位置
- `endsWith` 包含可选的第二个参数，表示应该当作字符串末尾的位置
- `includes` 包含可选的第二个参数，表示开始搜索的位置

##### 一些其它方法

- `trim()`
- `trimLeft()`
- `trimRight()`

返回的均为副本

- `repeat(times)` 重复
- `padStart()`和`padEnd()`方法会复制字符串，如果小于指定长度，则在相应一边填充字符，直至满足长度条件。这两个方法的第一个参数是长度，第二个参数是可选的填充字符串，默认为空格。
- `match(pattern)` 类似RegExp的exec
- `search(pattern)` 返回找到的第一个位置或者-1
- `replace(str, repaceStrOrFunc)` 第一个参数可以是正则，第二个参数是函数时可以执行额外操作
- `split`，可选第二个参数是数组大小，确保返回的数组不会超过指定大小

##### 字符串迭代与解构

字符串的原型上暴露了一个`@@iterator`方法，表示可以迭代字符串的每个字符。可以像下面这样手动使用迭代器：

```js
    let message = "abc";
    let stringIterator = message[Symbol.iterator]();
    console.log(stringIterator.next());   // {value: "a", done: false}
    console.log(stringIterator.next());   // {value: "b", done: false}
    console.log(stringIterator.next());   // {value: "c", done: false}
    console.log(stringIterator.next());   // {value: undefined, done: true}

	// 或者 for...of
```

## 单例内置对象

### Global

Global对象是ECMAScript中最特别的对象，因为代码不会显式地访问它。

- encodeURI()和encodeURIComponent()方法用于编码统一资源标识符（URI）
- eval()调用时，会将参数解释为实际的ECMAScript语句，然后将其插入到该位置。通过eval()定义的任何变量和函数都不会被提升，这是因为在解析代码的时候，它们是被包含在一个字符串中的。它们只是在eval()执行的时候才会被创建。

浏览器将window对象实现为Global对象的代理。因此，所有全局作用域中声明的变量和函数都变成了window的属性。

```js
    let global = function() {
      return this;
    }();
```

这段代码创建一个立即调用的函数表达式，返回了this的值。当一个函数在没有明确（通过成为某个对象的方法，或者通过call()/apply()）指定this值的情况下执行时，this值等于Global对象。因此，调用一个简单返回this的函数是在任何执行上下文中获取Global对象的通用方式。


### Math

注意 Math对象上提供的计算要比直接在JavaScript实现的快得多，因为Math对象上的计算使用了JavaScript引擎中更高效的实现和处理器指令。但使用Math计算的问题是精度会因浏览器、操作系统、指令集和硬件而异。


- `Math.fround()`方法返回数值最接近的单精度（32位）浮点值表示。
- `Math.random()`方法返回一个0~1范围内的随机数，其中包含0但不包含1

```js
    function selectFrom(lowerValue, upperValue) {
      let choices = upperValue - lowerValue + 1;
      return Math.floor(Math.random() ＊ choices + lowerValue);
    }
    let num = selectFrom(2,10);
    console.log(num);   // 2~10 范围内的值，其中包含2 和10
```

`window.crypto.getRandomValues()` 具有更高的加密随机性
