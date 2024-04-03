---
title: 学习笔记 | JS 高级程序设计-第3章-语言基础
pubDate: 2023-11-22 21:00:00.0
updated: 2023-11-22 21:00:00.0
categories: ['学习笔记']
tags: ['TS',  'Web开发']
description: ' '
---
## `let` 声明

### 暂时性死区 Temporal Dead Zone

`let` 声明属于块级作用域，在解析代码时实质上也会在变量声明前预创建，但是暂时性死区会让 `let` 变量在执行声明前无法访问 （`ReferenceError`），可以避免 `var` 的变量提升导致的意外情况。
### 全局声明

与 `var` 关键字不同，使用 `let` 在全局作用域中声明的变量不会成为 `window` 对象的属性（`var` 声明的变量则会）。

## `undefined`

对于 js 而言，未初始化的变量和**未声明的变量**调用 `typeof` 都会返回 `undefined`。
但是对于 ts 而言，因为在编译时会进行静态类型检查，要求变量在使用之前必须被显式地声明和赋值，因此 `typeof` 会报错。

## `null`

Null 类型同样只有一个值，即特殊值 `null`。逻辑上讲，`null` 值表示一个空对象指针，这也是给`typeof` 传一个 `null` 会返回 `object` 的原因。
`undefined` 值是由 `null` 值派生而来的，因此 ECMA-262 将它们定义为表面上相等，即 `null == undefined`。

## `Number` 类型

整数也可以用八进制（以8为基数，严格模式下无效，0 开头）或十六进制（以16为基数，0x 开头）字面量表示。如果字面量中包含的数字超出了应有的范围，就会忽略前缀的零，后面的数字序列会被当成十进制数。

正零和负零在所有情况下都被认为是等同的。

### 值的范围

如果某个计算得到的数值结果超出了可以表示的范围（`< Number.MIN_VALUE | > Number.MAX_VALUE`），那么这个数值会被自动转换为一个特殊的 `Infinity` 值。任何无法表示的负数以 `-Infinity` 表示，任何无法表示的正数以 `Infinity` 表示。

要确定一个值是不是有限大，可以使用 `isFinite()` 函数。

`Number.NEGATIVE_INFINITY` 和 `Number.POSITIVE_INFINITY` 也可以获取正、负Infinity。这两个属性包含的值分别就是 `-Infinit`y 和 `Infinity`。

### NaN

NaN 意思是“不是数值”（Not a Number），用于表示本来要返回数值的操作失败了（而不是抛出错误）。NaN不等于包括NaN在内的任何值。判断是否是 NaN 使用 `isNaN()` 函数。

`isNaN()` 可以用于测试对象。此时，首先会调用对象的 `valueOf()` 方法，然后再确定返回的值是否可以转换为数值。如果不能，再调用 `toString()` 方法，并测试其返回值，和许多内置函数和操作符的工作方式相似。

### 数值转换

- `Number()` 函数将可以合法转化的值转成数字，包括整数和浮点数
- `parseInt()` 函数有两个参数。第一个参数中如果第一个字符不是数值字符、加号或减号，立即返回NaN。这意味着空字符串也会返回NaN（这一点跟Number()不一样，它返回0）。第二个参数，用于指定底数（进制数）。
- `parseFloat()` 解析到字符串末尾或者解析到一个无效的浮点数值字符为止，并且只能解析十进制值。

## `String` 类型


`toString()` 方法可见于数值、布尔值、对象和字符串值。`null` 和 `undefined` 值没有 `toString()` 方法。
多数情况下，`toString()` 不接收任何参数。不过，在对数值调用这个方法时，`toString()` 可以接收一个底数参数，即以什么底数来输出数值的字符串表示。
如果你不确定一个值是不是 `null` 或 `undefined`，可以使用 `String()` 转型函数，它始终会返回表示相应类型值的字符串（`"null"` 和 `"undefined"`）。

### 模板字面量

使用模版字面量的字符串插值时，对于任何插入的值都会使用 `toString()` 强制转型为字符串。

模板字面量也支持定义标签函数，标签函数接收到的参数依次是原始字符串数组和对每个表达式求值的结果。

```js
let a = 6;
let b = 9;
functionsimpleTag(strings, ...expressions){
  console.log(strings);
  for(const expression of expressions) {
	console.log(expression);
  }
  return 'foobar';
}
let taggedResult = simpleTag`${ a } + ${ b } = ${ a + b }`;
// ["", " + ", " = ", ""]
// 6
// 9
// 15
console.log(taggedResult);   // "foobar"
```
对于有n个插值的模板字面量，传给标签函数的表达式参数的个数始终是n，而传给标签函数的第一个参数所包含的字符串个数则始终是n+1。

### 原始字符串

使用默认的 `String.raw` 标签函数可以直接获取原始的模板字面量内容（如换行符或Unicode字符），而不是被转换后的字符表示。

```js
console.log(`\u00A9`);               // ©
console.log(String.raw`\u00A9`);   // \u00A9
// 换行符示例
console.log(`first line\nsecond line`);
// first line
// second line
console.log(String.raw`first line\nsecond line`); // "first line\nsecond line"

// 对实际的换行符来说是不行的
// 它们不会被转换成转义序列的形式
console.log(`first line
second line`);
// first line
// second line
console.log(String.raw`first line
second line`);
// first line
// second line
```

## `Symbol` 类型

Symbol（符号）是ES6新增的数据类型。符号是原始值，且符号实例是唯一、不可变的。符号的用途是确保对象属性使用唯一标识符，不会发生属性冲突的危险。

```js
let sym = Symbol(); // 初始化方式，不能 new，为了了避免创建符号包装对象
let symWithDesc = Symbol('desc'); // 初始化方式，不能 new
console.log(typeof sym); // symbol
```

如果运行时的不同部分需要共享和重用符号实例，那么可以用一个字符串作为键，在**全局符号注册表**中创建并重用符号。`Symbol.for() `对每个字符串键都执行幂等操作。

```js
let fooGlobalSymbol = Symbol.for('foo');         // 创建新符号
let otherFooGlobalSymbol = Symbol.for('foo');   // 重用已有符号

let localSymbol = Symbol('foo'); // 不使用 for 不会注册
console.log(fooGlobalSymbol === otherFooGlobalSymbol);   // true
console.log(localSymbol === fooGlobalSymbol); // false
```

还可以使用 `Symbol.keyFor() `来查询全局注册表，这个方法接收符号，返回该全局符号对应的字符串键。如果查询的不是全局符号，则返回 `undefined`。

```js
// 创建全局符号
let s = Symbol.for('foo');
console.log(Symbol.keyFor(s));    // foo
// 创建普通符号
let s2 = Symbol('bar');
console.log(Symbol.keyFor(s2));   // undefined

Symbol.keyFor(123); // 如果传入的不是 Symbol 会报错 TypeError
```

符号也可以作为属性
```js
    let s1 = Symbol('foo'),
        s2 = Symbol('bar'),
        s3 = Symbol('baz'),
        s4 = Symbol('qux');
    let o = {
      [s1]: 'foo val' // 对象字面量中只能是计算属性
    };
    // 这样也可以：o[s1] = 'foo val';
    console.log(o);
    // {Symbol(foo): foo val}
    Object.defineProperty(o, s2, {value: 'bar val'});
    console.log(o);
    // {Symbol(foo): foo val, Symbol(bar): bar val}
    Object.defineProperties(o, {
      [s3]: {value: 'baz val'},
      [s4]: {value: 'qux val'}
    });
    console.log(o);
    // {Symbol(foo): foo val, Symbol(bar): bar val,
    //   Symbol(baz): baz val, Symbol(qux): qux val}
```

类似于 `Object.getOwnPropertyNames()` 返回对象实例的常规属性数组 `Object.getOwnPropertySymbols()` 返回对象实例的符号属性数组。这两个方法的返回值彼此互斥。`Object.getOwnPropertyDescriptors()` 会返回同时包含常规和符号属性描述符的对象。`Reflect.ownKeys()` 会返回两种类型的键。

