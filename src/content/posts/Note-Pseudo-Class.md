---
title: 学习笔记 | 函数式伪类
pubDate: 2024-03-02 22:00:00.0
updated: 2024-03-02 22:00:00.0
categories: ['学习笔记']
tags: ['TS',  '网站开发']
description: ' '
---

CSS **伪类**是添加到选择器的关键字，用于指定所选元素的特殊状态。

## 函数式伪类

函数式伪类的选择器都是可容错的。

在 CSS 中，当使用选择器列表时，如果任何一个选择器无效，则**整个列表将被视为无效**。使用这些伪类时，如果一个选择器无法解析，整个选择器列表不会被视为无效，而是会忽略不正确或不支持的选择器，并使用其他的选择器。

### `:is()`

**`:is()`** 以选择器列表作为参数，并选择该列表中任意一个选择器可以选择的元素。这对于以更紧凑的形式编写大型选择器非常有用。

```css

ul > li > a,
ol > li > a,
nav > ul > li > a,
nav > ol > li > a {
 color: blue;
}
/* 使用 :is() */
:is(ul, ol, nav > ul, nav > ol) > li > a {
 color: blue;
}
```

或者：

```css
/* 三层或更深的无序列表使用方形符号。 */
:is(ol, ul, menu, dir) :is(ol, ul, menu, dir) :is(ul, menu, dir) {
  list-style-type: square;
}
```

```css
/* 处理不同层级的 h1 元素 */
/* 0 级 */
h1 {
  font-size: 30px;
}
/* 1 级 */
:is(section, article, aside, nav) h1 {
  font-size: 25px;
}
/* 2 级 */
:is(section, article, aside, nav) :is(section, article, aside, nav) h1 {
  font-size: 20px;
}
/* 3 级 */
:is(section, article, aside, nav)
  :is(section, article, aside, nav)
  :is(section, article, aside, nav)
  h1 {
  font-size: 15px;
}
```

**`:is()`** 优先级依然遵循CSS选择器的优先级规则，即 `ID -> 类 -> 元素` 的顺序。由它的选择器列表中优先级最高的选择器决定的。

**`:is()`** 的参数也可以传一个匹配规则:

```css
/* 匹配所有 `class` 开头是 `is-styling` 的选择器 */
:is([class^="is-styling"]) a {
 color: yellow;
}
```

注意，伪元素在 `:is()` 的选择器列表中无效。不匹配伪元素。

### `:not()`

用来匹配不符合一组选择器的元素。由于它的作用是防止特定的元素被选中，它也被称为 _反选伪类_（_negation pseudo-class_）。

## `:where()`

**`:where()`** 和 **:is()** 相似，都可以传入选择器或者匹配规则来简化你的CSS代码。

但和 **:is()** 不同的是，`:where()` 拥有最低优先级，这样的好处是它定义的样式规则不会影响其他样式规则，避免了样式冲突。

```css
/* <footer class="where-styling">……</footer> */
footer a {
 color: green;
}
:where([class^="where-styling"]) a {
 color: red
}
```

当有其他规则和 **`:where()`** 同时被命中时，`:where()` 一定是失效的。所以上面这个例子实际效果是链接显示绿色。

## `:has()`

**`:has()`** 表示一个元素，如果作为参数传递的任何相对选择器]在锚定到该元素时，至少匹配一个元素。这个伪类通过把可容错相对选择器列表作为参数，提供了一种针对引用元素选择父元素或者先前的兄弟元素的方法。

```css
/* 选择直接包含 p 元素的 div */
div:has(> p) {
 border: 1px solid black;
}
```

```css
/* 选择后面紧跟着 p 元素的 div */
div:has(+ p) {
 border: 1px solid black;
}
```

```css
h1,
h2,
h3 {
  margin: 0 0 1rem 0;
}

:is(h1, h2, h3):has(+ :is(h2, h3, h4)) {
/* 等价于
:is(h1, h2, h3):has(+ h2, + h3, + h4) {
*/
  margin: 0 0 0.25rem 0;
}
```

