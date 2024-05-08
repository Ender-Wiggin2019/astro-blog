---
title: 学习笔记 | JS 高级程序设计-第27章-工作者线程
pubDate: 2024-05-01 22:01:00.0
updated: 2024-05-01 22:01:00.0
categories: ['学习笔记']
tags: ['TS',  'Web开发']
description: ' '
---

## 前言

工作者线程允许把主线程的工作转嫁给独立的实体，而不会改变现有的单线程模型。

使用工作者线程，浏览器可以在原始页面环境之外再分配一个完全独立的二级子环境。这个子环境不能与依赖单线程交互的API（如DOM）互操作，但可以与父环境并行执行代码。

工作者线程与线程有很多类似之处，但也有重要的区别：

1. **工作者线程不共享全部内存**。在传统线程模型中，多线程有能力读写共享内存空间。除了SharedArrayBuffer外，从工作者线程进出的数据需要复制或转移
2. **工作者线程不一定在同一个进程里**。通常，一个进程可以在内部产生多个线程。根据浏览器引擎的实现，工作者线程可能与页面属于同一进程，也可能不属于。例如，Chrome的Blink引擎对共享工作者线程和服务工作者线程使用独立的进程
3. **创建工作者线程的开销更大**。工作者线程有自己独立的事件循环、全局对象、事件处理程序和其他JavaScript环境必需的特性。创建这些结构的代价不容忽视

工作者线程相对比较重，不建议大量使用。例如，对一张400万像素的图片，为每个像素都启动一个工作者线程是不合适的。通常，工作者线程应该是长期运行的，启动成本比较高，每个实例占用的内存也比较大。

### 工作者线程的类型

1. 专用工作者线程，只能被创建它的页面使用
2. 共享工作者线程，可以被多个不同的上下文使用，包括不同的页面。任何与创建共享工作者线程的脚本同源的脚本，都可以向共享工作者线程发送消息或从中接收消息
3. 服务工作者线程，要用途是拦截、重定向和修改页面发出的请求

### WorkerGlobalScope

全局对象是`WorkerGlobalScope`的实例，通过`self`关键字暴露出来。

self上可用的属性是window对象上属性的严格子集。其中有些属性会返回特定于工作者线程的版本。

### 专用工作者线程

创建专用工作者线程最常见的方式是加载JavaScript文件。把文件路径提供给Worker构造函数，然后构造函数再在后台异步加载脚本并实例化工作者线程。传给构造函数的文件路径可以是多种形式。

```js
    // emptyWorker.js
    // 空的JS工作者线程文件
    // main.js
    console.log(location.href); // "https://example.com/"
    const worker = new Worker(location.href+'emptyWorker.js');
    console.log(worker);          // Worker {}
```

工作者线程的脚本文件只能从与父页面相同的源加载。从其他源加载工作者线程的脚本文件会导致错误。

#### 与专用工作者线程通信

与工作者线程的通信都是通过异步消息完成的，但这些消息可以有多种形式。

1. 使用postMessage()，最简单也最常用的形式是使用postMessage()传递序列化的消息。
2. 使用MessageChannel，基于该API可以在两个上下文间明确建立通信渠道（很复杂，不推荐，主要意义是两个工作者线程直接的通信）。

```js
    // worker.js
    // 在监听器中存储全局messagePort
    let messagePort = null;
    function factorial(n) {
      let result = 1;
      while(n) { result ＊= n--; }
      return result;
    }
    // 在全局对象上添加消息处理程序
    self.onmessage = ({ports}) => {
      // 只设置一次端口
      if (! messagePort) {
        // 初始化消息发送端口，
        // 给变量赋值并重置监听器
        messagePort=ports[0];
        self.onmessage = null;
        // 在全局对象上设置消息处理程序
        messagePort.onmessage = ({data}) => {
          // 收到消息后发送数据
          messagePort.postMessage(`${data}! = ${factorial(data)}`);
        };
      }
    };
    // main.js
    const channel=new MessageChannel();
    const factorialWorker = new Worker('./worker.js');
    // 把`MessagePort`对象发送到工作者线程
    // 工作者线程负责处理初始化信道
    factorialWorker.postMessage(null, [channel.port1]);
    // 通过信道实际发送数据
    channel.port2.onmessage=({data})=>console.log(data);
    // 工作者线程通过信道响应
    channel.port2.postMessage(5);
    // 5! = 120
```

3. 使用BroadcastChannel，同源脚本能够通过BroadcastChannel相互之间发送和接收消息，比较简单。

### 工作者线程数据传输

使用工作者线程时，经常需要为它们提供某种形式的数据负载。工作者线程是独立的上下文，因此在上下文之间传输数据就会产生消耗。

在支持传统多线程模型的语言中，可以使用锁、互斥量，以及volatile变量。

在JavaScript中，有三种在上下文间转移信息的方式：

1. 结构化克隆算法（structuredclone algorithm）
2. 可转移对象（transferableobjects）
3. 共享数组缓冲区（shared arraybuffers，之前有漏洞，现在逐步重启，传递的是缓冲区中的引用）

#### 结构化克隆算法

结构化克隆算法可用于在两个独立上下文间共享数据。该算法由浏览器在后台实现，不能直接调用。在通过postMessage()传递对象时，浏览器会遍历该对象，并在目标上下文中生成它的一个**副本**。

#### 可转移对象

使用可转移对象（transferable objects）可以把所有权从一个上下文转移到另一个上下文。在不太可能在上下文间复制大量数据的情况下，这个功能特别有用。只有如下几种对象是可转移对象：

- ArrayBuffer
- MessagePort
- ImageBitmap
- OffscreenCanvas

**postMessage()方法的第二个可选参数是数组，它指定应该将哪些对象转移到目标上下文。**

### 共享工作者线程

共享线程适合开发者希望通过在多个上下文间共享线程减少计算性消耗的情形。比如，可以用一个共享线程管理**多个同源页面WebSocket消息的发送与接收**。共享线程也可以用在同源上下文希望通过一个线程通信的情形。

### 服务工作者线程

服务工作者线程在两个主要任务上最有用：充当网络请求的缓存层和启用推送通知。在这个意义上，服务工作者线程就是用于把网页变成像原生应用程序一样的工具。

#### ServiceWorkerContainer

服务工作者线程与专用工作者线程或共享工作者线程的一个区别是没有全局构造函数。服务工作者线程是通过ServiceWorkerContainer来管理的，它的实例保存在navigator.serviceWorker属性中。

#### 创建服务工作者线程

与共享工作者线程类似，服务工作者线程同样是在还不存在时创建新实例，在存在时连接到已有实例。ServiceWorkerContainer没有通过全局构造函数创建，而是暴露了register()方法：

```js
    navigator.serviceWorker.register('./emptyServiceWorker.js');
```

register()方法返回一个期约，该期约解决为ServiceWorkerRegistration对象，或在注册失败时拒绝。

由于服务工作者线程几乎可以任意修改和重定向网络请求，以及加载静态资源，服务工作者线程API只能在安全上下文（HTTPS）下使用。

#### 缓存

- 服务工作者线程缓存不自动缓存任何请求。所有缓存都必须明确指定
- 服务工作者线程缓存没有到期失效的概念。除非明确删除，否则缓存内容一直有效
- 服务工作者线程缓存必须手动更新和删除
- 缓存版本必须手动管理。每次服务工作者线程更新，新服务工作者线程负责提供新的缓存键以保存新缓存
- 唯一的浏览器强制逐出策略基于服务工作者线程缓存占用的空间
- 服务工作者线程负责管理自己缓存占用的空间
- 缓存超过浏览器限制时，浏览器会基于最近最少使用（LRU, LeastRecently Used）原则为新缓存腾出空间。

#### 推送通知

对于模拟原生应用程序的Web应用程序而言（PWA, Progressive Web Apps），必须支持推送消息。这意味着网页必须能够接收服务器的推送事件，然后在设备上显示通知（即使应用程序没有运行）。当然，这在常规网页中肯定是不可能的。不过，有了服务工作者线程就可以实现该行为。

服务工作者线程可以通过它们的注册对象使用Notification API。这样做有很好的理由：与服务工作者线程关联的通知也会触发服务工作者线程内部的交互事件。

```js
    navigator.serviceWorker.register('./serviceWorker.js')
    .then((registration) => {
      Notification.requestPermission()
      .then((status)=>{
        if(status==='granted'){
          registration.showNotification('foo');
        }
      });
    });
```

```js
    self.onactivate = () => self.registration.showNotification('bar');
```