---
title: "Vercel AI SDK 架构与简要源码分析"
pubDate: 2024-04-12 21:00:00.0
updated: 2024-04-12 21:00:00.0
categories: ['学习笔记']
tags: ['Web开发']
description: ' '
---

[Vercel AI SDK](https://sdk.vercel.ai/docs) 是 Vercel 于24年3月推出的一个方便开发 AI 应用的 SDK，可以让开发者快速搭建诸如聊天机器人等应用。

这篇文章会先简单分析一下这个库的优点和使用方式，然后关注一下最核心的流式UI部分的源码实现。

## 亮点

1. **SDK 的便携集成**。但是对于这一部分，并没有明显感觉出 Vercel AI SDK 和 [LangChain.js](https://github.com/langchain-ai/langchainjs) 以及 [Dify](https://github.com/langgenius/dify) 的明显区别。通过官网文档可以看出来，Vercel AI SDK 可以兼容 LangChain，因此可以理解为更上层的封装，而 Dify 有着相对独立的路径和更加工程化的庞大，配合刚出的 Pipeline 功能表现尤为亮眼。
1. **封装后的流式UI**。在我看来，这个 SDK 主要的优点就是与 React Server Component 高度绑定的流式UI。可以看出来 Vercel 官方也一直试图强推这个功能。


## 基础用例

后端部分，可以直接连 Vercel edge function:

```tsx
import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set the runtime to edge for best performance
export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
```

显然，`OpenAIStream` 和 `StreamingTextResponse` 是两个封装后的流式输出器，我们下个章节会一探究竟。

前端部分，通过 `useChat` hook 实现快速开发：

```tsx
'use client';

import { useChat } from 'ai/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(m => (
        <div key={m.id} className="whitespace-pre-wrap">
          {m.role === 'user' ? 'User: ' : 'AI: '}
          {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
```

## 流式

流式输出的优点就不赘述了，我们直接看源码。

```ts
export function OpenAIStream(
  res: Response | AsyncIterableOpenAIStreamReturnTypes,
  callbacks?: OpenAIStreamCallbacks,
): ReadableStream
```

函数的输入输出比较清晰，就是输入请求后返回所有流式的基础数据结构 `ReadableStream`。

其中使用了一个自定函数，将异步可迭代对象变成流式输出。

```ts
export function readableFromAsyncIterable<T>(iterable: AsyncIterable<T>) {
  let it = iterable[Symbol.asyncIterator]();
  return new ReadableStream<T>({
    async pull(controller) { // 内置API
      const { done, value } = await it.next();
      if (done) controller.close();
      else controller.enqueue(value);
    },

    async cancel(reason) {
      await it.return?.(reason);
    },
  });
}
```

### 优化：back-pressure 和取消

上面优化后的代码，和下面的代码相比有两个特点:

1. 通过 `pull` + 修改 `for await` 实现数据生成的动态调整
2. 增加取消

```ts
function createStream(iterator) {
  return new ReadableStream({
    async start(controller) {
      for await (const v of iterator) {
        controller.enqueue(v);
      }
      controller.close();
    },
  });
}
```

## Generative UI 生成式UI

AI SDK 利用 React Server Components 和 Server Actions，通过 `ai/rsc` 包集成界面渲染功能。

AI SDK 引入了两个新概念： `AIState` 和 `UIState` 。这些状态在服务器端 AI 操作和应用程序中呈现的客户端 UI 之间引入了明确的关注点分离。这种分离使开发人员能够安全地维护 AI 状态，其中可能包括系统提示或其他元数据等内容。同时，UI 状态旨在允许 React 服务器组件有效地传输到客户端。

`AIState` 是 LLM 需要读取的所有上下文的 JSON 表示形式。对于聊天应用程序， `AIState` 通常存储用户和助手之间的文本对话历史记录。实际上，它还可以用于存储其他值和元信息，例如每条消息的 `createdAt` 。 `AIState` 默认情况下，可以在服务器和客户端上访问/修改。

`UIState` 是应用程序用来显示 UI 的内容。它是完全客户端状态（与 `useState` 非常相似），可以保留 LLM 返回的数据和 UI 元素。该状态可以是任何状态，但无法在服务器上访问。

注意，这里返回的是服务器组件，通过 `zod` 实现了 agent 数据结构的生成与验证：

```tsx
// An example of a flight card component.
function FlightCard({ flightInfo }) {
  return (
    <div>
      <h2>Flight Information</h2>
      <p>Flight Number: {flightInfo.flightNumber}</p>
      <p>Departure: {flightInfo.departure}</p>
      <p>Arrival: {flightInfo.arrival}</p>
    </div>
  );
}

// An example of a function that fetches flight information from an external API.
async function getFlightInfo(flightNumber: string) {
  return {
    flightNumber,
    departure: 'New York',
    arrival: 'San Francisco',
  };
}

async function submitUserMessage(userInput: string) {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  // Update the AI state with the new user message.
  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content: userInput,
    },
  ]);

  // The `render()` creates a generated, streamable UI.
  const ui = render({
    model: 'gpt-4-0125-preview',
    provider: openai,
    messages: [
      { role: 'system', content: 'You are a flight assistant' },
      ...aiState.get()
    ],
    // `text` is called when an AI returns a text response (as opposed to a tool call).
    // Its content is streamed from the LLM, so this function will be called
    // multiple times with `content` being incremental.
    text: ({ content, done }) => {
      // When it's the final content, mark the state as done and ready for the client to access.
      if (done) {
        aiState.done([
          ...aiState.get(),
          {
            role: "assistant",
            content
          }
        ]);
      }

      return <p>{content}</p>
    },
    tools: {
      get_flight_info: {
        description: 'Get the information for a flight',
        parameters: z.object({
          flightNumber: z.string().describe('the number of the flight')
        }).required(),
        render: async function* ({ flightNumber }) {
          // Show a spinner on the client while we wait for the response.
          yield <Spinner/>

          // Fetch the flight information from an external API.
          const flightInfo = await getFlightInfo(flightNumber)

          // Update the final AI state.
          aiState.done([
            ...aiState.get(),
            {
              role: "function",
              name: "get_flight_info",
              // Content can be any string to provide context to the LLM in the rest of the conversation.
              content: JSON.stringify(flightInfo),
            }
          ]);

          // Return the flight card to the client.
          return <FlightCard flightInfo={flightInfo} />
        }
      }
    }
  })
```

### 源码探究

这一块的源码就比较复杂了，大致的逻辑是在后端调用 LLM 服务并渲染出流式的 react server component 并传给前端。

首先封装了一个可以从外部触发 resolve 和 reject 的期约：

```ts
export function createResolvablePromise<T = any>() {
  let resolve: (value: T) => void, reject: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
}
```

接下来定义了一个递归渲染的组件，异步获取chunk并包裹在 Suspense 里面：

```tsx
const R = [
  (async ({
    c, // current
    n, // next
  }: {
    c: React.ReactNode;
    n: Promise<any>;
  }) => {
    const chunk = await n;
    if (chunk.done) {
      return chunk.value;
    }

    if (chunk.append) {
      return (
        <>
          {c}
          <Suspense fallback={chunk.value}>
            <R c={chunk.value} n={chunk.next} />
          </Suspense>
        </>
      );
    }

    return (
      <Suspense fallback={chunk.value}>
        <R c={chunk.value} n={chunk.next} />
      </Suspense>
    );
  }) as unknown as React.FC<{
    c: React.ReactNode;
    n: Promise<any>;
  }>,
][0];
```

通过前面的函数，实现了初始化组件后的异步更新，并通过暴露的 resolve 和 reject 方法来实现对原有promise的控制。

```tsx
export function createSuspensedChunk(initialValue: React.ReactNode) {
  const { promise, resolve, reject } = createResolvablePromise();

  return {
    row: (
      <Suspense fallback={initialValue}>
        <R c={initialValue} n={promise} />
      </Suspense>
    ),
    resolve,
    reject,
  };
}
```

最终封装出的函数就是 `createStreamableUI`，返回值是一个包含了 React 节点，以及更新/增加方法，和 `done` 方法的一个 stream-like 结构。其中 `update`/`append` 方法每次都会再创建一个新的 `resolvable`，从而实现持续的流传输。

源码不长，但是设计思路很值得学习：

```tsx
export function createStreamableUI(initialValue?: React.ReactNode) {
  let currentValue = initialValue;
  let closed = false;
  let { row, resolve, reject } = createSuspensedChunk(initialValue);

  function assertStream(method: string) {
    if (closed) {
      throw new Error(method + ': UI stream is already closed.');
    }
  }

  let warningTimeout: NodeJS.Timeout | undefined;
  function warnUnclosedStream() {
    if (process.env.NODE_ENV === 'development') {
      if (warningTimeout) {
        clearTimeout(warningTimeout);
      }
      warningTimeout = setTimeout(() => {
        console.warn(
          'The streamable UI has been slow to update. This may be a bug or a performance issue or you forgot to call `.done()`.',
        );
      }, DEV_DEFAULT_STREAMABLE_WARNING_TIME);
    }
  }
  warnUnclosedStream();

  return {
    /**
     * The value of the streamable UI. This can be returned from a Server Action and received by the client.
     */
    value: row,
    /**
     * This method updates the current UI node. It takes a new UI node and replaces the old one.
     */
    update(value: React.ReactNode) {
      assertStream('.update()');

      // There is no need to update the value if it's referentially equal.
      if (value === currentValue) {
        warnUnclosedStream();
        return;
      }

      const resolvable = createResolvablePromise();
      currentValue = value;

      resolve({ value: currentValue, done: false, next: resolvable.promise });
      resolve = resolvable.resolve;
      reject = resolvable.reject;

      warnUnclosedStream();
    },
    /**
     * This method is used to append a new UI node to the end of the old one.
     * Once appended a new UI node, the previous UI node cannot be updated anymore.
     *
     * @example
     * ```jsx
     * const ui = createStreamableUI(<div>hello</div>)
     * ui.append(<div>world</div>)
     *
     * // The UI node will be:
     * // <>
     * //   <div>hello</div>
     * //   <div>world</div>
     * // </>
     * ```
     */
    append(value: React.ReactNode) {
      assertStream('.append()');

      const resolvable = createResolvablePromise();
      currentValue = value;

      resolve({ value, done: false, append: true, next: resolvable.promise });
      resolve = resolvable.resolve;
      reject = resolvable.reject;

      warnUnclosedStream();
    },
    /**
     * This method is used to signal that there is an error in the UI stream.
     * It will be thrown on the client side and caught by the nearest error boundary component.
     */
    error(error: any) {
      assertStream('.error()');

      if (warningTimeout) {
        clearTimeout(warningTimeout);
      }
      closed = true;
      reject(error);
    },
    /**
     * This method marks the UI node as finalized. You can either call it without any parameters or with a new UI node as the final state.
     * Once called, the UI node cannot be updated or appended anymore.
     *
     * This method is always **required** to be called, otherwise the response will be stuck in a loading state.
     */
    done(...args: [] | [React.ReactNode]) {
      assertStream('.done()');

      if (warningTimeout) {
        clearTimeout(warningTimeout);
      }
      closed = true;
      if (args.length) {
        resolve({ value: args[0], done: true });
        return;
      }
      resolve({ value: currentValue, done: true });
    },
  };
}
```

### 嵌套UI流

可以在StockCard中套一层HistoryChart，同时异步更新:

```tsx
// Create a streaming UI node. You can make as many as you need.
async function getStockHistoryChart() {
  'use server';

  const ui = createStreamableUI(<Spinner />);

  // We need to wrap this in an async IIFE to avoid blocking. Without it, the UI wouldn't render
  // while the fetch or LLM call are in progress.
  (async () => {
    const price = await callLLM('What is the current stock price of AAPL?');

    // Show a spinner as the history chart for now.
    // We won't be updating this again so we use `ui.done()` instead of `ui.update()`.
    const historyChart = createStreamableUI(<Spinner />);
    ui.done(<StockCard historyChart={historyChart.value} price={price} />);

    // Getting the history data and then update that part of the UI.
    const historyData = await fetch('https://my-stock-data-api.com');
    historyChart.done(<HistoryChart data={historyData} />);
  })();

  return ui;
}
```
