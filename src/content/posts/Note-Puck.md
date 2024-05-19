---
title: "开源低代码库 Puck 的架构与使用用例分析"
pubDate: 2024-05-08 21:00:00.0
updated: 2024-05-08 21:00:00.0
categories: ['学习笔记']
tags: ['Web开发']
description: ' '
---


## 前言

[Puck](https://github.com/measuredco/puck) 是23年下旬才开始开发的一块开源富文本产品，截止到写下文章时收获了4.5k stars，有着不错的技术文档和使用体验，未来可期。

本调研会分为如下部分：

1. 应用层用例
2. 源码简单分析
3. 插件扩展性判断
4. 编辑功能兼容性（富文本、主题参数、后端数据储存结构、合并组）

## 样例运行

使用官网模版运行 [puck/recipes/next at main · measuredco/puck · GitHub](https://github.com/measuredco/puck/tree/main/recipes/next)

可以看到，这个样例实现了一个JSON database作为数据交互模拟。

### 组件配置

Puck 的核心行为是通过 Config 配置的，包括：

- Puck 可以使用哪些组件
- 如何渲染每个组件
- 当用户选择组件时显示哪些字段
- 额外信息，例如**合并组**

用法：

1. `Puck` 组件中传入配置字段，根据配置渲染出**编辑器UI**。用户与编辑器交互，触发[data payload](https://puckeditor.com/docs/api-reference/data)
2. `<Render>` 访问 [data payload](https://puckeditor.com/docs/api-reference/data) 并渲染。这一块我还没看到，之后补充。

#### 补充：data payload 数据格式

data payload 其实就是 Puck 的数据交互格式：

```json
{
  "content": [
    {
      "type": "HeadingBlock",
      "props": {
        "id": "HeadingBlock-1234",
        "title": "Hello, world"
      }
    }
  ],
  "root": { "props": { "title": "Puck Example" } },
  "zones": {}
}
```

`zones` 好像是用于拖拽的放置的，这我之后再确认一下。

#### 补充：config数据结构

定义了每个类型的渲染方式。

```jsx
const config = {
  components: {
    HeadingBlock: {
      fields: {
        title: { type: "text" },
      },
      defaultProps: {
        title: "Heading",
      },
      render: ({ title }) => (
        <div style={{ padding: 64 }}>
          <h1>{title}</h1>
        </div>
      ),
    },
  },
};
```

拖拽放置后，会更新data payload。
这里的核心就是 `field` 参数，它提供了组件的输入（例如 `title`），是靠右侧的表单实现的。因此，对于我们项目而言，**核心问题是：能不能把这个表单的处理移交到编辑器内部？**

目前这个结构，按我的理解是有可行性的。即：

1. 初次生成时，预留好参数，直接填入
2. 后续通过内置编辑器交互数据，而非表单本身

难点：只支持一个字段，不支持富文本的多种字段形式。

有一个富文本插件，具体分析可以参考下面的[插件扩展性](#插件扩展性)。 [@tohuhono/puck-rich-text - npm](https://www.npmjs.com/package/@tohuhono/puck-rich-text)

### 布局方式

通过 `DropZone` 实现拖放，其中有几个有趣的地方：

1. 布局本身是靠css实现的，很灵活
2. 布局组件是slot的形式，也挺灵活
3. 可以封装插槽到一个新的组件中，从而实现**模版的复用**
4. Zone可以设定允许接收的类型（通过type和组），符合dnd的设计范式

```jsx
import { DropZone } from "@measured/puck";

const config = {
  components: {
    Example: {
      render: () => {
        return (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <DropZone zone="left-column" />
            <DropZone zone="right-column" />
          </div>
        );
      },
    },
    HeadingBlock: {
      render: ({ text }) => <p>{text}</p>,
    },
  },
};
```

### 合并组

```jsx
const config = {
  categories: {
    typography: {
      components: ["HeadingBlock", "ParagraphBlock"],
      title: "Text",
      defaultExpanded: false, // Collapse this category by default
    },
    foundational: {
      components: ["HeadingBlock"],
      visible: false, // Mark this category as hidden
    },
  },
  // ...
};
```

## 插件扩展性

由于这个项目还在初期阶段，因此插件API的稳定性是很难保证的。在这种情况下，想要按照现有的插件API实现具体需要的功能风险会很大。

### 富文本插件

其中有一个富文本插件，可以参考一下它的具体实现。这个插件基于facebook开源的 [Lexical](https://github.com/facebook/lexical) 二次开发。原则上来说市面上几个主流的开源富文本编辑器差异不大，基本都是经过抽象处理的，可以配合内置的插件系统实现灵活需求。（注：要区分Puck的插件生态，和富文本库插件生态的区别）。

这个插件目前是有明显bug的，和next.js的渲染有关。

## 编辑功能兼容性

综上，这个库：

1. 很适配前后端数据储存交互，有比较清晰实现（data payload）
2. 适配主题参数，因为本质上是直接写html+css（config）
3. 适配合并组功能，通过`DropZone`实现。但是合并组的交互可能需要额外开发的地方。
4. 富文本。有插件，但不可靠。属于目前的痛点。
