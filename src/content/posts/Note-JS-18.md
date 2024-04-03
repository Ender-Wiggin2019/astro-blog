---
title: 学习笔记 | JS 高级程序设计-第17章-动画与Canvas
pubDate: 2024-02-28 21:00:00.0
updated: 2024-02-28 21:00:00.0
categories: ['学习笔记']
tags: ['TS',  'Web开发']
description: ' '
---

## requestAnimationFrame

早期在JavaScript中创建动画基本上就是使用`setInterval()`来控制动画的执行。下面的例子展示了使用`setInterval()`的基本模式：

```js
    (function() {
      function updateAnimations() {
        doAnimation1();
        doAnimation2();
        // 其他任务
      }
      setInterval(updateAnimations, 100);
    })();
```

但是毫秒延时并不是说何时这些代码会执行，而只是说到时候会把回调加到任务队列。如果添加到队列后，主线程还被其他任务占用，比如正在处理用户操作，那么回调就不会马上执行。

浏览器自身计时器的精度让这个问题雪上加霜，比如chrome的精度是4毫秒，那么任何0-4直接的值只能是0或者4。

而`requestAnimationFrame()`方法接收一个参数，此参数是一个要在重绘屏幕前调用的函数。这个函数就是修改DOM样式以反映下一次重绘有什么变化的地方。为了实现动画循环，可以把多个`requestAnimationFrame()`调用串联起来，就像以前使用`setTimeout()`时一样：

```js
    function updateProgress() {
      var div = document.getElementById("status");
      div.style.width = (parseInt(div.style.width, 10) + 5) + "%";
      if (div.style.left ! = "100%") {
      requestAnimationFrame(updateProgress);
      }
    }
    requestAnimationFrame(updateProgress);
```

另外，传给`requestAnimationFrame()`的函数实际上可以接收一个参数，此参数是一个DOMHighRes-TimeStamp的实例（比如`performance.now()`返回的值），表示**下次重绘的时间**。这一点非常重要：`requestAnimationFrame()`实际上把重绘任务安排在了未来一个已知的时间点上，而且通过这个参数告诉了开发者。基于这个参数，就可以更好地决定如何调优动画了。

## cancelAnimationFrame

与setTimeout()类似，requestAnimationFrame()也返回一个请求ID，可以用于通过另一个方法cancelAnimationFrame()来取消重绘任务。下面的例子展示了刚把一个任务加入队列又立即将其取消：

```js
    let requestID = window.requestAnimationFrame(() => {
      console.log('Repaint! ');
    });
    window.cancelAnimationFrame(requestID);
```

## 通过requestAnimationFrame节流

requestAnimationFrame这个名字有时候会让人误解，因为看不出来它跟排期任务有关。支持这个方法的浏览器实际上会暴露出作为钩子的回调队列。所谓钩子（hook），就是浏览器在执行下一次重绘之前的一个点。这个回调队列是一个可修改的函数列表，包含应该在重绘之前调用的函数。每次调用requestAnimationFrame()都会在队列上推入一个回调函数，队列的长度没有限制。

这个回调队列的行为不一定跟动画有关。不过，通过requestAnimationFrame()递归地向队列中加入回调函数，可以保证每次重绘最多只调用一次回调函数。这是一个非常好的节流工具。在频繁执行影响页面外观的代码时（比如滚动事件监听器），可以利用这个回调队列进行节流。

先来看一个原生实现：

```js
    function expensiveOperation() {
      console.log('Invoked at', Date.now());
    }
    window.addEventListener('scroll', () => {
      expensiveOperation();
    });
```

如果想把事件处理程序的调用限制在每次重绘前发生，那么可以像这样下面把它封装到request-AnimationFrame()调用中：

```js
    function expensiveOperation() {
      console.log('Invoked at', Date.now());
    }
    window.addEventListener('scroll', () => {
      window.requestAnimationFrame(expensiveOperation);
    });
```

这样会把所有回调的执行集中在重绘钩子，但不会过滤掉每次重绘的多余调用。此时，定义一个标志变量，由回调设置其开关状态，就可以将多余的调用屏蔽：

```js
    letenqueued=false;
    function expensiveOperation() {
      console.log('Invoked at', Date.now());
      enqueued=false;
    }
    window.addEventListener('scroll', () => {
      if(!enqueued){
        enqueued=true;
        window.requestAnimationFrame(expensiveOperation);
      }
    });
```

也可以通过闭包实现。

## Canvas

至少需要设置宽高，中间的内容是无法显示时的fallback：

```html
    <canvas id="drawing" width="200" height="200">A drawing of something.</canvas>
```

要在画布上绘制图形，首先要取得绘图上下文。使用`getContext()`方法可以获取对绘图上下文的引用。对于平面图形，需要给这个方法传入参数"2d"，表示要获取2D上下文对象：

```js
    let drawing = document.getElementById("drawing");
    // 确保浏览器支持<canvas>
    if (drawing.getContext) {
      let context = drawing.getContext("2d");
      // 其他代码
    }
```

可以使用toDataURL()方法导出`<canvas>`元素上的图像。这个方法接收一个参数：要生成图像的MIME类型（与用来创建图形的上下文无关）。例如，要从画布上导出一张PNG格式的图片，可以这样做：

```js
    let drawing = document.getElementById("drawing");
    // 确保浏览器支持<canvas>
    if (drawing.getContext) {
      // 取得图像的数据URI
      let imgURI = drawing.toDataURL("image/png");
      // 显示图片
      let image = document.createElement("img");
      image.src = imgURI;
      document.body.appendChild(image);
    }
```

### 填充和描边

填充以指定样式（颜色、渐变或图像）自动填充形状，而描边只为图形边界着色。大多数2D上下文操作有填充和描边的变体，显示效果取决于两个属性：`fillStyle`和`strokeStyle`。

### 绘制矩形

矩形是唯一一个可以直接在2D绘图上下文中绘制的形状。与绘制矩形相关的方法有3个：`fillRect()`、`strokeRect()`和`clearRect()`。这些方法都接收4个参数：矩形x坐标、矩形y坐标、矩形宽度和矩形高度。这几个参数的单位都是像素。

```js
    let drawing = document.getElementById("drawing");
    // 确保浏览器支持<canvas>
    if (drawing.getContext) {
      let context = drawing.getContext("2d");
      /＊
        ＊ 引自MDN文档
        ＊/
      // 绘制红色矩形
      context.fillStyle = "#ff0000";
      context.fillRect(10, 10, 50, 50);
      // 绘制半透明蓝色矩形
      context.fillStyle = "rgba(0,0,255,0.5)";
      context.fillRect(30, 30, 50, 50);
      //在前两个矩形重叠的区域擦除一个矩形区域
      context.clearRect(40, 40, 10, 10);
    }
```

### 绘制路径

2D绘图上下文支持很多在画布上绘制路径的方法。通过路径可以创建复杂的形状和线条。要绘制路径，必须首先调用`beginPath()`方法以表示要开始绘制新路径。然后，再调用下列方法来绘制路径:

- `arc()` 和 `arcTo()`
- `bezierCurveTo()`
- `lineTo()`
- `moveTo()` 单纯移动光标到指定位置
- `quadraticCurveTo()`
- `rect()` 建立的是矩形的路径而不是图形

创建路径之后，可以使用`closePath()`方法绘制一条返回起点的线。如果路径已经完成，则既可以指定`fillStyle`属性并调用`fill()`方法来填充路径，也可以指定`strokeStyle`属性并调用`stroke()`方法来描画路径，还可以调用`clip()`方法基于已有路径创建一个新剪切区域。

### 绘制文本

2D绘图上下文还提供了绘制文本的方法，即fillText()和strokeText()。这两个方法都接收4个参数：要绘制的字符串、x坐标、y坐标和可选的最大像素宽度（如果超出会水平压缩）。

```js
    context.font = "bold 14px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("12", 100, 20);
```

由于绘制文本很复杂，特别是想把文本绘制到特定区域的时候，因此2D上下文提供了用于**辅助确定文本大小**的`measureText()`方法。这个方法接收一个参数，即要绘制的文本，然后返回一个`TextMetrics`对象。这个返回的对象目前只有一个属性`width`，不过将来应该会增加更多度量指标。

示例：字体大小自适应宽度：

```js
    let fontSize = 100;
    context.font = fontSize + "px Arial";
    while(context.measureText("Hello world! ").width > 140) {
      fontSize--;
      context.font = fontSize + "px Arial";
    }
    context.fillText("Hello world! ", 10, 10);
    context.fillText("Font size is " + fontSize + "px", 10, 50);
```

### 变换

- rotate(angle)：围绕原点把图像旋转angle弧度。
- scale(scaleX, scaleY)：通过在x轴乘以scaleX、在y轴乘以scaleY来缩放图像。scaleX和scaleY的默认值都是1.0。
- translate(x, y)：把原点移动到(x, y)。执行这个操作后，坐标(0, 0)就会变成(x, y)。
- transform(m1_1, m1_2, m2_1, m2_2, dx, dy)：像下面这样通过矩阵乘法直接修改矩阵。

如果想着什么时候再回到当前的属性和变换状态，可以调用`save()`方法。调用这个方法后，所有这一时刻的**设置和变换**会被放到一个暂存栈中（内容不会保存）。保存之后，可以继续修改上下文。

而在需要恢复之前的上下文时，可以调用`restore()`方法。这个方法会从暂存栈中取出并恢复之前保存的设置。多次调用`save()`方法可以在暂存栈中存储多套设置，然后通过`restore()`可以系统地恢复。

### 绘制图像

```js
// HTML img 元素
    let image = document.images[0];
    context.drawImage(image, 10, 10);
```

结合其他一些方法，drawImage()方法可以方便地实现常见的图像操作。操作的结果可以使用toDataURL()方法获取。不过有一种情况例外：如果绘制的图像来自其他域而非当前页面，则不能获取其数据。此时，调用toDataURL()将抛出错误。比如，如果来自www.example.com的页面上绘制的是来自www.wrox.com的图像，则上下文就是“脏的”，获取数据时会抛出错误。

### 渐变

```js
    let gradient = context.createLinearGradient(30, 30, 70, 70);
    gradient.addColorStop(0, "white");
    gradient.addColorStop(1, "black");
```

从(30, 30)到(70, 70)绘制一个渐变。渐变的起点颜色为白色，终点颜色为黑色。可以把这个对象赋给fillStyle或strokeStyle属性，从而以渐变填充或描画绘制的图形。

```js
    // 绘制红色矩形
    context.fillStyle = "#ff0000";
    context.fillRect(10, 10, 50, 50);
    // 绘制渐变矩形
    context.fillStyle=gradient;
    context.fillRect(30, 30, 50, 50);
```

注意，因为上面的渐变是固定的，底下使用渐变时不会根据矩形的大小进行自适应，因此可以封装函数让渐变跟随矩形大小：

```js
    function createRectLinearGradient(context, x, y, width, height) {
      return context.createLinearGradient(x, y, x+width, y+height);
    }
```

### 图案

图案是用于填充和描画图形的重复图像。要创建新图案，可以调用createPattern()方法并传入两个参数：一个HTML <img>元素和一个表示该如何重复图像的字符串。第二个参数的值与CSS的background-repeat属性是一样的，包括"repeat"、"repeat-x"、"repeat-y"和"no-repeat"。

## WebGL

第二种是3D上下文，也就是WebGL。WebGL是浏览器对OpenGL ES 2.0的实现。OpenGL ES 2.0是游戏图形开发常用的一个标准。WebGL支持比2D上下文更强大的绘图能力，包括：

- 用OpenGL着色器语言（GLSL）编写顶点和片段着色器；
- 支持定型数组，限定数组中包含数值的类型；
- 创建和操作纹理。

暂时略过具体细节。
