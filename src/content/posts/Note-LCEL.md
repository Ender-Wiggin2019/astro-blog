---
title: 学习笔记 | LangChain Expression Language
pubDate: 2023-11-22 21:03:00.0
updated: 2023-11-22 21:03:00.0
categories: ['学习笔记']
tags: ['网站开发', 'Python']
description: ' '
---
# `Runnable` protocol

`Runnable` 接口主要为了实现链式调用。
## 主要方法

主要包括如下方法：
- [`stream`](https://python.langchain.com/docs/expression_language/interface#stream): 流式输出
- [`invoke`](https://python.langchain.com/docs/expression_language/interface#invoke): 正常调用方式
- [`batch`](https://python.langchain.com/docs/expression_language/interface#batch): 列表输入，内部异步实现

这三个方法都有对应的异步方法。

### 输入输出

输入输出在 `runnable` 中可以显示。
#### Input
`chain.input_schema.schema()` 查看

|Component|Input Type|
|---|---|
|Prompt|Dictionary|
|Retriever|Single string|
|LLM, ChatModel|Single string, list of chat messages or a PromptValue|
|Tool|Single string, or dictionary, depending on the tool|
|OutputParser|The output of an LLM or ChatModel|

#### output
`chain.output_schema.schema()` 查看

|Component|Output Type|
|---|---|
|LLM|String|
|ChatModel|ChatMessage|
|Prompt|PromptValue|
|Retriever|List of documents|
|Tool|Depends on the tool|
|OutputParser|Depends on the parser|

#### 样例

```python
model = ChatOpenAI()
prompt = ChatPromptTemplate.from_template("tell me a joke about {topic}")
chain = prompt | model
```

```python
chain.input_schema.schema()
# {'title': 'PromptInput',
# 'type': 'object',
# 'properties': {'topic': {'title': 'Topic', 'type': 'string'}}}
```

```python
await chain.abatch([{"topic": "bears"}]) # 异步 `abatch`
```

对于单参数的情况，可以使用 `RunnablePassthrough()` ，同时传入 `chain` 的参数可以直接是字符串

```python
model_parser = model | StrOutputParser()

# 可以直接将一个 chain 包在 dict 中间：{"color": model_parser}
color_generator = (
{"attribute": RunnablePassthrough()} | prompt1 | {"color": model_parser}
)
```
## `bind`

- `Runnable.bind(stop=)` 用于设定停止词，输出会在这个词出现之前被截断
- `Runnable.bind(function_call=)` 用于 `bing` OpenAI functions

### `RunnableMap` / `RunnableParallel`

```python
from langchain.schema.runnable import RunnableMap, RunnablePassthrough

# RunnableMap 生成输入 prompt 的 key，`foo=RunnablePassthrough()` 传入字符串参数
# 等价于 `{"foo": RunnablePassthrough()}`
map_ = RunnableMap(foo=RunnablePassthrough()
chain = (
    map_
    | prompt
    | model.bind(function_call={"name": "joke"}, functions=functions)
    | JsonKeyOutputFunctionsParser(key_name="setup")
)

# 字符串调用
chain.invoke("bears")
```

`RunnableMap` 的不同 `key` 自带并行效果，比如：
```python
chain = (
planner
| {
"results_1": chain1, # 并行
"results_2": chain2, #
"original_response": itemgetter("base_response"),
}
| final_responder
)
```
## 配置

`configurable_fields` 中定义了可配置的参数 `temperature`。
```python
model = ChatOpenAI(temperature=0).configurable_fields(
    temperature=ConfigurableField(
        id="llm_temperature",
        name="LLM Temperature",
        description="The temperature of the LLM",
    )
)
```

后续可以传入一个字典进行配置
```python
chain.with_config(configurable={"llm_temperature": 0.9}).invoke({"x": 0})
```

模型切换配置化
```python
llm = ChatAnthropic(temperature=0).configurable_alternatives(
    # This gives this field an id
    # When configuring the end runnable, we can then use this id to configure this field
    ConfigurableField(id="llm"),
    # This sets a default_key.
    # If we specify this key, the default LLM (ChatAnthropic initialized above) will be used
    default_key="anthropic",

    openai=ChatOpenAI(),
    gpt4=ChatOpenAI(model="gpt-4"),
)
prompt = PromptTemplate.from_template("Tell me a joke about {topic}")
chain = prompt | llm
```

```python
# We can use `.with_config(configurable={"llm": "openai"})` to specify an llm to use
chain.with_config(configurable={"llm": "openai"}).invoke({"topic": "bears"})
```

prompt 同理
```python
llm = ChatAnthropic(temperature=0)
prompt = PromptTemplate.from_template(
    "Tell me a joke about {topic}"
).configurable_alternatives(
    ConfigurableField(id="prompt"),
    default_key="joke",
    poem=PromptTemplate.from_template("Write a short poem about {topic}"),
)
chain = prompt | llm
```

注意：`configurable_alternatives` 可以运行在任何 `ruunable` 上，也就是说可以在 llm 和 prompt 上分别设置配置项，并在链式调用中一并配置

## Fallback

模型 API fallback
```python
openai_llm = ChatOpenAI(max_retries=0)
anthropic_llm = ChatAnthropic()
llm = openai_llm.with_fallbacks([anthropic_llm])

# 指定报错类型
llm = openai_llm.with_fallbacks(
[anthropic_llm], exceptions_to_handle=(KeyboardInterrupt,)
)

#  直接对一整个 chain 设置 fallback
chain = bad_chain.with_fallbacks([good_chain])
```

## `RunnableLambda`

```python
from langchain.schema.runnable import RunnableLambda
from langchain.prompts import ChatPromptTemplate
from langchain.chat_models import ChatOpenAI
from operator import itemgetter


def length_function(text):
    return len(text)


def _multiple_length_function(text1, text2):
    return len(text1) * len(text2)


# 调用需要符合上面提到的 Input 类型
def multiple_length_function(_dict):
    return _multiple_length_function(_dict["text1"], _dict["text2"])


prompt = ChatPromptTemplate.from_template("what is {a} + {b}")
model = ChatOpenAI()

chain1 = prompt | model

chain = (
    {
        "a": itemgetter("foo") | RunnableLambda(length_function),
        "b": {"text1": itemgetter("foo"), "text2": itemgetter("bar")}
        | RunnableLambda(multiple_length_function),
    }
    | prompt
    | model
)
```

### `RunnableConfig`

**没看懂有什么用** [Run arbitrary functions](https://python.langchain.com/docs/expression_language/how_to/functions#accepting-a-runnable-config)

```python
from langchain.schema.runnable import RunnableConfig
from langchain.schema.output_parser import StrOutputParser

import json


def parse_or_fix(text: str, config: RunnableConfig):
    fixing_chain = (
        ChatPromptTemplate.from_template(
            "Fix the following text:\n\n```text\n{input}\n```\nError: {error}"
            " Don't narrate, just respond with the fixed data."
        )
        | ChatOpenAI()
        | StrOutputParser()
    )
    for _ in range(3):
        try:
            return json.loads(text)
        except Exception as e:
            text = fixing_chain.invoke({"input": text, "error": e}, config)
    return "Failed to parse"

from langchain.callbacks import get_openai_callback

with get_openai_callback() as cb:
    RunnableLambda(parse_or_fix).invoke(
        "{foo: bar}", {"tags": ["my-tag"], "callbacks": [cb]}
    )
    print(cb)

# Tokens Used: 65
# 	Prompt Tokens: 56
#	Completion Tokens: 9
# Successful Requests: 1
# Total Cost (USD): $0.00010200000000000001
```

### `RunnableBranch`

分支运行，执行第一个为 `True` 的分支，如果没有则执行默认分支。
```python
from langchain.schema.runnable import RunnableBranch

branch = RunnableBranch(
    (lambda x: "anthropic" in x["topic"].lower(), anthropic_chain),
    (lambda x: "langchain" in x["topic"].lower(), langchain_chain),
    general_chain,
)
```

也可以通过 `RunnableLambda` 实现同样效果：

```python
def route(info):
    if "anthropic" in info["topic"].lower():
        return anthropic_chain
    elif "langchain" in info["topic"].lower():
        return langchain_chain
    else:
        return general_chain
```

# Retrieval

```python
vectorstore = FAISS.from_texts(
    ["harrison worked at kensho"], embedding=OpenAIEmbeddings()
)
retriever = vectorstore.as_retriever()

template = """Answer the question based only on the following context:
{context}

Question: {question}
"""
prompt = ChatPromptTemplate.from_template(template)

model = ChatOpenAI()
```

```python
chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | model
    | StrOutputParser()
)
```

```python
template = """Answer the question based only on the following context:
{context}

Question: {question}

Answer in the following language: {language}
"""
prompt = ChatPromptTemplate.from_template(template)

chain = (
    {
	    # 先获取问题，再在 `retriever` 中搜索结果作为 `context`
        "context": itemgetter("question") | retriever,
        "question": itemgetter("question"),
        "language": itemgetter("language"),
    }
    | prompt
    | model
    | StrOutputParser()
)
```

### `Document`

```python
from langchain.schema import Document
from langchain.prompts import PromptTemplate

doc = Document(page_content="This is a joke", metadata={"page": "1"})
prompt = PromptTemplate.from_template("Page {page}: {page_content}")
format_document(doc, prompt)
# "Page 1: This is a joke"
```

### `RunnablePassthrough.assign`

In some cases, it may be useful to pass the input through while adding some keys to the output. In this case, you can use the assign method.
Uasge: **Merge the Dict input with the output produced by the mapping argument.** 将传入的 `RunnablePassthrough` 与新参数合并
```python
from langchain.schema.runnable import RunnablePassthrough, RunnableParallel

 def fake_llm(prompt: str) -> str: # Fake LLM for the example
    return "completion"

runnable = {
    'llm1':  fake_llm,
    'llm2':  fake_llm,
}
| RunnablePassthrough.assign(
    total_chars=lambda inputs: len(inputs['llm1'] + inputs['llm2'])
  )

runnable.invoke('hello')
# {'llm1': 'completion', 'llm2': 'completion', 'total_chars': 20}
```

#### 例子：构建聊天历史记录

```python
from langchain.schema.runnable import RunnableMapfrom langchain.schema import format_document
from langchain.prompts.prompt import PromptTemplate

_template = """Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language.Chat History:{chat_history}Follow Up Input: {question}Standalone question:"""
CONDENSE_QUESTION_PROMPT = PromptTemplate.from_template(_template)

template = """Answer the question based only on the following context:{context}Question: {question}"""
ANSWER_PROMPT = ChatPromptTemplate.from_template(template)

DEFAULT_DOCUMENT_PROMPT = PromptTemplate.from_template(template="{page_content}")

# 将 doc 合并为一个长字符串
def _combine_documents(
    docs, document_prompt=DEFAULT_DOCUMENT_PROMPT, document_separator="\n\n"
):
    doc_strings = [format_document(doc, document_prompt) for doc in docs]
    return document_separator.join(doc_strings)
```

```python
from typing import Tuple, List

def _format_chat_history(chat_history: List[Tuple]) -> str:
    buffer = ""
    for dialogue_turn in chat_history:
        human = "Human: " + dialogue_turn[0]
        ai = "Assistant: " + dialogue_turn[1]
        buffer += "\n" + "\n".join([human, ai])
    return buffer
```

```python
# 生成一个新的 dict
_inputs = RunnableMap(
	# 其中 standalone_question 在原有参数之上，新添加了历史记录 chat_history
    standalone_question=RunnablePassthrough.assign(
        chat_history=lambda x: _format_chat_history(x["chat_history"])
    )
    | CONDENSE_QUESTION_PROMPT
    | ChatOpenAI(temperature=0)
    | StrOutputParser(),
)
_context = {
	# 在获得具体问题后，运行检索并合并
    "context": itemgetter("standalone_question") | retriever | _combine_documents,
    "question": lambda x: x["standalone_question"],
}
conversational_qa_chain = _inputs | _context | ANSWER_PROMPT | ChatOpenAI()
```

```python
conversational_qa_chain.invoke(
    {
        "question": "where did he work?",
        "chat_history": [("Who wrote this notebook?", "Harrison")],
    }
)
```

注意，历史记录也可以通过 `langchain.memory` 轻松调用：

```python
from operator import itemgetter
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory(
    return_messages=True, output_key="answer", input_key="question"
)

# # This adds a "memory" key to the input object
loaded_memory = RunnablePassthrough.assign(
chat_history=RunnableLambda(memory.load_memory_variables) | itemgetter("history"),
)

# 目前需要手动保存
memory.save_context(inputs, {"answer": result["answer"].content})
memory.load_memory_variables({})

# {'history': [HumanMessage(content='where did harrison work?', additional_kwargs={}, example=False),
# AIMessage(content='Harrison was employed at Kensho.', additional_kwargs={}, example=False)]}
```

# Agent

Building an agent from a runnable usually involves a few things:

1. Data processing for the intermediate steps. These need to represented in a way that the language model can recognize them. This should be pretty tightly coupled to the instructions in the prompt
2. The prompt itself
3. The model, complete with stop tokens if needed
4. The output parser - should be in sync with how the prompt specifies things to be formatted.

```python
agent = (
    {
        "question": lambda x: x["question"],
        "intermediate_steps": lambda x: convert_intermediate_steps(
            x["intermediate_steps"]
        ),
    }
    | prompt.partial(tools=convert_tools(tool_list))
    | model.bind(stop=["</tool_input>", "</final_answer>"])
    | XMLAgent.get_default_output_parser()
)
```

1. 中间态处理。输入 `intermediate_steps` 输出可被识别的(结构化)结果
```python
def convert_intermediate_steps(intermediate_steps):
	log = ""
	for action, observation in intermediate_steps:
	log += (
	f"<tool>{action.tool}</tool><tool_input>{action.tool_input}"
	f"</tool_input><observation>{observation}</observation>"
	)
	return log
```

2. prompt 处理。一般需要通过 `partial` 传入 `tools`
```python
def convert_tools(tools):
	return "\n".join([f"{tool.name}: {tool.description}" for tool in tools])
```

## Routing

通过特定函数调用**不同链**获得不同输出。

### Embedding

```python
from langchain.embeddings import OpenAIEmbeddings
embeddings = OpenAIEmbeddings()

# 模版列表
prompt_templates = [physics_template, math_template]

# 输入 list 和 可选参数 chunk_size
# 返回向量列表 list[list[float]]
prompt_embeddings = embeddings.embed_documents(prompt_templates)
```

```python
def prompt_router(input):
	# 将输入转化为向量
	query_embedding = embeddings.embed_query(input["query"])
	# 计算两个等宽矩阵的相似性,返回一个矩阵,取第一行(即包含了2个不同模版相似结果数值的列表)
	similarity = cosine_similarity([query_embedding], prompt_embeddings)[0]
	# 取最大值的索引,获得最接近的模版
	most_similar = prompt_templates[similarity.argmax()]

	print("Using MATH" if most_similar == math_template else "Using PHYSICS")
	# 选择对应模版
	return PromptTemplate.from_template(most_similar)

chain = (
	{"query": RunnablePassthrough()}
	| RunnableLambda(prompt_router)
	| ChatOpenAI()
	| StrOutputParser(
)
```


## 其余补充

`ChatMessagePromptTemplate` 可以自己定义角色
但是现在 OpenAI 不支持这个，所以没用！
```python
from langchain.prompts import ChatMessagePromptTemplate

prompt = "May the {subject} be with you"

chat_message_prompt = ChatMessagePromptTemplate.from_template(role="Jedi", template=prompt)
chat_message_prompt.format(subject="force")
```

