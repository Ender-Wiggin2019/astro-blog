---
title: 学习笔记 | JS 高级程序设计-第19章-表单
pubDate: 2024-02-28 22:00:00.0
updated: 2024-02-28 22:00:00.0
categories: ['学习笔记']
tags: ['TS',  '网站开发']
description: ' '
---

## 表单基础

Web表单在HTML中以`<form>`元素表示，在JavaScript中则以HTMLFormElement类型表示。HTMLFormElement类型继承自HTMLElement类型，因此拥有与其他HTML元素一样的默认属性。不过，HTMLFormElement也有自己的属性和方法。

### 提交表单

```html
    <! -- 通用提交按钮 -->
    <input type="submit" value="Submit Form">
    <! -- 自定义提交按钮 -->
    <button type="submit">Submit Form</button>
    <! -- 图片按钮 -->
    <input type="image" src="graphic.gif">
```

如果表单中有上述任何一个按钮，且焦点在表单中某个控件上，则按回车键也可以提交表单。

以这种方式提交表单会在向服务器发送请求之前触发submit事件。这样就提供了一个**验证表单数据**的机会，可以根据验证结果决定是否真的要提交。阻止这个事件的默认行为可以取消提交表单。例如，下面的代码会阻止表单提交：

```js
    let form = document.getElementById("myForm");
    form.addEventListener("submit", (event) => {
      // 阻止表单提交
      event.preventDefault();
    });
```

也可以通过js直接提交：

```js
    let form = document.getElementById("myForm");
    //提交表单
    form.submit();
```

为了避免多次重复提交，一般都处理方案是：
1. 在表单提交后禁用提交按钮
2. 通过onsubmit事件处理程序取消之后的表单提交

```js
    // 避免多次提交表单的代码
    let form = document.getElementById("myForm");
    form.addEventListener("submit", (event) => {
      let target = event.target;
      // 取得提交按钮
      let btn = target.elements["submit-btn"];
      // 禁用提交按钮
      btn.disabled = true;
    });
```

注意，这里的事件监听必须是`submit`，因为不同浏览器的事件触发时机不同，有的浏览器click先于submit触发，如果使用了`onclick`就会导致提交前被禁用。
### 重置表单

用户单击重置按钮（`type === 'reset'`）可以重置表单。一般不使用，影响用户体验。

### 表单字段

表单元素可以像页面中的其他元素一样使用原生DOM方法来访问。此外，所有表单元素都是表单elements属性（元素集合）中包含的一个值。这个elements集合是一个有序列表，包含对表单中所有字段的引用。

```js
    let form = document.getElementById("form1");
    // 取得表单中的第一个字段
    let field1 = form.elements[0];
    // 取得表单中名为"textbox1"的字段
    let field2 = form.elements["textbox1"];
    // 取得字段的数量
    let fieldCount = form.elements.length;
```

这个HTML中的表单有3个单选按钮的`name`是`"color"`，这个名字把它们联系在了一起。在访问`elements["color"]`时，返回的`NodeList`就包含这3个元素。而在访问`elements[0]`时，只会返回第一个元素。

### 公共属性与方法

表单存在公共属性，除了form属性（只读），其余属性均可以修改：

```js
    let form = document.getElementById("myForm");
    let field = form.elements[0];
    // 修改字段的值
    field.value = "Another value";
    // 检查字段所属的表单
    console.log(field.form === form);    // true
    // 给字段设置焦点
    field.focus();
    // 禁用字段
    field.disabled = true;
    // 改变字段的类型（不推荐，但对<input>来说是可能的）
    field.type = "checkbox";
```

每个表单字段都有两个公共方法：`focus()`和`blur()`。

focus()方法把浏览器焦点设置到表单字段，这意味着该字段会变成活动字段并可以响应键盘事件。比如，在页面加载后把焦点定位到表单中第一个字段就是很常见的做法。实现方法是监听load事件，然后在第一个字段上调用focus()：

```js
    window.addEventListener("load", (event) => {
      document.forms[0].elements[0].focus();
    });
```

但现在实际上可以直接自动对焦： `<input type="text" autofocus>`。

`focus()`的反向操作是`blur()`，其用于从元素上移除焦点。调用blur()时，焦点不会转移到任何特定元素，仅仅只是从调用这个方法的元素上移除了。

公共事件有：
- `blur`
- `change` (在`<input>`和`<textarea>`元素的value发生变化**且失去焦点**时触发，或者在`<select>`元素中选中项发生变化时触发。)
- `focus`

## 文本框

`<input>`元素显示为文本框，省略type属性会以"text"作为默认值。然后可以通过size属性指定文本框的宽度，这个宽度是以字符数来计量的。而value属性用于指定文本框的初始值，maxLength属性用于指定文本框允许的最多字符数。

`<textarea>`元素总是会创建多行文本框。可以使用rows属性指定这个文本框的高度，以字符数计量；以cols属性指定以字符数计量的文本框宽度，类似于`<input>`元素的size属性。与`<input>`不同的是，`<textarea>`的初始值必须包含在`<textarea>`和`</textarea>`之间。

#### 选择文本

```js
// 获得焦点后自动选中所有文本
    textbox.addEventListener("focus", (event) => {
      event.target.select();
    });
```

而当选中后，还会触发`select` 事件。

```js
// 如下参数可以获取到选中的起点和终点
    function getSelectedText(textbox){
      return textbox.value.substring(textbox.selectionStart,
                                      textbox.selectionEnd);
    }
```

#### 输入过滤

```js
// 屏蔽非数字的输入，charCode > 9 是为了避免屏蔽低版本浏览器对于退格删除这些键的keypress触发（高版本都不会）
    textbox.addEventListener("keypress", (event) => {
      if(!/\d/.test(String.fromCharCode(event.charCode))&&
          event.charCode>9&&
          !event.ctrlKey){
        event.preventDefault();
      }
    });
```

#### 剪贴版事件

- beforecopy：复制操作发生前触发
- copy：复制操作发生时触发
- beforecut：剪切操作发生前触发
- cut：剪切操作发生时触发
- beforepaste：粘贴操作发生前触发
- paste：粘贴操作发生时触发

一般浏览器只在剪贴板事件期间暴露clipboardData对象，包括3个方法：getData()、setData()和clearData()。数据除了IE均为MIME类型。

```js
// 只允许数字粘贴的实现
    textbox.addEventListener("paste", (event) => {
      let text = getClipboardText(event);
      if (! /^\d＊$/.test(text)){
        event.preventDefault();
      }
    });
```

#### 自动切换

多个输入框时，当一个长度到达最大值，自动切换到下一个
```js
    <script>
      function tabForward(event){
        let target = event.target;
        if (target.value.length == target.maxLength){
          let form = target.form; // 指向form的引用
          for (let i = 0, len = form.elements.length; i < len; i++) {
            if (form.elements[i] == target) {
              if (form.elements[i+1]) {
                form.elements[i+1].focus();
              }
              return;
            }
          }
        }
      }
      let inputIds = ["txtTel1", "txtTel2", "txtTel3"];
      for (let id of inputIds) {
        let textbox = document.getElementById(id);
        textbox.addEventListener("keyup", tabForward);
      }
      let textbox1 = document.getElementById("txtTel1");
      let textbox2 = document.getElementById("txtTel2");
      let textbox3 = document.getElementById("txtTel3");
    </script>
```

### HTML5约束验证API

1. 必填：`<input type="text" name="username" required>`
2. `type='email'或'url'`的内置验证，但局限性较大
3. 输入模式：`<input type="text" pattern="\d+" name="count">` 自带输入检测
4. `checkValidity()`检测表单中任意给定字段或整个表单是否有效
5. `validity` 返回一系列对象，说明哪些值有效或无效
6. ` novalidate`属性可以禁止对表单进行任何验证

## 选择框

选择框是使用`<select>`和`<option>`元素创建的。为方便交互，HTMLSelectElement类型在所有表单字段的公共能力之外又提供了以下属性和方法。
- add(newOption, relOption)：在relOption之前向控件中添加新的`<option>`
- multiple：布尔值，表示是否允许多选，等价于HTML的multiple属性
- options：控件中所有`<option>`元素的HTMLCollection
- remove(index)：移除给定位置的选项
- selectedIndex：选中项基于0的索引值，如果没有选中项则为-1。对于允许多选的列表，始终是第一个选项的索引
- size：选择框中可见的行数，等价于HTML的size属性。

对于只允许选择一项的选择框，获取选项最简单的方式是使用选择框的selectedIndex属性：

```js
    let selectedOption = selectbox.options[selectbox.selectedIndex];
```

多选如果使用上述属性只能获取第一个选项，因此需要遍历`selected`属性：

```js
    function getSelectedOptions(selectbox){
      let result = new Array();
      for (let option of selectbox.options) {
        if (option.selected) {
          result.push(option);
        }
      }
      return result;
    }
```

## 表单序列化

```js
    function serialize(form) {
      let parts = [];
      let optValue;
      for (let field of form.elements) {
        switch(field.type) {
          case "select-one":
          case "select-multiple":
            if (field.name.length) {
            for (let option of field.options) {
                if (option.selected) {
                  if (option.hasAttribute){
                    optValue = (option.hasAttribute("value") ?
                                  option.value : option.text);
                  } else {
                    optValue = (option.attributes["value"].specified ?
                                  option.value : option.text);
                  }
                  parts.push(encodeURIComponent(field.name)} + "=" +
                              encodeURIComponent(optValue));
                }
              }
            }
            break;
          case undefined:      // 字段集
          case "file":          // 文件输入
          case "submit":        // 提交按钮
          case "reset":         // 重置按钮
          case "button":        // 自定义按钮
            break;
          case "radio":         // 单选按钮
          case "checkbox":     // 复选框
            if (! field.checked) {
              break;
            }
          default:
            // 不包含没有名字的表单字段
            if (field.name.length) {
              parts.push('${encodeURIComponent(field.name)}=' +
                          '${encodeURIComponent(field.value)}');
            }
      }
      return parts.join("&");
    }
```

## 富文本

为了可以编辑，必须将文档的**designMode**属性设置为"on"。不过，只有在文档完全加载之后才可以设置。在这个包含页面内，需要使用onload事件处理程序在适当时机设置designMode：

```js
    <iframe name="richedit" style="height: 100px; width: 100px"></iframe>
    <script>
      window.addEventListener("load", () => {
        frames["richedit"].document.designMode = "on";
      });
    </script>
```

与富文本编辑器交互的主要方法是使用`document.execCommand()`。这个方法在文档上执行既定的命令，可以实现大多数格式化任务，例如加粗、插入元素。

```js
    // 在内嵌窗格中切换粗体文本样式
    frames["richedit"].document.execCommand("bold", false, null);
    // 在内嵌窗格中切换斜体文本样式
    frames["richedit"].document.execCommand("italic", false, null);
    // 在内嵌窗格中创建指向www.wrox.com的链接
    frames["richedit"].document.execCommand("createlink", false,
                                              "http://www.wrox.com");
    // 在内嵌窗格中为内容添加<h1>标签
    frames["richedit"].document.execCommand("formatblock", false, "<h1>");
```

在内嵌窗格中使用getSelection()方法，可以获得富文本编辑器的选区。这个方法暴露在document和window对象上，返回表示当前选中文本的Selection对象。

对于这种传统js的形式，如果要在表单中提交富文本，则需要将iframe的innerHTML插入一个隐藏字段中：

```js
    form.addEventListener("submit", (event) => {
      let target = event.target;
      target.elements["comments"].value =
          frames["richedit"].document.body.innerHTML;
    });
```

## 数据传输

在HTML和JavaScript中，表单提交时数据的传输结构主要取决于表单的`enctype`属性和提交方法（通常是GET或POST）。

### 1. 提交方法

- **GET**：通过URL传输数据，数据附加在URL之后，以`?`分隔URL和传输数据，多个参数之间以`&`分隔。
- **POST**：通过HTTP消息的主体传输数据，不在URL中显示。

### 2. `enctype`属性

`enctype`属性定义了表单数据在发送到服务器时浏览器使用的编码类型。它有以下几种类型：

- **application/x-www-form-urlencoded**（默认值）：在发送前，所有字符都会进行编码（空格转换为"+"加号，特殊符号转换为ASCII HEX值）。
- **multipart/form-data**：用于文件上传。不对字符编码。在发送表单数据之前，会将其分为多个部分，每部分包含一个表单控件的数据。
- **text/plain**：空格转换为"+"加号，但不对特殊字符编码。

### 3. 数据结构

- **application/x-www-form-urlencoded**：数据以`key=value`对形式发送，多个键值对之间以`&`分隔。例如：`name=John&Doe&age=23`。
- **multipart/form-data**：每个表单域（文件或其他数据）作为消息中的一个部分发送。每部分都被一个唯一分隔符分隔，分隔符在整个消息中是唯一的。每个部分都包含了表单域的内容类型和表单域本身的数据。

  ```
  --boundary123
  Content-Disposition: form-data; name="fieldName"

  fieldValue
  --boundary123
  Content-Disposition: form-data; name="file"; filename="filename.jpg"
  Content-Type: image/jpeg

  [Binary image data]
  --boundary123--
  ```
- **text/plain**：数据以纯文本形式发送，键值对以`=`连接，对之间以换行符`\n`分隔。这种格式不常用，因为它不支持文件上传，且数据没有经过URL编码，可能会导致服务器解析困难。

### 4. JavaScript中的数据提交

在JavaScript中，你可以使用`XMLHttpRequest`或`Fetch API`来提交表单数据。你可以设置请求的`Content-Type`头部来控制数据的格式。例如，使用`Fetch API`提交JSON数据：

```javascript
fetch('your-endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    key: 'value',
    anotherKey: 'anotherValue'
  })
});
```

在这个例子中，数据以JSON格式发送，这是一个常见的API交互格式，但并非直接通过HTML表单提交的格式。

总的来说，HTML和JavaScript中表单提交的数据结构主要由表单的提交方法（GET或POST）和`enctype`属性决定，而在JavaScript中，你还可以通过AJAX技术（如`XMLHttpRequest`或`Fetch API`）以更灵活的方式发送数据。