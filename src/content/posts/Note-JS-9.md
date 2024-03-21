---
title: 学习笔记 | JS 高级程序设计-第9章-代理与反射
pubDate: 2024-03-18 22:03:00.0
updated: 2024-03-18 22:03:00.0
categories: ['学习笔记']
tags: ['TS',  '网站开发']
description: '整理一下之前的笔记，当做复习。'
---


## 代理

代理是目标对象的抽象。从很多方面看，代理类似C++指针，因为它可以用作目标对象的替身，但又完全独立于目标对象。目标对象既可以直接被操作，也可以通过代理来操作。但直接操作会绕过代理施予的行为。

代理是使用Proxy构造函数创建的。**这个构造函数接收两个参数：目标对象和处理程序对象**。缺少其中任何一个参数都会抛出TypeError。要创建空代理，可以传一个简单的对象字面量作为处理程序对象，从而让所有操作畅通无阻地抵达目标对象。

### 定义捕获器

使用代理的主要目的是可以定义捕获器。

例如当执行get()时（`proxy[property]`、`proxy.property`或`Object.create(proxy)[property]`），就会触发捕获：

```js
    const target = {
      foo: 'bar'
    };
    const handler = {
      get(trapTarget, property, receiver) {
        console.log(trapTarget === target);
        console.log(property);
        console.log(receiver === proxy);
      }
    };
    const proxy = new Proxy(target, handler);
    proxy.foo;
    // true
    // foo
    // true
```

所有捕获器都可以基于自己的参数重建原始操作，但并非所有捕获器行为都像get()那么简单。因此，通过手动写码如法炮制的想法是不现实的。实际上，开发者并不需要手动重建原始行为，而是可以通过调用全局`Reflect`对象上（封装了原始行为）的同名方法来轻松重建。

```js
    const target = {
      foo: 'bar'
    };
    const handler = {
      get() {
        return Reflect.get(...arguments);
      }
    };
    const proxy = new Proxy(target, handler);
    console.log(proxy.foo);    // bar
    console.log(target.foo);   // bar
```

可以更加简化：

```js
    const handler = {
      get: Reflect.get
    };
```

事实上，如果真想创建一个可以捕获所有方法，然后将每个方法转发给对应反射API的空代理，那么甚至不需要定义处理程序对象：

```js
    const target = {
      foo: 'bar'
    };
    const proxy = new Proxy(target, Reflect);
    console.log(proxy.foo);    // bar
    console.log(target.foo);   // bar
```

### 捕获器不变式

如果目标对象有一个不可配置且不可写的数据属性，那么在捕获器返回一个与该属性不同的值时，会抛出TypeError：

```js
    const target = {};
    Object.defineProperty(target, 'foo', {
      configurable: false,
      writable: false,
      value: 'bar'
    });
    const handler = {
      get() {
        return 'qux';
      }
    };
    const proxy = new Proxy(target, handler);
    console.log(proxy.foo);
    // TypeError
```

### 可撤销代理

Proxy也暴露了revocable()方法，这个方法支持撤销代理对象与目标对象的关联。撤销代理的操作是不可逆的。而且，撤销函数（revoke()）是幂等的，调用多少次的结果都一样。撤销代理之后再调用代理会抛出TypeError。

```js
    const target = {
      foo: 'bar'
    };
    const handler = {
      get() {
        return 'intercepted';
      }
    };
    const { proxy, revoke } = Proxy.revocable(target, handler);
    console.log(proxy.foo);    // intercepted
    console.log(target.foo);   // bar
    revoke();
    console.log(proxy.foo);    // TypeError
```

### 实用反射API

在使用反射API时，要记住：
1. 反射API并不限于捕获处理程序
2. 大多数反射API方法在Object类型上有对应的方法。

通常，Object上的方法适用于通用程序，而反射方法适用于细粒度的对象控制与操作。
例如：

```js
    Function.prototype.apply.call(myFunc, thisVal, argumentList);

    // 可以使用Reflect变为：
    Reflect.apply(myFunc, thisVal, argumentsList);
```

## 代理反射API

ownKeys()捕获器会在Object.keys()及类似方法中被调用。对应的反射API方法为Reflect. ownKeys()。

`getPrototypeOf()`捕获器会在`Object.getPrototypeOf()`中被调用。对应的反射API方法为`Reflect.getPrototypeOf()`。拦截的操作包括了：
- `Object.getPrototypeOf(proxy)`
- `Reflect.getPrototypeOf(proxy)`
- `proxy.__proto__`
- `Object.prototype.isPrototypeOf(proxy)`
- `proxy instanceof Object`

construct()捕获器会在new操作符中被调用。对应的反射API方法为Reflect.construct()。


## 用途

比如（但远远不限于）跟踪属性访问、隐藏属性、阻止修改或删除属性、函数参数验证、构造函数参数验证、数据绑定，以及可观察对象。