---
title: 学习笔记 | JS 高级程序设计-第14章-DOM
pubDate: 2023-12-09 21:02:00.0
updated: 2023-12-09 21:02:00.0
categories: ['学习笔记']
tags: ['TS',  'Web开发']
description: ' '
---
# DOM

文档对象模型（DOM, Document Object Model）是HTML和XML文档的编程接口。DOM表示由多层节点构成的文档，通过它开发者可以添加、删除和修改页面的各个部分。

## 节点层级

`document`节点表示每个文档的根节点。文档元素（`documentElement`）是文档最外层的元素，所有其他元素都存在于这个元素之内。

- 在HTML页面中，文档元素始终是`<html>`元素。
- 在XML文档中，则没有这样预定义的元素，任何元素都可能成为文档元素。

## Node 类型

Node 一共有12个类型，但是对于浏览器而言主要使用的就是 `Node.ELEMENT_NODE` 和 `Node.TEXT_NODE`。

### nodeName与nodeValue

对元素而言，n`odeName`始终等于元素的标签名，而`nodeValue`则始终为`null`

### 节点关系

每个节点都有一个`childNodes`属性，其中包含一个`NodeList`的实例。`NodeList`是一个类数组对象，用于存储可以按位置存取的有序节点。
注意，`NodeList`**不是**Array的`实例`，但可以使用中括号访问它的值，而且它也有`length`属性。

`NodeList`其实是一个对DOM结构的查询，因此DOM结构的变化会自动地在NodeList中反映出来。因此NodeList是实时的活动对象，而不是第一次访问时所获得内容的快照。

**和数组的主要区别（以HTMLCollection为例）**：

- `HTMLCollection`是与DOM绑定的，它的"动态"特性是由浏览器的DOM实现提供的，确保`HTMLCollection`始终映射到当前文档的状态。
- 普通数组是JavaScript的数据结构，它不会自动与DOM的状态同步。数组的内容只有在开发者执行显式操作时才会改变。

```js
    let firstChild = someNode.childNodes[0];
    let secondChild = someNode.childNodes.item(1);
    let count = someNode.childNodes.length;
```

使用`Array.from()`静态方法或者`Array.prototype.slice()`可以把`NodeList`对象转换为数组。

每个节点都有一个`parentNode`属性，指向其DOM树中的父元素。
此外，`childNodes`列表中的每个节点都是同一列表中其他节点的同胞节点。而使用`previousSibling`和`nextSibling`可以在这个列表的节点间导航（首位的前后都是`null`，参考链表）。

`hasChildNodes()`这个方法如果返回true则说明节点有一个或多个子节点。

因为所有关系指针都是只读的，所以DOM又提供了一些操纵节点的方法。

以下几个方法必须先后去父节点，才可以操作：

- `appendChild()`，用于在childNodes列表末尾添加节点。如果把文档中已经存在的节点传给appendChild()，则这个节点会从之前的位置被**转移**到新位置。
- `insertBefore()`插入的节点会变成参照节点的前一个同胞节点，并被返回。如果参照节点是null，则insertBefore()与appendChild()效果相同。
- `replaceChild()`方法接收两个参数：要插入的节点和要替换的节点。
- `removeChild()`方法接收一个参数，即要移除的节点。被移除的节点会被返回。

这几个方法对于所有节点类型都有效：

`cloneNode()`，会返回与调用它的节点一模一样的节点。`cloneNode()`方法接收一个布尔值参数，表示是否深复制。在传入`true`参数时，会进行深复制，即复制节点及其整个子DOM树。如果传入`false`，则只会复制调用该方法的节点。这个复制的节点**没有**指定父节点。
注意`cloneNode()`方法不会复制添加到DOM节点的JavaScript属性，比如事件处理程序。这个方法**只复制HTML属性**，以及可选地复制子节点。

`normalize()`这个方法唯一的任务就是处理文档子树中的文本节点。由于解析器实现的差异或DOM操作等原因，可能会出现并不包含文本的文本节点，或者文本节点之间互为同胞关系。在节点上调用normalize()方法会检测这个节点的所有后代，从中搜索上述两种情形。如果发现空文本节点，则将其删除；如果两个同胞节点是相邻的，则将其合并为一个文本节点。

## Document类型

Document类型是JavaScript中表示文档节点的类型。在浏览器中，文档对象document是`HTMLDocument`的实例（HTMLDocument继承Document），表示整个HTML页面。

document是window对象的属性，因此是一个全局对象。
Document类型的节点有以下特征：

- nodeType等于9；
- nodeName值为"#document"；
- nodeValue值为null；
- parentNode值为null；
- ownerDocument值为null；
- 子节点可以是DocumentType（最多一个）、Element（最多一个）、ProcessingInstruction或Comment类型

### 文档子节点

DOM规范规定Document节点的子节点可以是DocumentType、Element、Processing-Instruction或Comment。

虽然`document.childNodes`中有所有节点，但是下面的属性可以快速访问：

- `documentElement`属性，始终指向HTML页面中的`<html>`元素。
- `body` 属性指向`<body>`。

`document.doctype` 可以获取 `<!doctype>` 部分的信息。

1. **元素是 `HTMLHtmlElement` 的实例**：这意味着某个 DOM 元素是 `<html>` 标签对应的对象。在 JavaScript 中，每个标签都有一个对应的对象类型，`<html>` 标签对应的对象类型是 `HTMLHtmlElement`。
2. **`HTMLHtmlElement` 继承自 `HTMLElement`**：`HTMLElement` 是所有 HTML 元素的基类。所有特定的 HTML 元素，如 `<div>`、`<span>`、`<a>` 等，都是 `HTMLElement` 的扩展。因此，`HTMLHtmlElement` 具有 `HTMLElement` 的所有属性和方法。
3. **`HTMLElement` 继承自 `Element`**：`Element` 是所有 DOM 元素的基类，不仅包括 HTML 元素，还包括例如 SVG 元素。`Element` 提供了所有 DOM 元素共有的基础功能，比如属性和方法来操作它们的子节点。
4. **HTML文档可以包含子节点，但不能多于一个**：在一个 HTML 文档中，`<html>` 元素是顶层元素，也就是说，它是文档树的根节点。它可以包含 `<head>` 和 `<body>` 这两个子节点，但在规范的 HTML 文档中，不应该有多个 `<html>` 元素。因此，虽然 `Element` 类型的对象可以有多个子节点，但对于 `HTMLHtmlElement`（即 `<html>` 元素），在一个合规的 HTML 文档中，它作为根节点，只能有一个实例。

### 文档信息

- `title`包含`<title>`元素中的文本，通常显示在浏览器窗口或标签页的标题栏。
- `URL`包含当前页面的完整URL（地址栏中的URL）
- `domain`包含页面的域名（**可设置**为父域名的值，可以用于`<frame>/<iframe>`跨子域）
- `referrer`包含链接到当前页面的那个页面的URL。如果当前页面没有来源，则`referrer`属性包含空字符串。

### 定位元素

1. `getElementById()`方法接收一个参数，即要获取元素的ID，如果找到了则返回这个元素，如果没找到则返回null。多个同id元素只返回第一个。

2. `getElementsByTagName()`方法接收一个参数，即要获取元素的标签名（**HTML中不区分大小写**），返回包含零个或多个元素的NodeList。在HTML文档中，这个方法返回一个`HTMLCollection`对象（也是实时列表）。

```js
let allElements = document.getElementsByTagName("*");
let images = document.getElementsByTagName("img");

alert(images.length);         // 图片数量
alert(images[0].src);         // 第一张图片的src属性
alert(images.item(0).src);   // 同上
```

`HTMLCollection`对象还有一个额外的方法`namedItem()`，可通过标签的name属性取得某一项的引用。例如：

```js
<img src="myimage.gif" name="myImage">

let myImage = images.namedItem("myImage");
let myImage = images["myImage"];
```

`HTMLCollection`不是数组，主要有如下几个原因：

- 历史上，Web API 和 JS 早期是两套环境与标准。
- `HTMLCollection` 被设计为一个实时的、**动态**反映文档状态的集合。
- 如果 `HTMLCollection` 是一个数组，每次文档更新时，都需要创建一个新的数组来反映这些变化，这可能会导致性能问题。

3. `getElementsByName()`返回具有给定`name`属性的所有元素。最常用于单选按钮 radio，因为同一字段的单选按钮必须具有相同的`name`属性才能确保把正确的值发送给服务器。`getElementsByName()`方法也返回`HTMLCollection`。不过在这种情况下，`namedItem()`方法**只会取得第一项**（因为所有项的name属性都一样）。

### 特殊集合

document对象上还暴露了几个特殊集合，这些集合也都是HTMLCollection的实例。这些集合是访问文档中公共部分的快捷方式。

- document.anchors包含文档中所有带name属性的`<a>`元素。
- ~~`document.applets`包含文档中所有`<applet>`元素（因为`<applet>`元素已经不建议使用，所以这个集合已经废弃）。~~
- `document.forms`包含文档中所有`<form>`元素（与`document.getElementsByTagName ("form")`返回的结果相同）。
- `document.images`包含文档中所有`<img>`元素（与`document.getElementsByTagName ("img")`返回的结果相同）。
- `document.links`包含文档中所有带href属性的`<a>`元素。

### 文档写入

网页输出流中写入内容对应4个方法：`write()`、`writeln()`、`open()`和`close()`。其中，`write()`和`writeln()`方法都接收一个字符串参数，可以将这个字符串写入网页中。`write()`简单地写入文本，而`writeln()`还会在字符串末尾追加一个换行符。

这两个方法可以用来在**页面加载期间**向页面中动态添加内容。
如果是在页面加载完之后再调用`document.write()`，则输出的内容会重写整个页面。

## Element类型

Element类型就是Web开发中最常用的类型了。Element表示XML或HTML元素，对外暴露出访问元素标签名、子节点和属性的能力。特点如下：

- nodeType等于1；
- nodeName值为元素的标签名；
- nodeValue值为null；
- parentNode值为Document或Element对象；
- 子节点可以是Element、Text、Comment、ProcessingInstruction、CDATASection、EntityReference类型。

可以通过nodeName或tagName属性来获取元素的标签名（**大写格式**）。

```js
<div id="myDiv"></div>

let div = document.getElementById("myDiv");
alert(div.tagName); // "DIV"
alert(div.tagName == div.nodeName); // true
```

### HTML元素

HTMLElement直接继承Element并增加了一些属性。每个属性都对应下列属性之一，它们是所有HTML元素上都有的标准属性：

- id，元素在文档中的唯一标识符；
- title，包含元素的额外信息，通常以提示条形式展示；
- lang，元素内容的语言代码（很少用）；
- dir，语言的书写方向（"ltr"表示从左到右，"rtl"表示从右到左，同样很少用）；
- className，相当于class属性，用于指定元素的CSS类（因为class是ECMAScript关键字，所以不能直接用这个名字）

所有HTML元素都是HTMLElement或其子类型的实例。

### 取得属性

`getAttribute()`、`setAttribute()`和`removeAttribute()`这些方法主要用于操纵属性，包括在HTMLElement类型上定义的属性。
注意，如果要获取 `class`，要使用 `div.getAttribute('class')` 而不是 `className`。

如果在 HTML中自定义了属性，也可以通过这种方式获得值。

```js
<div id="myDiv" data-HELLO="hello!"></div>
```

```js
let value = div.getAttribute("data-hello");
```

- 根据HTML5规范的要求，自定义属性名应该前缀`data-`以方便验证。
- 此外，属性名不区分大小写。
- 元素的公认属性同时也是DOM对象的属性，但是自定义属性不会成为DOM对象属性。

**几个DOM属性 !== getAttribute() 的特殊情况**：

1. `style`，`getAttribute()` 返回 CSS 字符串而 `DOM.style`返回 `CSSStyleDeclaration` 对象。
2. 事件处理程序，比如 `onclick`，`getAttribute` 返回字符串而DOM返回的是函数。

综上，一般情况都使用DOM属性，除非是需要获取自定义属性。

### 设置属性

`setAttribute()`接收两个参数：要设置的属性名和属性的值，不存在就直接创建，存在则覆盖。
设置的属性名会规范为**小写形式**，因此"ID"会变成"id"。

当然也可以直接在DOM对象上赋值，但是和上面的`getAttribute()`类似，自定义属性不会自动加入DOM对象。

```js
div.mycolor = "red";
alert(div.getAttribute("mycolor")); // null（IE除外）
```

`removeAttribute()`用于从元素中删除属性（整个属性完全从元素中去掉）。

### attributes属性

使用较为麻烦，仅做介绍。

`Element`类型是唯一使用`attributes`属性的DOM节点类型。`attributes`属性包含一个`NamedNodeMap`实例，是一个类似`NodeList`的“实时”集合。元素的每个属性都表示为一个`Attr`节点，并保存在这个`NamedNodeMap`对象中。`NamedNodeMap`对象包含下列方法：

- getNamedItem(name)，返回nodeName属性等于name的节点；
- removeNamedItem(name)，删除nodeName属性等于name的节点；
- setNamedItem(node)，向列表中添加node节点，以其nodeName为索引；
- item(pos)，返回索引位置pos处的节点。

attributes属性中的每个节点的nodeName是对应属性的名字，nodeValue是属性的值。

```js
let id = element.attributes.getNamedItem("id").nodeValue;
let id = element.attributes["id"].nodeValue; // 简写
let oldAttr = element.attributes.removeNamedItem("id"); // 删除
element.attributes.setNamedItem(newAttr); // 非常少用，接受的是一个新的Attr
```

attributes属性最有用的场景是需要迭代元素上所有属性的时候。这时候往往是要把DOM结构序列化为XML或HTML字符串。

```js
function outputAttributes(element) {
    let pairs = [];
    for (let i = 0, len = element.attributes.length; i < len; ++i) {
     const attribute = element.attributes[i];
     pairs.push(`${attribute.nodeName}="${attribute.nodeValue}"`);
    }
    return pairs.join(" ");
}
```

### 创建元素

可以使用`document.createElement()`方法创建新元素。这个方法接收一个参数，即要创建元素的标签名。
使用该方法创建新元素的同时也会将其`ownerDocument`属性设置为`document`。

在新元素上设置这些属性只会附加信息。因为这个元素还没有添加到文档树，所以不会影响浏览器显示。要把元素添加到文档树，可以使用appendChild()、insertBefore()或replaceChild()。

元素被添加到文档树之后，浏览器会立即将其渲染出来。之后再对这个元素所做的任何修改，都会立即在浏览器中反映出来。

### 元素后代

childNodes属性包含元素所有的子节点，这些子节点可能是其他元素、文本节点、注释或处理指令。

```html
    <ul id="myList">
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ul>
```

在解析以上代码时，`<ul>`元素会包含7个子元素，其中3个是`<li>`元素，还有4个Text节点（表示`<li>`元素**周围的空格**）。
如果把元素之间的空格删掉，则所有浏览器都会返回同样数量的子节点。

```js
    for (let i = 0, len = element.childNodes.length; i < len; ++i) {
      if (element.childNodes[i].nodeType == 1) {
        // 执行某个操作
      }
    }
```

比如可以遍历某个元素的子节点，并且只在nodeType等于1（即Element节点）时执行某个操作。

注意：要取得某个元素的子节点和其他后代节点，可以使用元素的`getElementsByTagName()`方法。在元素上调用这个方法与在文档上调用是一样的，只不过搜索范围限制在当前元素之内，即只会返回当前元素的后代。

## Text类型

nodeType === 3 的 Node，文本值为nodeValue的值。方法如下：

- appendData（text），向节点末尾添加文本text；
- deleteData（offset, count），从位置offset开始删除count个字符；
- insertData（offset, text），在位置offset插入text；
- replaceData（offset, count, text），用text替换从位置offset到offset+count的文本；
- splitText（offset），在位置offset将当前文本节点拆分为两个文本节点；
- substringData（offset, count），提取从位置offset到offset+count的文本。

HTML或XML代码（取决于文档类型）会被转换成实体编码，即小于号、大于号或引号会被转义：

```js
    // 输出为"Some &lt; strong&gt; other&lt; /strong&gt; message"
    div.firstChild.nodeValue = "Some <strong>other</strong> message";
```

```js
let element = document.createElement("div"); // 创建元素
element.className = "message";
let textNode = document.createTextNode("Hello world! "); // 创建文本节点
element.appendChild(textNode); // 添加节点
document.body.appendChild(element); // 添加到文档树

```

一般一个元素只有一个文本子节点（浏览器解析文档时），但也可以有多个。两个文本节点直接的文本不会包含空格。如果要规范化这种情况，可以使用 Node 上的方法 `element.normalize()`，可以拼接字符串。

Text类型也定义了一个与`normalize()`相反的方法——`splitText()`。这个方法可以在指定的偏移位置拆分nodeValue，将一个文本节点拆分成两个文本节点。

## Comment类型

nodeType === 8 的 Node，注释值为nodeValue的值。

Comment类型与Text类型继承同一个基类（`CharacterData`），因此拥有除splitText()之外Text节点所有的字符串操作方法。

```js
<div id="myDiv">
	<! -- A comment -->
</div>

// 注释节点可以作为父节点的子节点来访问。
let div = document.getElementById("myDiv");
let comment = div.firstChild;
alert(comment.data); // "A comment"
```

```js
let comment = document.createComment("A comment"); // 创建注释，几乎没用
```

## 一些其它类型

- CDATASection类型表示XML中特有的CDATA区块。
- DocumentType对象，**nodeName值为文档类型的名称**，nodeValue值为null；DocumentType对象保存在`document.doctype`属性中。
- Attr类型，虽然是节点但是一般都是使用上面提到的 `getAttribute()` 操作。
- DocumentFragment类型，文档片段定义为“轻量级”文档，能够包含和操作节点，却没有完整文档那样额外的消耗。不能直接把文档片段添加到文档。相反，文档片段的作用是**充当其他要被添加到文档的节点的仓库**（`document.createDocumentFragment()`）。

```js
let fragment = document.createDocumentFragment(); // 创建文档片段
let ul = document.getElementById("myList"); // 从文档数中获得节点
for (let i = 0; i < 3; ++i) {
  let li = document.createElement("li");
  li.appendChild(document.createTextNode(`Item ${i + 1}`));
  fragment.appendChild(li); // 在 fragment 中插入
}
ul.appendChild(fragment); // 最终一次性插入，避免多次渲染
```


## DOM 编程

### 动态脚本

```js
<script src="foo.js"></script>

// 等价于
let script = document.createElement("script");
script.src = "foo.js";
document.body.appendChild(script);

// 可以实现动态重载
function loadScript(url) {
  let script = document.createElement("script");
  script.src = url;
  document.body.appendChild(script);
}
```

```js
// 兼容多种浏览器的函数插入
    function loadScriptString(code){
      var script = document.createElement("script");
      script.type = "text/javascript";
      try {
        script.appendChild(document.createTextNode(code)); // 除了早期IE都支持
      } catch (ex){
        script.text = code; // 除了早期 Safari 都支持
      }
      document.body.appendChild(script);
    }
```

注意，通过`innerHTML`属性创建的`<script>`元素永远不会执行（防止 XSS 攻击）。浏览器会尽责地创建`<script>`元素，以及其中的脚本文本，但解析器会给这个`<script>`元素打上永不执行的标签。只要是使用`innerHTML`创建的`<script>`元素，以后也没有办法强制其执行。

### 动态样式

CSS样式在HTML页面中可以通过两个元素加载。`<link>`元素用于包含CSS外部文件，而`<style>`元素用于添加嵌入样式。

```js
// link 方式
    function loadStyles(url){
      let link = document.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = url;
      let head = document.getElementsByTagName("head")[0];
      head.appendChild(link);
    }
```

```js
// style 方式
    let style = document.createElement("style");
    style.type = "text/css";
    style.appendChild(document.createTextNode("body{background-color:red}"));
    let head = document.getElementsByTagName("head")[0];
    head.appendChild(style);
```

### 操作表格

为了方便创建表格，DOM 给表格元素添加了一些属性和方法。

```js
    // 创建表格
    let table = document.createElement("table");
    table.border = 1;
    table.width = "100%";
    // 创建表体
    let tbody = document.createElement("tbody");
    table.appendChild(tbody);
    //创建第一行
    tbody.insertRow(0); // 插入一行，放在0的位置
    tbody.rows[0].insertCell(0); // 插入 cell
    tbody.rows[0].cells[0].appendChild(document.createTextNode("Cell1,1"));
    tbody.rows[0].insertCell(1);
    tbody.rows[0].cells[1].appendChild(document.createTextNode("Cell2,1"));
    //创建第二行
    tbody.insertRow(1);
    tbody.rows[1].insertCell(0);
    tbody.rows[1].cells[0].appendChild(document.createTextNode("Cell1,2"));
    tbody.rows[1].insertCell(1);
    tbody.rows[1].cells[1].appendChild(document.createTextNode("Cell2,2"));
    // 把表格添加到文档主体
    document.body.appendChild(table);
```

### 使用NodeList

理解NodeList对象和相关的NamedNodeMap、HTMLCollection，是理解DOM编程的关键。这3个集合类型都是“实时的”，意味着文档结构的变化会实时地在它们身上反映出来，因此它们的值始终代表最新的状态。

```JS
let divs = document.getElementsByTagName("div");
for (let i = 0; i < divs.length; ++i){
  let div = document.createElement("div");
  document.body.appendChild(div);
}
```

## MutationObserver接口

使用MutationObserver可以观察整个文档、DOM树的一部分，或某个元素。此外还可以观察元素属性、子节点、文本，或者前三者任意组合的变化。

### 基本用法

```js
    let observer = new MutationObserver(() => console.log('DOM was mutated! '));
```

当观测对应元素后`observer.observe(document.body, { attributes: true })`，`<body>`元素上任何属性发生变化都会被这个MutationObserver实例发现，然后就会异步执行注册的回调函数。`<body>` 元素后代的修改或其他非属性修改都不会触发回调进入任务队列（因为上面的例子没有配置，具体配置见下一段）。

每个回调都会收到一个`MutationRecord`实例的数组。`MutationRecord`实例包含的信息包括发生了什么变化，以及DOM的哪一部分受到了影响。

#### disconnect()方法

同步调用 `observer.disconnect()` 之后，不仅会停止此后变化事件的回调，**也会抛弃已经加入任务队列**要异步执行的回调。

要想让已经加入任务队列的回调执行，可以使用`setTimeout()`让已经入列的回调执行完毕再调用`disconnect()`。

```js
    let observer = new MutationObserver(() => console.log('<body> attributes changed'));
    observer.observe(document.body, { attributes: true });
    document.body.className = 'foo';
    setTimeout(()=>{
      observer.disconnect();
      document.body.className = 'bar';
    }, 0);
    // 只会输出 <body> attributeschanged
```

#### 复用MutationObserver

1. `type`: 字符串，表示所记录变化的类型。它可以是以下值之一：
    - `"attributes"`: 表示属性值的变化。
    - `"characterData"`: 表示节点文本内容的变化。
    - `"childList"`: 表示子节点列表的变化（添加、移除或者更换）。
2. `target`: 节点对象（Node），表示发生变化的 DOM 节点。
3. `addedNodes`: 节点列表（NodeList），包含所有被添加的子节点。
4. `removedNodes`: 节点列表（NodeList），包含所有被移除的子节点。
5. `previousSibling`: 节点（Node），表示变化前的前一个兄弟节点。如果没有前一个兄弟节点，则为 `null`。
6. `nextSibling`: 节点（Node），表示变化后的下一个兄弟节点。如果没有下一个兄弟节点，则为 `null`。
7. `attributeName`: 字符串，仅当 `type` 是 `"attributes"` 时才有值，表示发生变化的属性的名称。
8. `attributeNamespace`: 字符串，仅当 `type` 是 `"attributes"` 时才有值，表示发生变化的属性的命名空间。
9. `oldValue`: 字符串或 `null`，根据 `type` 的不同而有不同的含义：
    - 如果 `type` 是 `"attributes"`，则表示变化前的属性值。
    - 如果 `type` 是 `"characterData"`，则表示变化前的文本节点内容。
    - 如果 `type` 是 `"childList"`，则此属性为 `null`。
```js
let observer = new MutationObserver(
				(mutationRecords) => console.log(mutationRecords.map((x)=>
x.target)));
// 向页面主体添加两个子节点
let childA = document.createElement('div'),
	childB = document.createElement('span');
document.body.appendChild(childA);
document.body.appendChild(childB);
// 观察两个子节点
observer.observe(childA, {attributes: true});
observer.observe(childB, {attributes: true});
// 修改两个子节点的属性
childA.setAttribute('foo', 'bar');
childB.setAttribute('foo', 'bar');
//[<div>, <span>]
```

在 `disconnect()` 之后可以通过 `observe() `重用观察者。

### MutationObserverInit与观察范围

MutationObserverInit对象用于控制对目标节点的观察范围。粗略地讲，观察者可以观察的事件包括属性变化、文本变化和子节点变化。
1. `childList`: 布尔值，如果为 `true`，则观察器会观察目标节点的直接子节点的添加或移除。如果使用`document.body.insertBefore(document.body.lastChild, documentBody.firstChild)`, 实际上是先删除再增加，所以会触发两次。
2. `attributes`: 布尔值，如果为 `true`，则观察器会观察目标节点的属性变更。
3. `characterData`: 布尔值，如果为 `true`，则观察器会观察目标节点的**文本内容**变更。
4. `subtree`: 布尔值，如果为 `true`，则除了目标节点外，还会观察目标节点的**所有后代节点**的变更。
5. `attributeOldValue`: 布尔值，如果为 `true`，且 `attributes` 也为 `true`，则记录属性变更前的旧值。
6. `characterDataOldValue`: 布尔值，如果为 `true`，且 `characterData` 也为 `true`，则记录文本变更前的旧值。
7. `attributeFilter`: 字符串数组，用于指定一个属性名称的列表，如果设置了这个列表，则 `MutationObserver` 只会观察列表中指定的属性变更。这个属性只在 `attributes` 为 `true` 时有效。

### 异步回调与记录队列

每次MutationRecord被添加到MutationObserver的记录队列时，仅当之前没有已排期的微任务回调时（队列中微任务长度为0），才会将观察者注册的回调（在初始化MutationObserver时传入）作为微任务调度到任务队列上。这样可以保证记录队列的内容不会被回调处理两次。

调用MutationObserver实例的takeRecords()方法可以清空记录队列，取出并返回其中的所有MutationRecord实例。

### 性能、内存与垃圾回收

#### MutationObserver的引用

MutationObserver实例与目标节点之间的引用关系是**非对称**的。

- **MutationObserver 对目标节点的弱引用**：意味着 MutationObserver 不会阻止其所观察的 DOM 节点被垃圾回收。如果没有其他强引用指向这些节点，它们可以被正常回收。
- **目标节点对 MutationObserver 的强引用**：意味着只要目标节点仍然存在于 DOM 中，或者存在其他引用指向目标节点，那么与之关联的 MutationObserver 就不会被垃圾回收。

#### MutationRecord的引用

至少包含一个DOM节点的引用（`childList`可以有多个）。
最佳实践是，从`MutationRecor`d 中抽取需要的信息到新对象中，然后释放 `MutationRecord`。