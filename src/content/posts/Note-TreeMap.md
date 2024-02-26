---
title: 学习笔记 | Treemap算法实现
pubDate: 2024-02-01 21:00:00.0
updated: 2024-02-01 21:00:00.0
categories: ['学习笔记']
tags: ['TS',  '算法']
description: ' '
---
## 介绍

树状图将分层数据显示为一组嵌套矩形。每个组都由一个矩形表示，该矩形的面积与其值成正比。本文将以 D3 作为代码实现对象，探讨现有 `tiling` 函数的实现效果。

## 现有函数

D3 提供的函数如下：

|​|平均长宽比|节点有序性|稳定性|
|---|---|---|---|
|treemapBinary|良好|部分有序|一般|
|treemapSlice|很差|有序|优秀|
|treemapDice|很差|有序|优秀|
|treemapResquarify|良好|有序|优秀|
|treemapSquarify|优秀|部分有序|一般|

可以发现，treemapSquarify 拥有更优秀的平均长宽比。而treemapResquarify 首次布局采用 squarified 树图方式，保证具有较好的平均长宽比。后续即便是数据变化也只改变节点的大小，而不会改变节点的相对位置。这种布局方式在树图的**动画**表现上效果将会更好。

### treemapDice & treemapSlice

这是最简单的排布方式，将所有元素切片。
`x0`和`y0`：分别代表父节点矩形区域的左下角的 x 和 y 坐标（ `x1`和`y1` 右上角）。
父元素的children是所有子元素，value也就是所有子元素value总和。因此，源码意思是，将子元素总和按照长度均匀划分，每份大小为k，然后子元素 node 按照大小比例乘以k获得实际位置。

```js
export default function(parent, x0, y0, x1, y1) {
  var nodes = parent.children,
      node,
      i = -1,
      n = nodes.length,
      k = parent.value && (x1 - x0) / parent.value;

  while (++i < n) {
    node = nodes[i], node.y0 = y0, node.y1 = y1;
    node.x0 = x0, node.x1 = x0 += node.value * k;
  }
}

```

### treemapSliceDice

parent.depth 即树的深度，每次递归深度+1。
```js
export default function(parent, x0, y0, x1, y1) {
  (parent.depth & 1 ? slice : dice)(parent, x0, y0, x1, y1);
}
```

### treemapBinary

核心思路是找到一条分界线，让左右两边值相近。
思考：对于多个并列的组件，可以用 n-ary 划分？
```js
export default function(parent, x0, y0, x1, y1) {
  var nodes = parent.children,
      i, n = nodes.length,
      sum, sums = new Array(n + 1);

  // 前缀和
  for (sums[0] = sum = i = 0; i < n; ++i) {
    sums[i + 1] = sum += nodes[i].value;
  }

  partition(0, n, parent.value, x0, y0, x1, y1);

  function partition(i, j, value, x0, y0, x1, y1) {
    // 如果只有一个元素，该node填充整片区域
    if (i >= j - 1) {
      var node = nodes[i];
      node.x0 = x0, node.y0 = y0;
      node.x1 = x1, node.y1 = y1;
      return;
    }

    // 此时sum的偏移量
    var valueOffset = sums[i],
        // 找到一个分割点k，使得在这个点左边的所有节点的值的总和接近父节点值的一半
        valueTarget = (value / 2) + valueOffset,
        k = i + 1,
        hi = j - 1;

    while (k < hi) {
      var mid = k + hi >>> 1;
      if (sums[mid] < valueTarget) k = mid + 1;
      else hi = mid;
    }

    if ((valueTarget - sums[k - 1]) < (sums[k] - valueTarget) && i + 1 < k) --k;

    // 一旦找到分割点，函数会计算左侧和右侧子节点的值，并根据父节点矩形的方向（宽度大于高度或高度大于宽度），沿着较长的边将矩形分为两部分。
    var valueLeft = sums[k] - valueOffset,
        valueRight = value - valueLeft;

    // partition函数递归地对左侧和右侧的子区域进行相同的操作，直到所有的子节点都被分配了一个矩形区域。
    if ((x1 - x0) > (y1 - y0)) {
      var xk = value ? (x0 * valueRight + x1 * valueLeft) / value : x1;
      partition(i, k, valueLeft, x0, y0, xk, y1);
      partition(k, j, valueRight, xk, y0, x1, y1);
    } else {
      var yk = value ? (y0 * valueRight + y1 * valueLeft) / value : y1;
      partition(i, k, valueLeft, x0, y0, x1, yk);
      partition(k, j, valueRight, x0, yk, x1, y1);
    }
  }
}
```

### treemapSquarify

比较主流的分块算法，通过设置一个长宽比，使得每个矩形的长宽比尽可能接近。
核心在于，每次迭代都会计算当前行的最小宽高比，然后添加节点，直到宽高比不再改善。

```js
export function squarifyRatio(ratio, parent, x0, y0, x1, y1) {
  var rows = [], // 初始化行数组，用于存储处理结果
      nodes = parent.children, // 获取父节点的子节点数组
      row, // 定义一个变量用于存储当前行
      nodeValue, // 定义一个变量用于存储节点的值
      i0 = 0, // 初始化索引i0，表示当前行起始节点的索引
      i1 = 0, // 初始化索引i1，表示当前行结束节点的索引
      n = nodes.length, // 节点数组长度
      dx, dy, // 定义dx和dy，表示区域的宽度和高度
      value = parent.value, // 父节点的总值
      sumValue, // 行内节点值的总和
      minValue, // 行内节点值的最小值
      maxValue, // 行内节点值的最大值
      newRatio, // 新的宽高比
      minRatio, // 最小的宽高比
      alpha, // 临时变量，用于计算比例
      beta; // 临时变量，用于计算比例

  // 遍历所有的节点
  while (i0 < n) {
    dx = x1 - x0, dy = y1 - y0; // 计算当前区域的宽度和高度

    // 查找下一个非空节点
    do sumValue = nodes[i1++].value; while (!sumValue && i1 < n);
    minValue = maxValue = sumValue; // 初始化最小值和最大值为第一个节点的值
    alpha = Math.max(dy / dx, dx / dy) / (value * ratio); // 计算alpha值，用于比例调整
    beta = sumValue * sumValue * alpha; // 计算beta值，用于比例调整
    minRatio = Math.max(maxValue / beta, beta / minValue); // 计算最小宽高比

    // 继续添加节点，直到宽高比不再改善
    for (; i1 < n; ++i1) {
      sumValue += nodeValue = nodes[i1].value; // 累加节点值到总和
      if (nodeValue < minValue) minValue = nodeValue; // 更新最小值
      if (nodeValue > maxValue) maxValue = nodeValue; // 更新最大值
      beta = sumValue * sumValue * alpha; // 重新计算beta
      newRatio = Math.max(maxValue / beta, beta / minValue); // 计算新的宽高比
      if (newRatio > minRatio) { sumValue -= nodeValue; break; } // 如果新宽高比大于最小宽高比，结束循环
      minRatio = newRatio; // 更新最小宽高比
    }

    // 定位并记录行的方向
    rows.push(row = {value: sumValue, dice: dx < dy, children: nodes.slice(i0, i1)});
    if (row.dice) treemapDice(row, x0, y0, x1, value ? y0 += dy * sumValue / value : y1); // 如果行是垂直的，调用treemapDice
    else treemapSlice(row, x0, y0, value ? x0 += dx * sumValue / value : x1, y1); // 如果行是水平的，调用treemapSlice
    value -= sumValue, i0 = i1; // 从总值中减去当前行的值，并更新i0为下一行的起始索引
  }

  return rows; // 返回所有行的数组
}

// 定义并导出一个函数，接受一个比例值，返回一个平铺函数
export default (function custom(ratio) {

  function squarify(parent, x0, y0, x1, y1) {
    squarifyRatio(ratio, parent, x0, y0, x1, y1); // 使用指定的比例值来平铺矩形
  }

  // 设置比例值的方法
  squarify.ratio = function(x) {
    return custom((x = +x) > 1 ? x : 1); // 如果输入的x大于1，则使用x，否则使用1
  };

  return squarify; // 返回平铺函数
})(phi); // 使用默认的黄金分割比例phi来初始化
```