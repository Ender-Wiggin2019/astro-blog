---
title: 技术 | 从零开始的 Vscode 刷题之旅
pubDate: 2024-09-21 22:03:00.0
updated: 2024-09-21 22:03:00.0
categories: ['学习笔记']
tags: ['Web开发']
description: '为小白准备的本地化刷题调试攻略'
---

本文是面向代码小白的 Vscode 刷题攻略，这里的小白可以是：

1. 不熟悉编程工具
2. 不熟悉编程语言
3. 不熟悉调试方式

不论是因为找工作需要刷题，还是出于个人兴趣想进入算法的世界，还是试图找到一个比网上刷题更方便的本地化方案，这篇文章都可以提供一个非常基础的教程。

## 一、安装编辑器

进入[Visual Studio Code 官网](https://code.visualstudio.com/)直接下载即可，这是目前最强大 IDE 之一。
为什么说是之一呢，因为现在还有一款站在 Vscode 肩膀上大幅加强 AI 功能的 [Cursor](https://www.cursor.com/)，号称可以让小白在 2 个小时之内写出一个应用，感兴趣的也可以试一试。
另外，还有一款开源的 AI 编辑器，截止到本文写作时间这款产品还在 waitlist 阶段，感兴趣的可以先排个队 [Void](https://voideditor.com/)。

由于后两者本质上也是 Vscode，所以下面还是以 Vscode 为例。

## 二、配置环境

不论是什么语言，在本地运行都是需要配置环境的，下面以 JS 为例：

1. 安装 [Node.js](https://nodejs.org/en/download/prebuilt-installer)。这是 JS 的运行时，有了它才可以在本地运行。
2. 在命令行输入 `node -v`，检查是否安装成功。

```
node -v
# v21.1.0
```

这部分如果有问题可以上网找教程，属于是第一难了，文章还是非常多的。

## 三、本地运行代码

本地相较于线上运行的优势在于：
1. 更好的语法提示和编程便携性
2. 0时延的流畅体验
3. 更方便的代码调试

这里推荐安装 `Code Runner` 插件，提供了几乎所有主流语言的快捷运行方式。安装方式如下；

![picgo-2024-09-21-001532..jpg](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/picgo-2024-09-21-001532..jpg)

另外，也可以自己在插件市场中寻寻宝，里面有非常多好东西。比如[中文语言包插件](https://marketplace.visualstudio.com/items?itemName=MS-CEINTL.vscode-language-pack-zh-hans)，还有以前上班摸鱼时必做的换肤，甚至可以换成[麦当劳主题](https://vscodethemes.com/e/samuelepignone.fakedonalds/fakedonalds)。

新建文件输入经典的 `Hello World`，右键并找到 `Run Code`，就可以看到代码的运行结果啦！好耶！

![picgo-2024-09-21-001533..jpg](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/picgo-2024-09-21-001533..jpg)


注意，如果代码无限循环了，是无法直接关闭 Tab 终止的。需要在 `OUTPUT` 里面右键并点击停止。运行代码和终止代码都是有内置快捷键的，记忆力好的可以记一下，用起来很爽。
![picgo-2024-09-21-001526..jpg](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/picgo-2024-09-21-001526..jpg)

## 四、调试基础


大道至简的调试方式就是打印，比如 JS 就是 `console.log`。在遇到 bug 时，打日志是最“低级”，但又最有效的方式。

![image.png](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/20240921005735.png)

当然，可能有些懒人会觉得输入几个单词才能调试有点累，那么可以使用 Vscode 对应语言的 Snippet 插件。比如下方的 JS Snippet，意义就是当你输入 `cl` 的时候，点击 tab 就会自动补全
`console.log`，这就节约了宝贵了一秒钟时间！用个 3600次就可以节约下来一小时打黑神话了！

![picgo-2024-09-21-001534..jpg](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/picgo-2024-09-21-001534..jpg)

![picgo-2024-09-21-001529..jpg](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/picgo-2024-09-21-001529..jpg)

## 五、进阶一：断点调试

因为本文关注的是本地刷题调试，因此不涉及各种工程调试和Web端调试，仅介绍一下非常简单的 Vscode 断点调试功能，并且这对于刷题来说已经绰绰有余了。
一般什么时候需要断点呢？以我的感受来说，当涉及多变量交互，以及递归等多轮执行的时候，断点会比直接 print 更直观，因为可以一步一步执行。

其实流程也非常简单，点击 Vscode 的调试页面，点击启动 Debugger，然后**打断点**（点击代码行数数字的左侧，会冒出一个小红点）。断点的意思就是代码运行到这一步时会暂停，需要手动点击继续运行（上方播放条），就和逐帧播放电影一样。
![picgo-2024-09-21-001535..jpg](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/picgo-2024-09-21-001535..jpg)

断点的好处是可以非常清晰的显示当前所有变量 （左侧区域），因此对于小白了解代码运行大有裨益。某种意义上也算“程序自己会说话”了，那些图解算法本质上也只是动态展示运行变量。

## 六、进阶二：Leetcode

如果想刷 Leetcode，强烈推荐 Leetcode 插件。安装后登录，就可以在本地写代码，然后点击提交后上传到网站上校验。关于配置网上教程很多，例如 [在 VsCode 中优雅的刷 LeetCode](https://juejin.cn/post/7044565186656600072)，暂不赘述。

这个插件最大的意义是，可以和前文所述的调试结合起来，带来非常高效的编程体验。实际上算法题思考和调试的时间是远大于编程时间的，毕竟有些 Hard 题代码量其实也不大。

另外，在 `// @lc code=end` 这一行之后是不会提交到网站上的。我一般的实践就是，在这一行后面模拟数据。并且因为是本地文件，随时我都可以运行这个文件，而不需要连接网络。
![picgo-2024-09-21-001536..jpg](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/picgo-2024-09-21-001536..jpg)

就我个人而言，当配置好这一套之后，刷题的动力都多了几分，感觉还有点意思~



