---
title: 学习笔记 | JS 高级程序设计-第26章-模块
pubDate: 2024-05-01 22:00:00.0
updated: 2024-05-01 22:00:00.0
categories: ['学习笔记']
tags: ['TS',  'Web开发']
description: ' '
---

## 前言

这一章内容太细了，我只记录一下我可能会使用到的几个模块的原理。

## CommonJS

1. exports 记录当前模块导出的变量。
2. module 记录当前模块的详细信息。
3. require 进行模块的导入。

### exports

首先来看exports导出，面试经常会问的一个题目是exports和module.exports区别是什么。两者指向同一块内存，但是使用并不是完全等价的。

1. 当绑定一个属性时，两者相同。

```js
exports.propA = 'A';
module.exports.propB = 'B';
```

2. 不能直接赋值给exports，也就是不能直接使用exports={}这种语法。

```js
// 失败
exports = {propA:'A'};
// 成功
module.exports = {propB:'B'};
```

虽然两者指向同一块内存，但最后被导出的是module.exports，所以不能直接赋值给exports。
同样的道理，只要最后直接给module.exports赋值了，之前绑定的属性都会被覆盖掉。

```js
exports.propA = 'A';
module.exports.propB = 'B';
module.exports = {propC:'C'};
```

用上面的例子所示，先是绑定了两个属性propA和propB，接着给module.exports赋值，最后能成功导出的只有propC。

### require

CommonJS的引入特点是值的拷贝，简单来说就是把导出值复制一份，放到一块新的内存中。

### 循环引入

AB模块间的互相引用，本应是个死循环，但是实际并没有，因为CommonJS做了特殊处理——**模块缓存**。

例子：

```js
//index.js
var a = require('./a')
console.log('入口模块引用a模块：',a)
// a.js
exports.a = '原始值-a模块内变量'
var b = require('./b')
console.log('a模块引用b模块：',b)
exports.a = '修改值-a模块内变量'
// b.js
exports.b ='原始值-b模块内变量'
var a = require('./a')
console.log('b模块引用a模块',a)
exports.b = '修改值-b模块内变量'
```

1. 【入口模块】开始执行，把入口模块加入缓存。
2. var a = require('./a') 执行 将a模块加入缓存，进入a模块。
3. 【a模块】exports.a = '原始值-a模块内变量'执行，a模块的缓存中给变量a初始化，为原始值。
4. 执行var b = require('./b')，将b模块加入缓存，进入b模块。
5. 【b模块】exports.b ='原始值-b模块内变量'，b模块的缓存中给变量b初始化，为原始值。
6. var a = require('./a')，尝试导入a模块，发现已有a模块的缓存，所以不会进入执行，而是直接取a模块的缓存，此时打印{ a: '原始值-a模块内变量' }。
7. exports.b = '修改值-b模块内变量 执行，将b模块的缓存中变量b替换成修改值。
8. 【a模块】console.log('a模块引用b模块：',b) 执行，取缓存中的值，打印{ b: '修改值-b模块内变量' }。
9. exports.a = '修改值-a模块内变量' 执行，将a模块缓存中的变量a替换成修改值。
10. 【入口模块】console.log('入口模块引用a模块：',a) 执行，取缓存中的值，打印{ a: '修改值-a模块内变量' }。

上面就是对循环引用的处理过程，循环引用无非是要解决两个问题，怎么避免死循环以及输出的值是什么。CommonJS通过模块缓存来解决：每一个模块都先加入缓存再执行，每次遇到require都先检查缓存，这样就不会出现死循环；借助缓存，输出的值也很简单就能找到了。

### 路径解析规则

比如，为什么我们导入时直接简单写一个'react'就正确找到包的位置。
原因是，module这个对象中，还包括了paths这个路径。

首先把路径作一个简单分类：内置的核心模块、本地的文件模块和第三方模块。

1. 对于核心模块，node将其已经编译成二进制代码，直接书写标识符fs、http就可以。
2. 对于自己写的文件模块，需要用‘./’'../'开头，require会将这种相对路径转化为真实路径，找到模块。
3. 对于第三方模块，也就是使用npm下载的包，就会用到paths这个变量，会依次查找当前路径下的node_modules文件夹，如果没有，则在父级目录查找no_modules，一直到根目录下，找到为止。

在node_modules下找到对应包后，会以package.json文件下的main字段为准，找到包的入口，如果没有main字段，则查找index.js/index.json/index.node。

## ES Module

ECMAScript 6模块是作为一整块JavaScript代码而存在的。带有`type="module"`属性的`<script>`标签会告诉浏览器相关代码应该作为模块执行，而不是作为传统的脚本执行（行为类似defer）。

### export

ES Module导出的是一份**值的引用**，CommonJS则是一份值的拷贝。也就是说，CommonJS是把暴露的对象拷贝一份，放在新的一块内存中，每次直接在新的内存中取值，所以对变量修改没有办法同步；而ES Module则是指向同一块内存，模块实际导出的是这块内存的地址，每当用到时根据地址找到对应的内存空间，这样就实现了所谓的“动态绑定”。

两种导出模式可以共用：

```js
    const foo = 'foo';
    const bar = 'bar';
    export { foo as default, bar };
```

### import

ES module会根据import关系构建一棵依赖树，遍历到树的叶子模块后，然后根据依赖关系，反向找到父模块，将export/import指向同一地址。

如果在浏览器中通过标识符原生加载模块，则文件必须带有`.js`扩展名，不然可能无法正确解析。不过，如果是通过构建工具或第三方模块加载器打包或解析的ES6模块，则可能不需要包含文件扩展名。

导入对模块而言是**只读**的，实际上相当于`const`声明的变量。在使用`*`执行批量导入时，赋值给别名的命名导出就好像使用`Object.freeze()`冻结过一样。直接修改导出的值是不可能的，但可以修改导出对象的属性。同样，也不能给导出的集合添加或删除导出的属性。要修改导出的值，必须使用有内部变量和属性访问权限的导出方法。

```js
    import foo, * as Foo './foo.js';
    foo = 'foo';      // 错误
    Foo.foo = 'foo'; // 错误
    foo.bar = 'bar'; // 允许
```

```js
    // 默认导出的等效方式
    import { default as foo } from './foo.js';
    import foo from './foo.js';

    import foo, { bar, baz } from './foo.js';
    import { default as foo, bar, baz } from './foo.js';
    import foo, * as Foo from './foo.js';
```

#### 向下兼容

```html
    // 支持模块的浏览器会执行这段脚本
    // 不支持模块的浏览器不会执行这段脚本
    <script type="module"src="module.js"></script>
    // 支持模块的浏览器不会执行这段脚本
    // 不支持模块的浏览器会执行这段脚本
    <script nomodule src="script.js"></script>
```

### 循环引入

和CommonJS一样，发生循环引用时并不会导致死循环，但两者的处理方式大有不同。CommonJS对循环引用的处理基于他的缓存，即：将导出值拷贝一份，放在一块新的内存，用到的时候直接读取这块内存。

但ES module导出的是一个索引——内存地址，没有办法这样处理。**它依赖的是“模块地图”和“模块记录”**，模块地图在下面会解释，而模块记录是好比每个模块的“身份证”，记录着一些关键信息——这个模块导出值的的内存地址，加载状态，在其他模块导入时，会做一个“连接”——根据模块记录，把导入的变量指向同一块内存，这样就是实现了动态绑定。

下面这个例子，和之前的demo逻辑一样：入口模块引用a模块，a模块引用b模块，b模块又引用a模块，这种ab模块相互引用就形成了循环。

```js
// index.mjs
import * as a from './a.mjs'
console.log('入口模块引用a模块：',a)
// a.mjs
let a = "原始值-a模块内变量"
export { a }
import * as b from "./b.mjs"
console.log("a模块引用b模块：", b)
a = "修改值-a模块内变量"
// b.mjs
let b = "原始值-b模块内变量"
export { b }
import * as a from "./a.mjs"
console.log("b模块引用a模块：", a)
b = "修改值-b模块内变量"
```

可以看到，在b模块中引用a模块时，得到的值是uninitialized，接下来一步步分析代码的执行。

在代码执行前，首先要进行预处理，这一步会根据import和export来构建模块地图（Module Map），它类似于一颗树，树中的每一个“节点”就是一个模块记录，这个记录上会标注导出变量的内存地址，将导入的变量和导出的变量连接，即把他们指向同一块内存地址。不过此时这些内存都是空的，也就是看到的uninitialized。

接下来就是代码的一行行执行，import和export语句都是只能放在代码的顶层，也就是说不能写在函数或者if代码块中。

1. 【入口模块】首先进入入口模块，在模块地图中把入口模块的模块记录标记为“获取中”（Fetching），表示已经进入，但没执行完毕。
2. import * as a from './a.mjs' 执行，进入a模块，此时模块地图中a的模块记录标记为“获取中”。
3. 【a模块】import * as b from './b.mjs' 执行，进入b模块，此时模块地图中b的模块记录标记为“获取中”。
4. 【b模块】import * as a from './a.mjs' 执行，检查模块地图，模块a已经是Fetching态，不再进去。
5. let b = '原始值-b模块内变量' 模块记录中，存储b的内存块初始化。
6. console.log('b模块引用a模块：', a) 根据模块记录到指向的内存中取值，是{ a:}。
7. b = '修改值-b模块内变量' 模块记录中，存储b的内存块值修改。
8. 【a模块】let a = '原始值-a模块内变量' 模块记录中，存储a的内存块初始化。
9. console.log('a模块引用b模块：', b) 根据模块记录到指向的内存中取值，是{ b: '修改值-b模块内变量' }。
10. a = '修改值-a模块内变量' 模块记录中，存储a的内存块值修改。
11. 【入口模块】console.log('入口模块引用a模块：',a) 根据模块记录，到指向的内存中取值，是{ a: '修改值-a模块内变量' }。

总结一下：和上面一样，循环引用要解决的无非是两个问题，保证不进入死循环以及输出什么值。ES Module来处理循环使用一张模块间的依赖地图来解决死循环问题，标记进入过的模块为“获取中”，所以循环引用时不会再次进入；使用模块记录，标注要去哪块内存中取值，将导入导出做连接，解决了要输出什么值。
