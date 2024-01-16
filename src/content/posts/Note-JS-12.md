---
title: 学习笔记 | JS 高级程序设计-第12章-BOM
pubDate: 2023-11-22 21:02:00.0
updated: 2023-11-22 21:02:00.0
categories: ['学习笔记']
tags: ['TS',  '网站开发']
description: ' '
---
# BOM

浏览器对象模型（BOM, Browser Object Model）

## window 对象

BOM的核心是`window`对象，表示浏览器的实例。`window`对象在浏览器中有两重身份，一个是ECMAScript中的`Global`对象，另一个就是浏览器窗口的JavaScript接口。这意味着网页中定义的所有对象、变量和函数都以`window`作为其`Global`对象，都可以访问其上定义的`parseInt()`等全局方法。

在全局中使用 `var` 定义可以将变量定义于 `window` 中，而 `let` 不会添加。

另外，访问未声明的变量会抛出错误，但是可以在window对象上查询是否存在可能未声明的变量。
```js
// 这会导致抛出错误，因为oldValue没有声明
var newValue = oldValue;
// 这不会抛出错误，因为这里是属性查询
// newValue会被设置为undefined
var newValue = window.oldValue;
```

### 窗口关系

- `top`对象始终指向最上层（最外层）窗口，即浏览器窗口本身。
- `parent`对象则始终指向当前窗口的父窗口。如果当前窗口是最上层窗口，则`parent`等于`top`（都等于`window`）。
- 最上层的`window`如果不是通过`window.open()`打开的，那么其name`属性`就不会包含值。
- `self`对象始终会指向window。实际上，`self`和`window`就是同一个对象。之所以还要暴露`self`，就是为了和`top`、`parent`保持一致。

###  窗口位置与像素比

现代浏览器提供了`screenLeft`和`screenTop`属性，用于表示窗口相对于屏幕左侧和顶部的位置，返回值的单位是CSS像素。

移动窗口使用moveTo()和moveBy()。

```js
// 把窗口移动到左上角
window.moveTo(0,0);
// 把窗口向左移动50 像素
window.moveBy(-50, 0);
```

#### CSS像素（CSS Pixels）

CSS像素是Web开发中使用的**统一**像素单位。这个单位的背后其实是一个角度：0.0213°。，称为设备独立像素（Device Independent Pixels, DIPs）。它是一个抽象的单位，旨在为开发者提供一个统一的度量标准，使得不同设备和分辨率上的网页元素能够保持大致相同的**视觉大小**。

#### 物理像素（Physical Pixels）

物理像素是显示屏幕上实际的光点，它们是构成屏幕显示内容的最小单位。不同设备的屏幕可能有不同的物理像素密度，即PPI（Pixels Per Inch，每英寸像素数）。

#### 设备像素比（Device Pixel Ratio, DPR）

由于物理像素的密度可以非常高（尤其是在现代设备上），CSS像素和物理像素之间的关系由设备像素比（DPR）定义。DPR是物理像素数和CSS像素数的比例。例如，如果DPR为2，则意味着一个CSS像素占据了2x2个物理像素。

`window.devicePixelRatio`实际上与每英寸像素数（DPI, dots per inch）是对应的。DPI表示单位像素密度，而`window.devicePixelRatio`表示物理像素与逻辑像素之间的缩放系数。


### 窗口大小

不同的窗口大小属性：
- `outerWidth`和`outerHeight`返回浏览器窗口自身的大小（不管是在最外层window上使用，还是在窗格`<frame>`中使用）。
- `innerWidth`和`innerHeight`返回浏览器窗口中**页面视口**的大小（不包含浏览器边框和工具栏）。
- `document.documentElement.clientWidth`和`document.documentElement.clientHeight`返回页面视口的宽度和高度。

可以使用`resizeTo()`和`resizeBy()`方法调整窗口大小。这两个方法都接收两个参数，`resizeTo()`接收新的宽度和高度值，而`resizeBy()`接收宽度和高度各要缩放多少。

### 视口位置

- `window.pageXoffset`/`window. scrollX`
- `window.pageYoffset`/`window.scrollY`

滚动页面使用 `scroll()`、`scrollTo()` 和 `scrollBy()`。

这几个方法也都接收一个ScrollToOptions字典，除了提供偏移值，还可以通过behavior属性告诉浏览器是否平滑滚动。

```js
    // 正常滚动
    window.scrollTo({
      left: 100,
      top: 100,
      behavior: 'auto'
    });
    // 平滑滚动
    window.scrollTo({
      left: 100,
      top: 100,
      behavior: 'smooth'
    });
```

### 导航与打开新窗口

`window.open()`方法可以用于导航到指定URL，也可以用于打开新浏览器窗口。这个方法接收4个参数：
1. 要加载的URL
2. 目标窗口（如果不是已有窗口，则会打开一个新窗口或标签页）
3. 特性字符串
4. 表示新窗口在浏览器历史记录中是否替代当前加载页面的布尔值。

例子：
```js
    let wroxWin = window.open("http://www.wrox.com/",
                  "wroxWindow",
                  "height=400, width=400, top=10, left=10, resizable=yes");
    // 缩放
    wroxWin.resizeTo(500, 500);
    // 移动
    wroxWin.moveTo(100, 100);
```

新创建窗口的window对象有一个属性opener，指向打开它的窗口。这个属性只在弹出窗口的最上层window对象（top）有定义，是指向调用window.open()打开它的窗口或窗格的指针。

在某些浏览器中，每个标签页会运行在独立的进程中。如果一个标签页打开了另一个，而window对象需要跟另一个标签页通信，那么标签便不能运行在独立的进程中。在这些浏览器中，可以将新打开的标签页的opener属性设置为null，表示新打开的标签页可以运行在独立的进程中。

把opener设置为null表示新打开的标签页不需要与打开它的标签页通信，因此可以在独立进程中运行。这个连接一旦切断，就无法恢复了。

### 系统对话框

使用`alert()`、`confirm()`和`prompt()`方法，可以让浏览器调用系统对话框向用户显示消息。这些对话框与浏览器中显示的网页无关，而且也不包含HTML。它们的外观由操作系统或者浏览器决定，无法使用CSS设置。
此外，这些对话框都是**同步**的模态对话框，即在它们显示的时候，代码会停止执行，在它们消失以后，代码才会恢复执行。

`confirm() `返回确认和取消按钮的对话框。
要知道用户单击了OK按钮还是Cancel按钮，可以判断`confirm()`方法的返回值：true表示单击了OK按钮，false表示单击了Cancel按钮或者通过单击某一角上的X图标关闭了确认框。

最后一种对话框是提示框，通过调用`prompt()`方法来显示。提示框的用途是提示用户输入消息。除了OK和Cancel按钮，提示框还会显示一个文本框，让用户输入内容。`prompt()`方法接收两个参数：要显示给用户的文本，以及文本框的默认值（可以是空字符串）。
如果用户单击了OK按钮，则`prompt()`会返回文本框中的值。如果用户单击了Cancel按钮，或者对话框被关闭，则`prompt()`会返回`null`。

JavaScript还可以显示另外两种**异步**对话框：`find()`和`print()`。这两种对话框都是异步显示的，即控制权会立即返回给脚本。用户在浏览器菜单上选择“查找”（find）和“打印”（print）时显示的就是这两种对话框。通过在`window`对象上调用`find()`和`print()`可以显示它们。

## location对象

location是最有用的BOM对象之一，提供了当前窗口中加载文档的信息，以及通常的导航功能。这个对象独特的地方在于，它既是window的属性，也是document的属性。也就是说，`window.location和document.location`指向同一个对象。

location对象不仅保存着当前加载文档的信息，也保存着把URL解析为离散片段后能够通过属性访问的信息。

### 查询字符串

虽然`location.search`返回了从问号开始直到URL末尾的所有内容，但没有办法逐个访问每个查询参数。

而 `URLSearchParams` 提供了一组标准API方法，通过它们可以检查和修改查询字符串。给`URLSearchParams`构造函数传入一个查询字符串，就可以创建一个实例。

大多数支持`URLSearchParams`的浏览器也支持将`URLSearchParams`的实例用作可迭代对象。

### 操作地址

`location.assign("http://www.xxx.com")`这行代码会立即启动导航到新URL的操作，同时在浏览器历史记录中增加一条记录。
如果给`location.href`或`window.location`设置一个URL，也会以同一个URL值调用`assign()`方法。

修改l`ocation`对象的属性也会修改当前加载的页面。其中，`hash`、`search`、`hostname`、`pathname`和`port`属性被设置为新值之后都会修改当前URL。
除了`hash`之外，只要修改l`ocation`的一个属性，就会导致页面重新加载新URL。

在以前面提到的方式修改URL之后，浏览器历史记录中就会增加相应的记录如果不希望增加历史记录，可以使用`replace()`方法。这个方法接收一个URL参数，但重新加载后不会增加历史记录。

最后一个修改地址的方法是`reload()`，它能重新加载当前显示的页面。调用`reload()`而不传参数，页面会以最有效的方式重新加载。也就是说，如果页面自上次请求以来没有修改过，浏览器可能会从缓存中加载页面。如果想强制从服务器重新加载，可以给`reload()`传个`true`。

脚本中位于reload()调用之后的代码可能执行也可能不执行，这取决于网络延迟和系统资源等因素。为此，最好把reload()作为最后一行代码。

## navigator 对象

`window.navigator` 是一个包含了用户浏览器信息的对象，它是 `window` 对象的一个属性，代表了浏览器的状态和身份。`navigator` 对象提供了很多属性和方法，可以让开发者获取到关于浏览器的信息，并且与之交互。

1. **浏览器检测**：可以通过 `navigator` 对象来检测用户正在使用的浏览器及其版本。常用的属性包括 `navigator.userAgent`、`navigator.appVersion`、`navigator.appName` 等。
2. **平台信息**：可以使用 `navigator.platform` 来获取用户操作系统的信息。
3. **网络状态**：`navigator` 对象提供了 `navigator.onLine` 属性，可以用来检测用户的设备是否连接到网络。
4. **地理位置**：通过 `navigator.geolocation` 对象，可以获取用户的地理位置信息（当然，这需要用户的授权）。
5. **多媒体功能**：`navigator` 对象提供了访问用户媒体设备（如摄像头和麦克风）的能力，通过 `navigator.mediaDevices`。
6. **插件信息**：过去，`navigator` 对象可以用来检测浏览器安装的插件，但由于安全和隐私的原因，这个功能已经被逐渐淘汰。
7. **注册协议处理器**：如之前所述，`navigator.registerProtocolHandler` 允许网站注册为特定协议（例如 `mailto` 或 `webcal`）的处理程序。
8. **服务工作线程**：`navigator.serviceWorker` 允许注册和管理 Service Workers，这些是运行在浏览器背后的脚本，可以用来支持离线体验、网络请求拦截和背景同步等。
9. **推送通知**：`navigator` 对象可以用来管理和控制Web推送通知。
10. **语言和国际化**：`navigator.language` 属性表示用户的首选语言，`navigator.languages` 则是一个包含用户首选语言的数组。
11. **性能分析**：`navigator` 对象提供了 `navigator.sendBeacon` 方法，可以在卸载文档之前异步地发送小量数据到服务器，用于性能分析和统计。
12. **电池状态**：`navigator.getBattery` 方法（如果可用）允许访问设备电池状态的信息。
13. **剪贴板操作**：`navigator.clipboard` 提供了读取和修改剪贴板内容的能力。
14. **凭证管理**：`navigator.credentials` 用于访问和管理用户的凭证信息。
15. **硬件并发**：`navigator.hardwareConcurrency` 属性表示可用于运行线程的逻辑处理器的数量。
### 检测插件

都可以通过`window.navigator.plugins`数组来确定。这个数组中的每一项都包含如下属性。
- name：插件名称。
- description：插件介绍。
- filename：插件的文件名。
- length：由当前插件处理的MIME类型数量。

通常，name属性包含识别插件所需的必要信息，尽管不是特别准确。检测插件就是遍历浏览器中可用的插件，并逐个比较插件的名称

### 注册处理程序

现代浏览器支持navigator上的（在HTML5中定义的）registerProtocolHandler()方法。

要使用registerProtocolHandler()方法，必须传入3个参数：要处理的协议（如"mailto"或"ftp"）、处理该协议的URL，以及应用名称。

```js
navigator.registerProtocolHandler("mailto", "http://www.somemailclient.com?cmd=%s", "Some Mail Client");
```

当用户点击一个 `mailto` 链接时，浏览器会打开 `http://www.somemailclient.com` 这个地址，并且 `%s` 会被替换为实际的 `mailto` URL。例如，如果 `mailto` 链接是 `mailto:user@example.com`，那么 `%s` 就会被替换为 `mailto:user@example.com`。

## screen对象

这个对象中保存的纯粹是客户端能力信息，也就是浏览器窗口外面的客户端显示器的信息，比如像素宽度和像素高度。每个浏览器都会在screen对象上暴露不同的属性。

## history对象

history对象表示当前窗口首次使用以来用户的导航历史记录。因为history是window的属性，所以每个window都有自己的history对象。出于安全考虑，这个对象不会暴露用户访问过的URL，但可以通过它在不知道实际URL的情况下前进和后退。

### 导航

go()方法可以在用户历史记录中沿任何方向导航，可以前进也可以后退。这个方法只接收一个参数，这个参数可以是一个整数，表示前进或后退多少步。
go()有两个简写方法：back()和forward()。
history对象还有一个length属性，表示历史记录中有多个条目。

注意 如果页面URL发生变化，则会在历史记录中生成一个新条目。对于主流浏览器，这包括改变**URL的散列值**（因此，把location.hash设置为一个新值会在这些浏览器的历史记录中增加一条记录）。这个行为常被单页应用程序框架用来模拟前进和后退，这样做是为了不会因导航而触发页面刷新。

### 历史状态管理

`hashchange`会在页面URL的散列变化时被触发，开发者可以在此时执行某些操作。而状态管理API则可以让开发者改变浏览器URL而不会加载新页面。为此，可以使用`history.pushState()`方法。这个方法接收3个参数：一个state对象、一个新状态的标题和一个（可选的）相对URL。

```js
    let stateObject = {foo:"bar"};
    history.pushState(stateObject, "My title", "baz.html");
```

`pushState()`方法执行后，状态信息就会被推到历史记录中，浏览器地址栏也会改变以反映新的相对URL。除了这些变化之外，即使location.href返回的是地址栏中的内容，浏览器页不会向服务器发送请求。第二个参数并未被当前实现所使用，因此既可以传一个空字符串也可以传一个短标题。第一个参数应该包含正确初始化页面状态所必需的信息。为防止滥用，这个状态的对象大小是有限制的，通常在500KB～1MB以内。

因为`pushState()`会创建新的历史记录，所以也会相应地启用“后退”按钮。此时单击“后退”按钮，就会触发window对象上的`popstate`事件。`popstate`事件的事件对象有一个state`属性`，其中包含通过`pushState()`第一个参数传入的`state`对象：
```js
    window.addEventListener("popstate", (event) => {
      let state = event.state;
      if (state) { // 第一个页面加载时状态是null
        processState(state);
      }
    });
```

`replaceState` 传入的参数和 `pushState` 一致，但是只会覆盖当前历史记录。

注意，使用HTML5状态管理时，要确保通过`pushState()`创建的每个“假”URL背后都对应着服务器上一个真实的物理URL。否则，单击“刷新”按钮会导致404错误。所有 SPA 框架都必须通过服务器或客户端的某些配置解决这个问题。
