---
title: 技术 | React-DnD 预览层实现的两种方案
pubDate: 2024-03-31 22:03:00.0
updated: 2024-03-31 22:03:00.0
categories: ['学习笔记']
tags: ['Web开发']
description: 'React-DnD 中如果想要修改拖拽中的预览元素会非常麻烦，这篇文章将总结一下通用性的实现方案。'
---

React-DnD 作为 React 中功能最全面的拖拽库，几乎可以满足所有业务需求。但是当用户拖拽对应 `item` 时，如果想要修改拖拽中的预览元素会非常麻烦，官方虽然提供了API 但是使用起来并不方便。这篇文章将总结一下通用性的实现方案。

## 图片预览

显然，如果只需要预览图片，那么直接使用自带的 API `DragPreviewImage` 即可，使用起来非常简单：

```jsx
import { DragSource, DragPreviewImage } from 'React-DnD'

function DraggableHouse({ connectDragSource, connectDragPreview }) {
  return (
    <>
      <DragPreviewImage src="house_dragged.png" connect={connectDragPreview} />
      <div ref={connectDragSource}>🏠</div>
    </>
  )
}
```

但是，很多场景下，我们需要拖拽的是一个 `div` 而不是简单的图片，因此就需要使用另一个 API：`useDragLayer`。

## 元素预览

Stackoverflow 中有一篇很好的回答解释了具体的[实现方案](https://stackoverflow.com/a/70320222)。我将对其中的实现展开说明一下。

从架构上来说，大致分为以下几步：

1. 定义全局的 `<CustomDragLayer />` 组件。这个组件将会覆盖**所有** Dnd 上下文中的预览效果。因此需要谨慎设计这个组件的架构。

2. 在需要定制化预览效果的组件中：
	1. 禁用默认预览效果，避免样式冲突
	2. 传入需要的参数(`item`)，用于让全局的layer根据对应参数渲染出需要的组件。

接下来，我会逐一介绍具体实现。

### 全局配置

```jsx
export const CustomDragLayer = (props: {}) => {
  const {
    itemType, // item类型，一般作为工厂函数入口
    item,  // 具体item参数，可以在uesDrag的item()中自己配置，用于渲染具体组件
    isDragging,
    initialCursorOffset, // 偏移量计算，不需要关注具体的实现，只需要知道它们实现了元素的拖拽跟随即可
    initialFileOffset,
    currentFileOffset,
  } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialCursorOffset: monitor.getInitialClientOffset(),
    initialFileOffset: monitor.getInitialSourceClientOffset(),
    currentFileOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging) {
    return null;
  }

// 这个返回值就是具体组件的渲染
  return (
    <div style={layerStyles}>
      <div
        style={getItemStyles(
          initialCursorOffset,
          initialFileOffset,
          currentFileOffset
        )}
      >
        <div>Your custom drag preview component logic here</div>
      </div>
    </div>
  );
};

const layerStyles: CSSProperties = {
  position: "fixed",
  pointerEvents: "none",
  zIndex: 100,
  left: 0,
  top: 0,
  width: "100%",
  height: "100%",
  border: "10px solid red", // 这是拖拽时的全局效果，按个人需要增加或删除
};

function getItemStyles(
  initialCursorOffset: XYCoord | null,
  initialOffset: XYCoord | null,
  currentOffset: XYCoord | null
) {
  if (!initialOffset || !currentOffset || !initialCursorOffset) {
    return {
      display: "none",
    };
  }

  const x = initialCursorOffset?.x + (currentOffset.x - initialOffset.x);
  const y = initialCursorOffset?.y + (currentOffset.y - initialOffset.y);
  const transform = `translate(${x}px, ${y}px)`;

  return {
    transform,
    WebkitTransform: transform,
    background: "red",
    width: "200px",
  };
}
```

在实践中，我认为比较好的方式是实现一个工厂函数，用于根据不同的 `itemType` 渲染出不同的工厂模版。当然，`itemType` 在 React-DnD 中属于重要参数，开发人员在设计时本身就需要遵守一些常量命名的最佳实践。

而另外的一个 `item` 参数，也是这个库的最核心数据交互手段，可以根据业务需求非常灵活的加入各种属性进行数据传输。在下一部分也会额外介绍一下。

### 具体组件配置


目前我的个人感受时，在实现一个拖拽组件时，往往需要封装3层组件：
最细粒度的纯函数组件（不需要hook，直接传入参数） -> 进行状态管理封装的最小组件（需要调用`useDrag` hook）-> 组件容器 （进行上游的状态管理）。

其中纯函数组件是为了在预览层和拖拽层进行复用，基本的参数如下：

```jsx
interface PureItemProps {
  dragStatus: 'dragging' | 'idle' | 'preview'; // 拖拽状态，一共有三种：未拖拽的静止态、拖拽中原先位置的状态、拖拽中跟随鼠标的元素状态
  name: string; // 可以根据输入渲染出具体组件的最细参数
}
```

而对纯函数的封装层，就需要调用最核心的 `usedrag` hook了，大致设计如下：

```tsx
const DragItem: React.FC<DragItemProps> = ({ item }) => {
  const [{ isDragging }, dragRef, dragPreview] = useDrag(() => ({
    type: DRAG_ITEM_BLOCK,
    item: () => {
      // 可以在拖拽开始时触发一些操作
      console.log('开始拖拽');
      return {
        id: item.id,
        name: item.name,
        otherData: 'some data',
      };
    },
    end: (item, monitor) => {
      // 可以在拖拽结束后触发一些操作
      console.log('结束拖拽');
    },
    collect: (monitor) => {
      return {
        isDragging: monitor.isDragging(),
      };
    },
  }));

  // 清除默认拖拽效果
  useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true });
  }, [dragPreview]); // 配置依赖性，避免一开始的时候没有去除默认效果

  return (
    <div
      ref={dragRef}
    >
      <PureDragItem name={item.name} isDragging={isDragging} />
    </div>
  );
};
```

最后，在dnd上下文的下一层引入这个layer即可实现：

```tsx
      <DndProvider backend={MyBackend}>
        <ItemList />
        <CustomDragLayer />
      </DndProvider>
```

### fixed定位问题

在后续的开发中，还遇到一个比较奇怪的问题，即拖拽之后定位并没有严格跟随鼠标，而是有一段偏移。这是由于 `fixed` 定位虽然是相对于浏览器视口的，但是会被 `transform` 影响导致。`fixed` 定位的元素将相对于最近的已转换祖先元素进行定位，而不是整个视口。这是因为 `transform` 属性创建了一个新的包含块（containing block），对于 `fixed` 定位的元素而言，这个新的包含块就像是它的视口。

**因此按照最佳实践，只需要将这个预览层放在根节点就可以了。**

但是在项目实操中，由于一些组件的解耦不到位，可能会导致组件受到上下文影响必须放置在某个更深的树节点中，这种情况下就会被 `transform` 影响定位了。解决方案是使用 React Portal 将节点挂载到 `body` 中。用法即：

```tsx
ReactDOM.createPortal(child, container)
```
