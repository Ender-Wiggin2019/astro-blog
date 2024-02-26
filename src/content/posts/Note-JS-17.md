---
title: 学习笔记 | JS 高级程序设计-第17章-事件
pubDate: 2024-02-01 21:00:00.0
updated: 2024-02-01 21:00:00.0
categories: ['学习笔记']
tags: ['TS',  '网站开发']
description: ' '
---

# 事件

JavaScript与HTML的交互是通过事件实现的，事件代表文档或浏览器窗口中某个有意义的时刻。可以使用仅在事件发生时执行的监听器（也叫处理程序）订阅事件。即“观察者模式”，使JS中定义的页面行为与HTML的页面展示分离。

## 事件流

**事件冒泡**从最具体的元素（文档树中最深的节点）开始触发，然后向上传播至没有那么具体的元素（文档）。

**事件捕获**中最不具体的节点最先收到事件，而最具体的节点最后收到事件。事件捕获实际上是为了在事件到达最终目标前拦截事件。

DOM事件流分为3个阶段：事件捕获、到达目标和事件冒泡。
注意，虽然DOM2 Events规范明确捕获阶段不命中事件目标，但现代浏览器都会在捕获阶段在事件目标上触发事件。最终结果是在事件目标上有两个机会来处理事件。

## 事件处理程序

事件是某种动作，而为响应事件而调用的函数被称为事件处理程序（或事件监听器）。

这个程序首先会创建一个函数来封装属性的值。这个函数有一个特殊的局部变量event，其中保存的就是event对象（`this` 即为目标元素）。
另外，这个动态创建的包装函数的作用链扩展了，document和元素自身的成员都可以被当成局部变量来访问（通过包了`with`实现）:
```js
    function() {
      with(document) {
        with(this) {
            // 属性值
        }
      }
    }
```

注意，如果是表单输入框，那么with还会包一层 `this.form` ，这样事件处理程序可以直接访问同一表单中的其它元素了。

大多数HTML事件处理程序会封装在try/catch块中，以便在特殊情况下（如调用还没有定义的函数时）**静默失败**。

### DOM0事件处理程序

```js
    let btn = document.getElementById("myBtn");
    btn.onclick = function() {
      console.log("Clicked");
    };
```

像这样使用DOM0方式为事件处理程序赋值时，所赋函数被视为元素的方法。因此，事件处理程序会在元素的作用域中运行，即this等于元素。
事件处理程序里通过this可以访问元素的任何属性和方法。以这种方式添加事件处理程序是注册在事件流的**冒泡阶段**的。

### DOM2事件处理程序

DOM2 Events为事件处理程序的赋值和移除定义了两个方法：`addEventListener()`和`removeEventListener()`。这两个方法暴露在所有DOM节点上，它们接收3个参数：事件名、事件处理函数和一个布尔值，true表示在**捕获阶段**调用，false（默认值）表示在**冒泡阶段**调用。
使用DOM2方式的主要优势是可以为同一个事件添加多个事件处理程序。

一般为了兼容性考虑，都是在冒泡时添加事件。如果一定要捕获，则主要目的是为了在事件到达目标前拦截事件。

### 兼容性写法

自己封装一个函数，处理多种情况：
```js
    var EventUtil = {
      addHandler: function(element, type, handler) {
        if (element.addEventListener) {
          element.addEventListener(type, handler, false);
        } else if (element.attachEvent) {
          element.attachEvent("on" + type, handler);
        } else {
          element["on" + type] = handler;
        }
      },
      removeHandler: function(element, type, handler) {
        if (element.removeEventListener) {
          element.removeEventListener(type, handler, false);
        } else if (element.detachEvent) {
          element.detachEvent("on" + type, handler);
        } else {
          element["on" + type] = null;
        }
      }
    };
```

```js
    let btn = document.getElementById("myBtn")
    let handler = function() {
      console.log("Clicked");
    };
    EventUtil.addHandler(btn, "click", handler);
    //其他代码
    EventUtil.removeHandler(btn, "click", handler);
```

## 事件对象

### DOM事件对象

在事件处理程序内部，`this`对象始终等于`currentTarget`的值，而`target`只包含事件的实际目标。
如果事件处理程序在父节点上：
```js
    document.body.onclick = function(event) {
      console.log(event.currentTarget === document.body);                  // true
      console.log(this === document.body);                                     // true
      console.log(event.target === document.getElementById("myBtn"));   // true
    };
```

`preventDefault()`方法用于阻止特定事件的默认动作。比如，链接的默认行为就是在被单击时导航到href属性指定的URL。
任何可以通过`preventDefault()`取消默认行为的事件，其事件对象的`cancelable`属性都会设置为true。

`stopPropagation()`方法用于立即阻止事件流在DOM结构中传播，取消后续的事件捕获或冒泡。例如，直接添加到按钮的事件处理程序中调用`stopPropagation()`，可以阻止`document.body`上注册的事件处理程序执行。

`eventPhase`属性可用于确定事件流当前所处的阶段。事件处理程序:
1. 在捕获阶段被调用
2. 在目标上被调用
3. 在冒泡阶段被调用（虽然“到达目标”是在冒泡阶段发生的）

 `event`对象只在事件处理程序执行期间存在，一旦执行完毕，就会被销毁。

### 兼容性实现

```js
    var EventUtil = {
      addHandler: function(element, type, handler) {
          // 为节省版面，删除了之前的代码
      },
      getEvent: function(event){
        return event?event: window.event;
      },
      getTarget: function(event){
        return event.target||event.srcElement;
      },
      preventDefault: function(event){
        if(event.preventDefault){
          event.preventDefault();
        }else{
          event.returnValue=false;
        }
      },
      removeHandler: function(element, type, handler) {
        // 为节省版面，删除了之前的代码
      },
      stopPropagation: function(event){
        if(event.stopPropagation){
          event.stopPropagation();
        }else{
          event.cancelBubble=true;
        }
      }
    };
```

## 事件类型

DOM3 Events定义了如下事件类型：

- 用户界面事件（UIEvent）：涉及与BOM交互的通用浏览器事件。
- 焦点事件（FocusEvent）：在元素获得和失去焦点时触发。
- 鼠标事件（MouseEvent）：使用鼠标在页面上执行某些操作时触发。
- 滚轮事件（WheelEvent）：使用鼠标滚轮（或类似设备）时触发。
- 输入事件（InputEvent）：向文档中输入文本时触发。
- 键盘事件（KeyboardEvent）：使用键盘在页面上执行某些操作时触发。
- 合成事件（CompositionEvent）：在使用某种IME（Input Method Editor，输入法编辑器）输入字符时触发。

### 用户界面事件

用户界面事件或UI事件不一定跟用户操作有关。这类事件在DOM规范出现之前就已经以某种形式存在了，保留它们是为了向后兼容。
- `load`: 在window上当页面加载完成后触发，在窗套（`<frameset>`）上当所有窗格（`<frame>`）都加载完成后触发，在`<img>`元素上当图片加载完成后触发，在`<object>`元素上当相应对象加载完成后触发。(理论上应该在`document`中触发，但是`window`有向下兼容)

图片预加载（注意需要先绑定事件再设置src，因为一旦有src了就会自动下载）：
```js
    window.addEventListener("load", () => {
      let image=new Image();
      image.addEventListener("load", (event) => {
        console.log("Image loaded! ");
      });
      image.src = "smile.gif";
    });
```


- `unload`: 类似前者

unload事件会在文档卸载完成后触发。unload事件一般是在从一个页面导航到另一个页面时触发，最常用于清理引用，以避免内存泄漏。

因为unload事件是在页面卸载完成后触发的，所以不能使用页面加载后才有的对象。此时要访问DOM或修改页面外观都会导致错误。

- `abort`：在`<object>`元素上当相应对象加载完成前被用户提前终止下载时触发。
- `error`：在`window`上当JavaScript报错时触发，在<img>元素上当无法加载指定图片时触发，在`<object>`元素上当无法加载相应对象时触发，在窗套上当一个或多个窗格无法完成加载时触发。
- `select`：在文本框（`<input>`或textarea）上当用户选择了一个或多个字符时触发。
- `resize`：在`window`或窗格上当窗口或窗格被缩放时触发。
- `scroll`：当用户滚动包含滚动条的元素时在元素上触发。`<body>`元素包含已加载页面的滚动条。

###  焦点事件

焦点事件在页面元素获得或失去焦点时触发。这些事件可以与document.hasFocus()和document.activeElement一起为开发者提供用户在页面中导航的信息。焦点事件有以下6种:

- blur：当元素失去焦点时触发。这个事件**不冒泡**，所有浏览器都支持。
- ~~DOMFocusIn：当元素获得焦点时触发。这个事件是focus的冒泡版。Opera是唯一支持这个事件的主流浏览器。DOM3 Events废弃了DOMFocusIn，推荐focusin。~~
- ~~DOMFocusOut：当元素失去焦点时触发。这个事件是blur的通用版。Opera是唯一支持这个事件的主流浏览器。~~
- focus：当元素获得焦点时触发。这个事件**不冒泡**，所有浏览器都支持。
- focusin：当元素获得焦点时触发。这个事件是focus的冒泡版。
- focusout：当元素失去焦点时触发。这个事件是blur的通用版。

### 鼠标和滚轮事件

- `click`
- `dbclick` 双击
- `mousedown` 按下鼠标后
- `mouseenter` 鼠标进入元素内部后，**不冒泡**
- `mouseleave` 从内部移动到外部， **不冒泡**
- `mousemove` 鼠标在元素上移动
- `mouseout` 鼠标光标从一个元素移到另一个元素上时触发。移到的元素可以是原始元素的外部元素，也可以是原始元素的子元素。
- `mouseover` 光标从元素外部移到元素内部时
- `mouseup` 用户释放鼠标键时触发
- `mousewheel` 反映的是鼠标滚轮或带滚轮的类似设备上滚轮的交互。

一些事件是依赖与前面的事件的，比如必须先触发了`mousedown`再紧接着触发了`mouseup` 才会执行 `click` 事件，如果有操作被取消默认了，那么 `click` 就不会发生。

#### 客户端坐标

鼠标事件都是在浏览器视口中的某个位置上发生的。这些信息被保存在`event`对象的`clientX`和`clientY`属性中。

```js
    let div = document.getElementById("myDiv");
    div.addEventListener("click", (event) => {
      console.log(`Client coordinates: ${event.clientX}, ${event.clientY}`);
    });
```

#### 页面坐标

页面坐标是事件发生时鼠标光标在页面上的坐标，通过`event`对象的`pageX`和`pageY`可以获取。

#### 屏幕坐标

可以通过event对象的screenX和screenY属性获取鼠标光标在屏幕上的坐标，指的是整个显示器屏幕中鼠标的位置。

#### 修饰键

如下属性会在各自对应的修饰键被按下时包含布尔值true，没有被按下时包含false。在鼠标事件发生的，可以通过这几个属性来检测修饰键是否被按下。

```js
    let div = document.getElementById("myDiv");
    div.addEventListener("click", (event) => {
      let keys = new Array();
      if (event.shiftKey) {
        keys.push("shift");
      }
      if (event.ctrlKey) {
        keys.push("ctrl");
      }
      if (event.altKey) {
        keys.push("alt");
      }
      if (event.metaKey) {
        keys.push("meta");
      }
      console.log("Keys: " + keys.join(", "));
    });
```

#### 相关元素

对mouseover和mouseout事件而言，还存在与事件相关的其他元素。这两个事件都涉及从一个元素的边界之内把光标移到另一个元素的边界之内。对mouseover事件来说，事件的主要目标是获得光标的元素(`target`)，**相关元素是失去光标的元素**（`relatedTarget`）。

#### 鼠标按键

event对象上会有一个button属性，表示按下或释放的是哪个按键。DOM为这个button属性定义了3个值：0表示鼠标主键、1表示鼠标中键（通常也是滚轮键）、2表示鼠标副键。

#### 额外事件信息

DOM2 Events规范在event对象上提供了detail属性，以给出关于事件的更多信息。对鼠标事件来说，detail包含一个数值，表示在给定位置上发生了多少次单击。单击相当于在同一个像素上发生一次mousedown紧跟一次mouseup。detail的值从1开始，每次单击会加1。如果鼠标在mousedown和mouseup之间移动了，则detail会重置为0。

#### mousewheel事件

mousewheel事件会在用户使用鼠标滚轮时触发，包括在垂直方向上任意滚动。这个事件会在任何元素上触发，并（在IE8中）冒泡到document和（在所有现代浏览器中）window。mousewheel事件的event对象包含鼠标事件的所有标准信息，此外还有一个名为wheelDelta的新属性。当鼠标滚轮向前滚动时，wheelDelta每次都是+120；而当鼠标滚轮向后滚动时，wheelDelta每次都是-120。

```js
    document.addEventListener("mousewheel", (event) => {
      console.log(event.wheelDelta);
    });
```