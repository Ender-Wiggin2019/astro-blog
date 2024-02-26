---
title: 学习笔记 | JS 高级程序设计-第15章-DOM扩展
pubDate: 2024-02-01 21:00:00.0
updated: 2024-02-01 21:00:00.0
categories: ['学习笔记']
tags: ['TS',  '网站开发']
description: ' '
---
# DOM 扩展

## Selectors API

`querySelector()`方法接收CSS选择符参数，返回匹配该模式的第一个后代元素，如果没有匹配项则返回`null`。

```js
    // 取得<body>元素
    let body = document.querySelector("body");
    // 取得ID为"myDiv"的元素
    let myDiv = document.querySelector("#myDiv");
    // 取得类名为"selected"的第一个元素
    let selected = document.querySelector(".selected");
    // 取得类名为"button"的图片
    let img = document.body.querySelector("img.button");
```

`querySelectorAll()`方法也接收一个用于查询的参数，但它会返回所有匹配的节点的一个`NodeList`的**静态**实例（不是实时查询）。

matches() 接收一个CSS选择符参数，如果**当前元素**匹配则该选择符返回true，否则返回false。

```js
if (document.body.matches("body.page1")){
  // true
}
```

使用这个方法可以方便地检测某个元素会不会被`querySelector()`或`querySelectorAll(`)方法返回。

## 元素遍历

Element Traversal API为DOM元素添加了5个属性：
- `childElementCount`，返回子元素数量（不包含文本节点和注释）
- `firstElementChild`，指向第一个Element类型的子元素（**只返回元素节点，这是为了避免空格导致的空白文本节点问题**）
- `lastElementChild`，指向最后一个Element类型的子元素
- `previousElementSibling`，指向前一个Element类型的同胞元素
- `nextElementSibling`

## HTML5

H5 规范提供了以前从未出现过的 JS 接口描述，并定义了浏览器需要提供的DOM扩展。

### getElementsByClassName()

对于查询类名非常方便，与 `querySelectAll()` 主要的区别在于，前者返回动态的`HTMLCollection`（动态`NodeList`），而后者是静态`NodeList`。

```js
    // 类名顺序无关紧要，但语法上以空格分隔
let allCurrentUsernames = document.getElementsByClassName("username current");
    // 取得ID为"myDiv"的元素子树中所有包含"selected"类的元素
    let selected = document.getElementById("myDiv").getElementsByClassName("selected");
```

另外，前者因为只需要查询类名，不需要CSS解析，性能会好一点点（可以忽略不计）。

### classList

`div.classList` 等于 `className` 的 `Array` 版本，增`add`删`remove`查`contains`，新增的`toggle` 方法如果类名存在则删除否则增加。

### 焦点管理

HTML5增加了辅助DOM焦点管理的功能。

- `document.activeElement` 始终包含当前拥有焦点的DOM元素。默认情况下在页面刚加载完之后会设置为`document.body`。而在页面完全加载之前为null。
- `document.hasFocus()` 返回布尔值，判断用户是否在操作页面。

### HTMLDocument扩展

`document.readyState`属性有两个可能的值：
- `loading`，表示文档正在加载；
- `complete`，表示文档加载完成。

`document.head`属性，指向文档的`<head>`元素。

### 自定义数据属性

HTML5允许给元素指定非标准的属性，但要使用前缀data-以便告诉浏览器，这些属性既不包含与渲染有关的信息，也不包含元素的语义信息。

定义了自定义数据属性后，可以通过元素的`dataset`属性来访问。`dataset`属性是一个`DOMStringMap`的实例，包含一组键（`data-`后面的内容）/值对映射。

```js
    <div id="myDiv" data-appId="12345" data-myname="Nicholas"></div>
// 本例中使用的方法仅用于示范
let div = document.getElementById("myDiv");
// 取得自定义数据属性的值
let appId = div.dataset.appId;
let myName = div.dataset.myname;
// 设置自定义数据属性的值
div.dataset.appId = 23456;
div.dataset.myname = "Michael";
// 有"myname"吗？
if (div.dataset.myname){
  console.log(`Hello, ${div.dataset.myname}`);
}
```

### 插入标记

#### `innerHTML`和`outerHTML`

1. `innerHTML`:
   - 当用作获取值时，`innerHTML`返回调用它的**元素内部**的HTML内容，不包括该元素本身的标签。
   - 当用作设置值时，它会替换调用它的元素内部的所有内容，但不会影响元素本身的标签。

   例如，有如下HTML元素：
   ```html
   <div id="example">这是一些文本</div>
   ```

   使用`innerHTML`:
   ```javascript
   var elem = document.getElementById("example");
   console.log(elem.innerHTML); // 输出: 这是一些文本
   elem.innerHTML = '<p>新的内容</p>'; // 修改后，div内部将包含一个<p>标签
   ```

   修改后的HTML:
   ```html
   <div id="example"><p>新的内容</p></div>
   ```

2. `outerHTML`:
   - 当用作获取值时，`outerHTML`返回调用它的元素及其所有内部HTML内容的完整HTML。
   - 当用作设置值时，它会替换整个元素及其内部内容，也就是说，它会替换调用它的元素本身和所有子内容。

   继续上面的例子，使用`outerHTML`:
   ```javascript
   var elem = document.getElementById("example");
   console.log(elem.outerHTML); // 输出: <div id="example">这是一些文本</div>
   elem.outerHTML = '<p>新的内容</p>'; // 修改后，原来的div被整个替换为了<p>标签
   ```

   修改后的HTML:
   ```html
   <p>新的内容</p> <!-- 原来的<div id="example">...</div>不再存在 -->
   ```


#### `insertAdjacentHTML()` 和 `insertAdjacentText()`

二者都允许在指定元素的相对位置插入HTML或文本内容。两者的主要区别在于它们插入的内容类型和如何被解析。

1. `insertAdjacentHTML()`:
   - 此方法接受两个参数：第一个参数是一个字符串，表示插入内容的位置；第二个参数是一个HTML字符串，表示要插入的HTML内容。
   - 插入的HTML字符串会被解析为HTML元素，并按照指定的位置插入到DOM中。

   可用的位置参数包括：
   - `'beforebegin'`: 在当前元素之前插入HTML内容。
   - `'afterbegin'`: 在当前元素内部的开始位置插入HTML内容。
   - `'beforeend'`: 在当前元素内部的结束位置插入HTML内容。
   - `'afterend'`: 在当前元素之后插入HTML内容。

   例如：
   ```javascript
   var elem = document.getElementById("example");
   elem.insertAdjacentHTML('beforebegin', '<p>这是新的段落</p>');
   ```

2. `insertAdjacentText()`:
   - 此方法也接受两个参数：第一个参数同样是一个字符串，表示插入内容的位置；第二个参数是文本字符串，表示要插入的文本内容。
   - 插入的文本不会被解析为HTML，它将作为纯文本插入（文本节点），这意味着任何HTML标签将被视为普通文本，并不会创建相应的DOM元素。

注意，`innerText`(按照深度优先合并子树的**所有文本**) 和 `outerText`(写入时，替换整个元素和子树为文本节点) 没有纳入 H5 标准（Firefox不支持`outerText`）。
### 内存与性能

在旧版本的浏览器中（特别是旧版本的Internet Explorer），如果你移除或替换了一个DOM节点，但是这个节点或其子节点上绑定的事件处理器没有被正确移除，或者节点上通过JavaScript引用了某些对象（例如通过属性），这些事件处理器和对象之间的引用可能不会被浏览器的垃圾回收机制所清除。这会导致即使DOM节点已经从文档中移除，相关的JavaScript对象仍然保留在内存中，从而引起内存泄漏。

为了避免这种情况，建议在替换或移除DOM节点之前，手动解除这些节点上的事件绑定，并且清除可能通过JavaScript属性引用的对象。你可以通过以下步骤来减少内存泄漏的风险：

1. 移除事件监听器： 如果你使用`addEventListener()`方法为元素添加了事件监听器，请确保在移除或替换元素之前，使用`removeEventListener()`移除这些监听器。
2. 清除JavaScript引用： 如果你的元素通过属性（如`elem.data = myObject;`）引用了JavaScript对象，请在移除元素之前将这些属性设置为`null`或者`undefined`，以确保引用被清除。

如果使用React等框架，自带了事件监听管理和内存回收，所以不需要考虑这么多。

```js
    for (let value of values){
	  // 每次循环前先读取，再写入，访问了2次
      ul.innerHTML += '<li>${value}</li>';   // 每次遍历都调用了innerHTML，性能很差
    }
```

尽管innerHTML不会执行自己创建的`<script>`标签，但仍然向恶意用户暴露了很大的攻击面，因为通过它可以毫不费力地创建元素并执行`onclick`之类的属性。

```js
div.outerText = "Hello world! ";
// 等价于
let text = document.createTextNode("Hello world! ");
div.parentNode.replaceChild(text, div);
```
### scrollIntoView()

`scrollIntoView()` 使元素滚动到浏览器窗口的可视区域内。

该方法可以接受一个参数，这个参数可以是一个布尔值或者一个选项对象。

1. 当参数为布尔值时：
   - 如果参数为 `true`（或省略，因为默认值就是 `true`），**元素的顶端会和视窗的顶端对齐**。
   - 如果参数为 `false`，元素的底端会和视窗的底端对齐。

   例子：
   ```javascript
   element.scrollIntoView(); // 等同于 element.scrollIntoView(true);
   element.scrollIntoView(false);
   ```

2. 当参数为一个选项对象时，你可以指定更多的滚动行为：
   - `behavior`: 定义滚动动作，可能的值为 `"auto"`（默认）或 `"smooth"`，后者会平滑地滚动到元素位置。
   - `block`: 定义垂直方向的对齐，可能的值为 `"start"`、`"center"`、`"end"` 或 `"nearest"`。
   - `inline`: 定义水平方向的对齐，可能的值也为 `"start"`、`"center"`、`"end"` 或 `"nearest"`。

   例子：
   ```javascript
   element.scrollIntoView({
     behavior: 'smooth', // 平滑滚动
     block: 'start', // 元素顶部与视窗顶部对齐
     inline: 'nearest' // 在水平方向上不进行滚动或滚动最小距离
   });
   ```

这个方法对于创建锚点导航（即点击链接后滚动到页面特定部分）或者当用户进行某些操作后需要将特定的DOM元素展示在视图中时非常有用。

需要注意的是，`scrollIntoView()` 方法可能不会在所有的滚动情况下都能如预期工作，比如当元素被隐藏（`display: none`）或者它或其祖先元素设置了不能滚动的样式（`overflow: hidden`）时。

### 滚动

除了标准化的 `scrollIntoView()`，还有一些专有方法。比`scrollIntoViewIfNeeded(alingCenter)`会在元素不可见的情况下，将其滚动到窗口或包含窗口中，使其可见；如果已经在视口中可见，则这个方法什么也不做。如果将可选的参数alingCenter设置为true，则浏览器会尝试将其放在视口中央。Safari、Chrome和Opera实现了这个方法。
