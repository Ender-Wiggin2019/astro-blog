---
title: 技术 | 基于 React-DnD 的通用拖拽库设计方案
pubDate: 2024-06-24 22:03:00.0
updated: 2024-06-24 22:03:00.0
categories: ['学习笔记']
tags: ['Web开发']
description: '本文是对于我之前的文章的更新，将一个小需求封装为一个工具库。'
---

本文是对于我之前的文章[React-DnD 预览层实现的两种方案](https://blog.ender-wiggin.com/posts/note-react-dnd/)的更新，将一个小需求扩大为一个工具库。

在工作中我需要实现一个比较灵活的拖拽库，可以实现几乎从任何地方拖拽组件到中间的编辑器中的效果，见下图。这篇文章会介绍这个通用拖拽库的架构和具体技术实现方案。
![demo](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/Peek%202024-06-24%2016-19.gif)

## 架构

需求如下，大致拆分为4个核心步骤：
![dnd-logic](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/dnd-logic.png)

而作为一个可接入业务的抽象库，整合业务逻辑的库架构如下：

![architecture](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/dnd-architecture.png)

能看到这里有5个核心文件夹，接下来我会一一介绍功能。

---

## 一、dnd上下文（context）搭建

这里的上下文分为两部分：

### React-dnd的全局上下文

只要是使用了react-dnd的项目，都需要一个上下文，用于全局管理拖拽事件。
放置在项目frontend/pages/_app.tsx这个根目录中。

### 包内置上下文

> packages/common/dnd/src/dndContext/dndContext.tsx

这一块参数目前设定为：

```ts
export type DndContextType = {
  theme?: ITheme; // 外部传入的主题，主要用于drop时的样式传入
  onDragAction?: DragItemActionCallback;
};
```

`theme`，也就是贯穿整个项目的主题。传入的目的是为了在业务层获取到主题，并在drop的过程中作为桥梁传回给编辑器。

**PS：这里我个人建议未来还是要在编辑器层面进行优化，直接可以将主题作为参数，在内部进行管理。如果这么实现的话，也要记得修改这个包中关于主题部分的代码。**

`onDragAction`，是一个在每次拖拽前和放置后都会调用的回调，把它单独抽离出来也是为了和业务逻辑解耦。目前我们项目中使用到的逻辑为：

在拖拽开始时，让整个编辑器变成富文本编辑模式。当拖拽结束后，恢复常规模式。

```ts
export const onDragAction = (action: "start" | "end") => {
  if (action === "start") {
    const blocks = document.querySelectorAll(".decorative_block");
    blocks.forEach((block) => {
      (block.parentNode as HTMLElement).style.zIndex = "2"; // 2是编辑模式
    });
  } else {
    const blocks = document.querySelectorAll(".decorative_block");
    blocks.forEach((block) => {
      (block.parentNode as HTMLElement).style.zIndex = "0"; // 0是拖拽模式
    });
  }
};
```

## 二、drag接口

>packages/common/dnd/src/drag/withDraggable.tsx 文件

这步在第一版设计是使用的是容器形式，在第二版中改为了HOC形式。区别在于只需要在独立的组件中维护即可。

参数如下：

```ts
const defaultOptions: WithDraggableOptions = {
  dragByIcon: false,
  dragIconPosition: { top: 0, left: -14 },
};

type WithDraggableProps = {
  item: DragItem<DragType>;
  onSelectItem?: (item: DragItem<DragType>) => void;
};
```

`dragByIcon`决定了组件是否通过一个抓手图标进行拖拽，有两种表现形式：

1. 悬浮到可拖拽内容后左侧会显示一个灰色拖拽按钮，点击后才可以拖拽。主要是为了针对文本的情况，这样用户依然可以使用浏览器自带的“选中文本复制”的操作。
2. 悬浮后光标变成抓手，点击一整个可拖拽内容即可直接拖动。这种主要是为了针对非文本情况，或者文本空间很小不适合添加拖拽按钮的情况。

`dragIconPosition`是这个图标的定位，默认是在左侧一点的位置。

### 补充：类型定义的关系

![dnd-type](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/dnd-type.png)

## 三、drop接口

drop部分的核心是一个可放置容器：

```ts
export interface DroppableContainerProps {
  canDropType?: DragType[]; // 这个容器下允许放置的类型，默认是这个package下定义的所有类型
  hideBar?: boolean;
  onDrop: (item: DragItem<DragType>, itemType: DragType) => void;
  children: React.ReactNode;
}
```

1. `canDropType`，决定那些类型可以被放置。在编辑器内部是所有容器，而在不同slide之间就只是个别类型了。
2. `hideBar`，这是一个临时使用的参数，如果启用会让这个容器在没有被hover时严格隐藏（透明度为0）。
3. `onDrop`，这是核心回调，对于不同的业务逻辑回调应该是不一样的。关于编辑器部分，详见packages/common/flexlayoutApp/src/view/Splitter.tsx。可以注意到，这是在最底层FlexLayout级别的使用的，未来如果编辑器迁移了也会是类型的用法。对于这一步还有一些优化，即一般并不是悬浮到分割线才显示，而是悬浮到靠近分割线的block时就会显示分割线的位置。在编辑器迁移之后可以考虑迭代。

这个`onDrop`在编辑器中是在`packages/common/autoSliderApp/components/autoSlider/view/index.tsx`里面调用的，核心逻辑如下：

```ts
    const handleInnerSplitLineDrop = (id: string, path: string, rect: Rect, item: any, itemType: any) => {
      const res = innerInsert(initLayoutData, itemType, item, id, path, rect);
      if (res) {
      // 更新Layout
      }
    };
```

这边`any`是为了节约时间，本质上`item`是前面提到的`DragItem`。
能看到，这里主要的工作就是接受到`item`之后，运行一次内部插入的逻辑。但是这个函数有点小问题，偶尔会导致无法插入（因为没有定位到分割线），这时候只需要轻微移动分割线即可解决。底层逻辑是将新的定位更新回`LayoutModel`，这一块未来理论上会在新的编辑器里面优化了。具体解释见编辑器（FlexLayout）二次开发业务逻辑。

## 四、预览层

![dnd-preview](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/dnd-preview.png)

要实现预览层，首先需要禁用对默认预览效果，这部分的逻辑在抽离出来的 `useDraggable` hook中实现，关键代码即`useEffect` hook的处理。

```ts
export const useDraggable = ({ item }: UseDraggableProps) => {
  const { theme, onDragAction } = useDndContext();

  const [{ isDragging }, drag, dragPreview] = useDrag(
    () => ({
      type: item.type,
      item: () => {
        onDragAction?.("start");
        return getStyledDndItem(item, theme);
      },
      end: () => {
        onDragAction?.("end");
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [item] // 注意依赖数组问题
  );

  useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true });
  }, [dragPreview]);

  return { isDragging, drag };
};
```

在禁用默认预览效果后，需要通过 `useDragLayer` 人为指定一个预览层，即通过捕获鼠标位置，并在对应位置渲染出一个新的组件。
在渲染组件这步里，会使用下一个章节介绍的组件工厂，展示的是`dragStatus = 'dragging'`的状态。另外，这里使用了一下`createPortal`，将组件渲染到`document.body`上，这样可以避免父组件由于一些CSS样式导致的定位偏差问题。

```ts
  return ReactDOM.createPortal(
    <div style={getItemStyles(currentCursorOffset)}>{getDragComponent(itemType as any, item.content)}</div>,
    document.body // 目标容器
  );
```

## 五、组件工厂

组件工厂负责管理整个前端组件显示，核心是包括了3种状态**纯函数**：

1. 常规态，即正常没有被拖拽的状态。
2. 预览态，当组件正在被拖拽时发生的样子。
3. 遗留态，当组件被拖拽时，原有空间的状态。

因此，所有需要实现拖拽的组件，都需要在纯函数中加入这个参数。另外一个参数默认是`data`，是在整个流程中会被传输的数据，不论是拖拽、预览还是放置。通过一个贯穿全文的`data`，就可以实现低负担的数据传输与UI显示。

最终通过一个函数即可在不同类型、不同状态中返回一个纯函数：

```tsx
export const getComponentByStatus = (type: DragType, data: DragData, dragStatus: DragStatus): JSX.Element => {
  const Component = DragComponentMap[type];
  if (!Component) {
    return null;
  }
  return <Component data={data} dragStatus={dragStatus} />;
};
```

这里也可以使用面向对象的工厂模式，对于大规模组件来说是一个优化方向。
