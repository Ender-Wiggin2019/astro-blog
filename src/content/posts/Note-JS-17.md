---
title: 学习笔记 | JS 高级程序设计-第17章-事件
pubDate: 2024-02-01 22:00:00.0
updated: 2024-02-01 22:00:00.0
categories: ['学习笔记']
tags: ['TS',  'Web开发']
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

### 键盘与输入事件

- keydown，用户按下键盘上某个键时触发，而且持续按住会重复触发。
- ~~~~keypress，用户按下键盘上某个键并产生字符时触发，而且持续按住会重复触发。Esc键也会触发这个事件。DOM3 Events废弃了keypress事件，而推荐textInput事件。~~
- keyup，用户释放键盘上某个键时触发。

输入事件只有一个，即textInput。这个事件是对keypress事件的扩展，用于在文本显示给用户之前更方便地截获文本输入。textInput会在文本被插入到文本框之前触发。

#### 键码

event对象的keyCode属性中会保存一个键码，对应键盘上特定的一个键。对于字母和数字键，keyCode的值与小写字母和数字的ASCII编码一致。比如数字7键的keyCode为55，而字母A键的keyCode为65，而且跟是否按了Shift键无关。

DOM3使用**key属性**用于替代keyCode，且包含字符串。在按下字符键时，key的值等于文本字符（如“k”或“M”）；在按下非字符键时，key的值是键名（如“Shift”或“ArrowDown”）。char属性在按下字符键时与key类似，在按下非字符键时为null
#### 字符编码

一旦有了字母编码，就可以使用`String.fromCharCode()`方法将其转换为实际的字符了。

最后一个变化是给event对象增加了`getModifierState()`方法。这个方法接收一个参数，一个等于Shift、Control、Alt、AltGraph或Meta的字符串，表示要检测的修饰键。如果给定的修饰键处于激活状态（键被按住），则方法返回true，否则返回false：

#### textInput事件

DOM3 Events规范增加了一个名为textInput的事件，其在字符被输入到可编辑区域时触发。作为对keypress的替代，textInput事件的行为有些不一样。
- 一个区别是keypress会在任何可以获得焦点的元素上触发，而textInput只在可编辑区域上触发。
- 另一个区别是textInput只在有新字符被插入时才会触发，而keypress对任何可能影响文本的键都会触发（包括退格键）。因为textInput事件主要关注字符，所以在event对象上提供了一个data属性，包含要插入的字符（不是字符编码）。data的值**始终是要被插入的字符**，因此如果在按S键时没有按Shift键，data的值就是"s"，但在按S键时同时按Shift键，data的值则是"S"。

```js
    let textbox = document.getElementById("myText");
    textbox.addEventListener("textInput", (event)=>{
      console.log(event.data);
    });
```

event对象上还有一个名为**inputMethod**的属性，该属性表示向控件中输入文本的手段，例如键盘、粘贴，拖放......

## HTML5事件

### contextmenu事件

contextmenu事件专门用于表示何时该显示上下文菜单，从而允许开发者取消默认的上下文菜单并提供自定义菜单。

contextmenu事件冒泡，因此只要给document指定一个事件处理程序就可以处理页面上的所有同类事件。事件目标是触发操作的元素。这个事件在所有浏览器中都可以取消，在DOM合规的浏览器中使用event.preventDefault()，在IE8及更早版本中将event.returnValue设置为false。contextmenu事件应该算一种鼠标事件，因此event对象上的很多属性都与光标位置有关。通常，自定义的上下文菜单都是通过oncontextmenu事件处理程序触发显示，并通过onclick事件处理程序触发隐藏的。

```html
    <! DOCTYPE html>
    <html>
    <head>
      <title>ContextMenu Event Example</title>
    </head>
    <body>
      <div id="myDiv">Right click or Ctrl+click me to get a custom context menu.
        Click anywhere else to get the default context menu.</div>
      <ul id="myMenu" style="position:absolute; visibility:hidden; background-color:
        silver">
        <li><a href="http://www.somewhere.com"> somewhere</a></li>
        <li><a href="http://www.wrox.com">Wrox site</a></li>
        <li><a href="http://www.somewhere-else.com">somewhere-else</a></li>
      </ul>
    </body>
    </html>
```

```js
    window.addEventListener("load", (event) => {
      let div = document.getElementById("myDiv");
      div.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        let menu = document.getElementById("myMenu");
        menu.style.left = event.clientX + "px";
        menu.style.top = event.clientY + "px";
        menu.style.visibility = "visible";
      });
      document.addEventListener("click", (event) => {
        document.getElementById("myMenu").style.visibility = "hidden";
      });
    });
```

### beforeunload事件

在卸载界面前弹出提示框。

```js
    window.addEventListener("beforeunload", (event) => {
      let message = "I'm really going to miss you if you go.";
      event.returnValue = message;
      return message;
    });
```

### DOMContentLoaded事件

window的load事件会在页面完全加载后触发，因为要等待很多外部资源加载完成，所以会花费较长时间。而DOMContentLoaded事件会在DOM树构建完成后立即触发，而不用等待图片、JavaScript文件、CSS文件或其他资源加载完成。相对于load事件，DOMContentLoaded可以让开发者在外部资源下载的同时就能指定事件处理程序，从而让用户能够更快地与页面交互。

## 设备事件

- orientationchange事件，判断设备水平还是垂直，需要通过window.orientation获得
- deviceorientation事件，获取加速计信息，返回左右、前后、扭转的度数。
- devicemotion事件，提示设备实际上在移动，而不仅仅是改变了朝向。

## 触摸及手势事件

- touchstart：手指放到屏幕上时触发（即使有一个手指已经放在了屏幕上）。
- touchmove：手指在屏幕上滑动时连续触发。在这个事件中调用preventDefault()可以阻止滚动。
- touchend：手指从屏幕上移开时触发。
- touchcancel：系统停止跟踪触摸时触发。文档中并未明确什么情况下停止跟踪。

除了这些公共的DOM属性，触摸事件还提供了以下3个属性用于跟踪触点。
- touches: **Touch对象**的数组，表示当前屏幕上的每个触点。
- targetTouches: Touch对象的数组，表示特定于事件目标的触点。
- changedTouches: Touch对象的数组，表示自上次用户动作之后变化的触点。

每个Touch对象都包含下列属性。
- clientX：触点在视口中的x坐标。
- clientY：触点在视口中的y坐标。
- identifier：触点ID。
- pageX：触点在页面上的x坐标。
- pageY：触点在页面上的y坐标。
- screenX：触点在屏幕上的x坐标。
- screenY：触点在屏幕上的y坐标。
- target：触摸事件的事件目标。

## 内存与性能

在JavaScript中，页面中事件处理程序的数量与页面整体性能直接相关。原因有很多。首先，每个函数都是对象，都占用内存空间，对象越多，性能越差。其次，为指定事件处理程序所需访问DOM的次数会先期造成整个页面交互的延迟。只要在使用事件处理程序时多注意一些方法，就可以改善页面性能。

### 事件委托

“过多事件处理程序”的解决方案是使用事件委托。事件委托利用事件冒泡，可以只使用一个事件处理程序来管理一种类型的事件。例如，click事件冒泡到document。这意味着可以为整个页面指定一个onclick事件处理程序，而不用为每个可点击元素分别指定事件处理程序。

例如下面的例子中，`list`是父级`ul`元素，`event.target`指向了实际的目标。因为所有列表项都是这个元素的后代，所以它们的事件会向上冒泡，最终都会由这个函数来处理。相对于前面不使用事件委托的代码，这里的代码不会导致先期延迟，因为**只访问了一个DOM元素和添加了一个事件处理程序**。结果对用户来说没有区别，但这种方式占用内存更少。
```js
    let list = document.getElementById("myLinks");
    list.addEventListener("click", (event) => {
      let target = event.target;
      switch(target.id) {
        case "doSomething":
          document.title = "I changed the document's title";
          break;
        case "goSomewhere":
          location.href = "http:// www.wrox.com";
          break;
        case "sayHi":
          console.log("hi");
          break;
      }
    });
```

事件委托具有如下优点：
- document对象随时可用，任何时候都可以给它添加事件处理程序（不用等待DOMContentLoaded或load事件）。这意味着只要页面渲染出可点击的元素，就可以无延迟地起作用。
- 节省花在设置页面事件处理程序上的时间。只指定一个事件处理程序既可以节省DOM引用，也可以节省时间。
- 减少整个页面所需的内存，提升整体性能。

### 删除事件处理程序

很多Web应用性能不佳都是由于无用的事件处理程序长驻内存导致的，原因主要有两个：

1. 删除带有事件处理程序的元素。比如通过真正的DOM方法removeChild()或replaceChild()删除节点。最常见的还是使用innerHTML整体替换页面的某一部分。这时候，被innerHTML删除的元素上如果有事件处理程序，就**不会被垃圾收集**程序正常清理。所以最好先把事件设为null，再整体替换。（但是后续浏览器都使用了标记清除和分代收集，理论上这种情况的内存泄漏应该不常见了）
2. 页面卸载。同样，IE8及更早版本在这种情况下有很多问题，不过好像所有浏览器都会受这个问题影响。如果在页面卸载后事件处理程序没有被清理，则它们仍然会残留在内存中。之后，浏览器每次加载和卸载页面（比如通过前进、后退或刷新），内存中残留对象的数量都会增加，这是因为事件处理程序不会被回收。

一般来说，最好在onunload事件处理程序中趁页面尚未卸载先删除所有事件处理程序。这时候也能体现使用事件委托的优势，因为事件处理程序很少，所以很容易记住要删除哪些。关于卸载页面时的清理，**onload事件处理程序中做了什么，最好在onunload事件处理程序中恢复。**

## 模拟事件

任何时候，都可以使用document.createEvent()方法创建一个event对象。这个方法接收一个参数，此参数是一个表示要创建事件类型的字符串。

创建event对象之后，需要使用事件相关的信息来初始化。每种类型的event对象都有特定的方法，可以使用相应数据来完成初始化。方法的名字并不相同，这取决于调用createEvent()时传入的参数。

事件模拟的最后一步是触发事件。为此要使用`dispatchEvent()`方法，这个方法存在于所有支持事件的DOM节点之上。`dispatchEvent()`方法接收一个参数，即表示要触发事件的event对象。调用`dispatchEvent()`方法之后，事件就“转正”了，接着便冒泡并触发事件处理程序执行。

例如：

```js
    let btn = document.getElementById("myBtn");
    // 创建event对象
    let event = document.createEvent("MouseEvents");
    // 初始化event对象
    event.initMouseEvent("click", true, true, document.defaultView,
                          0, 0, 0, 0, 0, false, false, false, false, 0, null);
    // 触发事件
    btn.dispatchEvent(event);
```
