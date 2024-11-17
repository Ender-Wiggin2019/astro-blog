---
title: 技术 | TypeCell源码实现简要分析
pubDate: 2024-02-21 21:00:00.0
updated: 2024-02-21 21:00:00.0
categories: ['学习笔记']
tags: ['TS',  '算法']
description: ' '
---

TypeCell是一个类似Notion+Jupyter的TypeScript在线编辑文档，可以实时运行ts和react代码。本文主要分析渲染部分的源码实现。

## 核心技术栈

- [BlockNote](https://www.blocknotejs.org)：富文本编辑器
- `monaco-editor`：类似vs code的代码编辑器和**浏览器端的ts解析**
- `mobx`：状态管理
- `vscode-lib`：复用了部分vscode的生命周期管理，相应代码待继续调研

## 项目架构

```
typecell
├── packages
│   ├── editor        - 主页面，WYSIWYG富文本编辑器
│   ├── engine        - 解析器和运行时，核心功能，后续会介绍
│   ├── frame         - 基于iframe的沙盒版本运行时，可以理解为codesandbox
│   ├── packager      - 打包器
│   ├── parsers       - 解析器，用于解析/转化Markdown和TypeCell格式
│   ├── server        - HocusPocus + Supabase后端
```

后续主要介绍`engine`。

## 渲染引擎

### `ReactiveEngine.ts`

自动运行注册模型的引擎，主要进行资源管理，例如注册和注销事件监听器和其他可释放资源。引擎会处理模型`Model`的代码，并为其提供一个上下文（`$`），使得不同模型的代码可以交互。

- 生命周期管理：`vscode-lib`
- 代码执行：`createCellEvaluator` （见下个section）

### `CellEvaluator.ts`

用于评估并运行在TypeCell环境中执行的代码，分为两步：
- `assignExecutionExports` 将模块的导出经过处理后映射到TypeCell context
- `createCellEvaluator` 创建了评估器对象，能够**执行编译后的代码**，并管理与TypeCell上下文相关的状态和回调。
	1. 通过`getPatchedTypeCellCode`将编译后的代码包在独立的函数之中
	2. 通过`getModulesFromPatchedTypeCellCode` 将上一步的代码与当前作用域结合，生成一个`module`
	3. 调用`runModule`传入`module`和回调，并执行代码

```ts
export function createCellEvaluator(
  typecellContext: TypeCellContext<any>, // TypeCell上下文
  resolveImport: (module: string) => Promise<any>, // 解析导入的函数
  setAndWatchOutput = true, // 是否设置和监控输出
  onOutputChanged: (output: any) => void, // 输出变化时的回调
  beforeExecuting: () => void // 执行前的回调
) {
  // ...
  const executionScope = createExecutionScope(typecellContext); // 创建执行作用域
  let moduleExecution: ModuleExecution | undefined; // 模块执行实例

  async function evaluate(compiledCode: string) {
    // 评估函数，用于执行编译后的代码
    if (moduleExecution) {
      moduleExecution.dispose(); // 如果已存在模块执行实例，先销毁它
    }

    try {
      // 将编译后的代码转换为可执行的模块
      const patchedCode = getPatchedTypeCellCode(compiledCode, executionScope);
      const modules = getModulesFromPatchedTypeCellCode(
        patchedCode,
        executionScope
      );

      if (modules.length !== 1) {
        throw new Error("expected exactly 1 module"); // 期望有且只有一个模块
      }

      // 执行模块并处理结果
      moduleExecution = await runModule(
        modules[0],
        typecellContext,
        resolveImport,
        beforeExecuting,
        onExecuted,
        onError,
        moduleExecution?.disposeVariables
      );
      await moduleExecution.initialRun;
    } catch (e) {
      console.error(e);
      onOutputChanged(e); // 发生错误时，通过回调通知
    }
  }

  return {
    evaluate, // 返回的评估器对象包含evaluate函数
    dispose: () => {
      // 评估器的销毁函数
      if (moduleExecution) {
        moduleExecution.dispose();
        moduleExecution.disposeVariables();
      }
    },
  };
}
```

#### 补充：`getPatchedTypeCellCode` 实现

`getPatchedTypeCellCode` 将传入的编译后的代码(`compiledCode`)转换为一个可以在特定作用域(`scope`)下执行的模块化代码，通过添加额外的代码来确保编译后的代码可以作为模块运行。这个函数主要操作如下：
1. 检查`compiledCode`是否已经包含了AMD（Asynchronous Module Definition）格式的模块定义代码。AMD格式的模块定义通常以`define([], function() { /* module code */ });`的形式出现。如果不包含，那么它会将整段代码包裹在一个`define`函数调用中，从而手动创建一个模块。
2. 验证`scope`对象中的键是否都是有效的JavaScript变量名。如果发现无效的键名，则抛出错误。
3. 构建一个字符串(`variableImportCode`)，该字符串包含一系列的`let`声明，用于将`scope`对象中的每个键映射为局部变量。这样做的目的是让编译后的代码能够访问到这些作用域变量。
4. 将`define`函数和`variableImportCode`添加到`compiledCode`前面，从而构建出完整的可执行代码(`totalCode`)。
5. 使用正则表达式替换，将原有的同步`define`函数调用替换为异步的`define`函数调用。这样做可能是为了支持异步模块加载。
6. 返回修改后的代码(`totalCode`)，以便它可以作为一个模块在相应的执行上下文中运行。

```ts
export function getPatchedTypeCellCode(compiledCode: string, scope: any) {
  // Checks if define([], function) like code is already present
  if (!compiledCode.match(/(define\((".*", )?\[.*\], )function/gm)) {
    // file is not a module (no exports). Create module-like code manually
    compiledCode = `define([], function() { ${compiledCode}; });`;
  }

  if (Object.keys(scope).find((key) => !/^[a-zA-Z0-9_$]+$/.test(key))) {
    throw new Error("invalid key on scope!");
  }

  const variableImportCode = Object.keys(scope)
    .map((key) => `let ${key} = this.${key};`)
    .join("\n");

  let totalCode = `;
  let define = this.define;
  ${variableImportCode}
  ${compiledCode}
  `;

  totalCode = totalCode.replace(
    /^\s*(define\((".*", )?\[.*\], )function/gm,
    "$1async function"
  ); // TODO: remove await?

  return totalCode;
}
```

## `runModele()`

在评估器内部的最终执行逻辑。

这个执行器`runModule`函数是一个异步函数，它的目的是在TypeCell环境中执行一个模块(`mod`)。它处理模块的依赖项，执行模块的工厂函数，并管理模块执行过程中的资源清理和错误处理。

**核心运行步骤**发生在：

```ts
try {
    executionPromise = mod.factoryFunction.apply(
        undefined,
        argsToCallFunctionWith,
    );
} finally {
    // ... 其他代码
}
await executionPromise;
```

在这里，`mod.factoryFunction`是编译后代码的一个函数，通常这个函数是由模块系统（比如Webpack或RequireJS）创建的。它封装了实际的代码，并且在执行时，可以通过`.apply()`方法被调用。`.apply()`方法允许你调用函数并显式设置函数内部的`this`值（在这个例子中设置为`undefined`），以及传入一个参数数组`argsToCallFunctionWith`，这些参数包括模块的依赖项，如`exports`对象和其他模块。

```ts
const f = new Function(code);

f.apply({ ...scope, define });
```

`argsToCallFunctionWith`数组是通过`resolveDependencyArray`函数解析得到的，它基于模块的依赖列表（`mod.dependencyArray`），并且通过`resolveImport`函数异步获取这些依赖。

在调用`mod.factoryFunction.apply()`之后，如果返回的是一个`Promise`，那么代码会等待此`Promise`完成。这意味着如果模块中的代码是异步的，它会被正确地等待和处理。

因此，具体的代码执行是在调用`mod.factoryFunction.apply()`时发生的，而不是通过`eval()`。这种方法遵循了现代JavaScript模块化实践，允许代码以安全、可控的方式在浏览器环境中运行。

### `module.ts`

这段代码定义了一个处理JavaScript模块的机制。`Module`类型用于表示一个模块，其中包含模块名、依赖项数组和工厂函数。

`getModulesFromWrappedPatchedTypeCellFunction`和`getModulesFromPatchedTypeCellCode`两个函数的目的是从不同的上下文中提取模块定义。前者接受一个函数`caller`，后者接受一个字符串`code`。两者都使用`createDefine`函数创建的`define`函数来注册模块。

`createDefine`函数返回一个`typeCellDefine`函数，该函数用于定义模块。当`typeCellDefine`被调用时，它会将模块信息（模块名、依赖项、工厂函数）推入到`modules`数组中，这个数组随后可以用于执行模块。

`createExecutionScope`函数创建一个包含TypeCell环境所需的作用域对象，通常包括一些MobX的函数（如`autorun`、`untracked`、`computed`、`observable`），以及`$`和`$views`对象，分别表示TypeCell上下文和视图上下文。

`getPatchedTypeCellCode`函数将编译后的代码转换成可以在特定作用域下执行的模块化代码。如果代码不是模块形式，它会手动包装代码以创建一个模块。同时，它会将作用域中的变量导入到执行环境中，并确保所有的`define`函数调用都转换为异步函数调用。

#### mod.factoryFunction.apply的含义
在上下文中，`mod.factoryFunction`是一个模块的工厂函数，它包含了模块的实际代码。`apply`方法是JavaScript中一个函数对象的方法，允许你调用这个函数，并指定函数执行时`this`的值以及传入的参数列表。

当`mod.factoryFunction.apply(undefined, argsToCallFunctionWith)`被调用时，它执行以下操作：
1. `undefined`作为`this`的值传入，这意味着在工厂函数内部，`this`将不指向任何对象。
2. `argsToCallFunctionWith`是一个数组，包含了工厂函数需要的参数，如`exports`对象和其他模块依赖。

## ts解析

使用了`monaco-editor`，即Visual Studio Code的编辑器组件，是在浏览器环境中运行并解析TypeScript代码。

**注意**：这个库也实现了通过请求 `code.typescriptrepl.com` 获取编译结果的方式。

 `getCompiledCodeInternal` 函数通过调用`monaco-editor`的`TypeScriptWorker`获取TypeScript的编译输出，包括`.js`和`.d.ts`文件。它返回一个包含JavaScript代码和TypeScript声明文件内容的对象。
整个流程主要是在浏览器中通过`monaco-editor`的API和TypeScript的工作线程（`Worker`）来完成TypeScript代码到JavaScript代码的转换。

## 未来工作

一般主流的react浏览器端编译是靠 `babel/standlone` 实现的（例如[obsidian-react插件](https://github.com/elias-sundqvist/obsidian-react-components)），但是在项目源码中没有看到相关操作，待后续调研。
