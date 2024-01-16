---
title: 学习笔记 | Prompt Engineering 01-02
pubDate: 2023-04-25 18:00:00.0
updated: 2023-04-25 18:00:00.0
categories: ['学习笔记']
tags: ['AI']
description: ' '
---

# Guidelines for Prompting

笔者注: 新技术每个人掌握的程度参差不齐，既有可以开发`agent`的大佬，也有一key难求的小白。整个视频课程看下来对于我个人而言有一些收获但是不多，可能因为内容虽然官方背书但是不够深入。我把课程中我觉得有价值的部分做了些摘要，可供读者快速参阅。

## Types of Large Language Models

- Base LLM: predicts next word based on text training data 模仿与续写
- **Instruction Tuned LLM**: fine-tune on instructions and good attempts at following those instructions 根据指令做出反应

## Principles of Prompting

### 01 Write clear and specific instructions

- clean != short

#### Tactic 1: Use delimiters

- clearly indicate distinct parts of the input
- 将prompt与文本隔离，避免模型将文本内容视为prompt一部分
- 分割的方式有很多种：

``` python
// triple quotes: """
// triple backticks: ```
// triple dashes: ---
// XML tags: <tag></tag>
```

#### Tactic 2: Ask for a structured output

- 结构化输出，例如JSON或者HTML
- 笔者注：`Jupyter`文件可在[课程官网](https://learn.deeplearning.ai/chatgpt-prompt-eng/lesson/2/guidelines)直接运行
``` python
prompt = f"""
Generate a list of three made-up book titles along \
with their authors and geres.
Provide them in JSON format with the following keys:
book_id, title, author, genre.
"""
```

#### Tactic 3: Ask the model to check whether conditions are satisfied

- 类似于代码中的`try...except`， 可以要求模型的格式化输出

``` python
text_1 = f"""
Making a cup of tea is easy! First, you need to get some \
water boiling. While that's happening, \
grab a cup and put a tea bag in it. Once the water is \
hot enough, just pour it over the tea bag. \
Let it sit for a bit so the tea can steep. After a \
few minutes, take out the tea bag. If you \
like, you can add some sugar or milk to taste. \
And that's it! You've got yourself a delicious \
cup of tea to enjoy.
"""
prompt = f"""
You will be provided with text delimited by triple quotes.
If it contains a sequence of instructions, \
re-write those instructions in the following format:

Step 1 - ...
Step 2 - …
…
Step N - …

If the text does not contain a sequence of instructions, \
then simply write \"No steps provided.\"

Text: <{text}>
"""
response = get_completion(prompt)
print("Completion for Text 1:")
print(response)
```

#### Tactic 4: "Few-shot" prompting

- 提供样例
- 例如下面的例子是让模型模拟类似大师和弟子的对话：

``` python
prompt = f"""
Your task is to answer in a consistent style.

<child>: Teach me about patience.

<grandparent>: The river that carves the deepest \
valley flows from a modest spring; the \
grandest symphony originates from a single note; \
the most intricate tapestry begins with a solitary thread.

<child>: Teach me about resilience.
"""
```

---

### 02 Give the model time to think

#### Tactic 1: Specify the steps required to complete a task

- 例如指定模型按照指定步骤"思考":

``` python
prompt_1 = f"""
Perform the following actions:
1 - Summarize the following text delimited by triple \
backticks with 1 sentence.
2 - Translate the summary into French.
3 - List each name in the French summary.
4 - Output a json object that contains the following \
keys: french_summary, num_names.

Separate your answers with line breaks.

Text: <{text}>
"""
```

- 也可以相应地设定输出格式:

``` python
"""
Use the following format:
Text: <text to summarize>
Summary: <summary>
Translation: <summary translation>
Names: <list of names in Italian summary>
Output JSON: <json with summary and num_names>

Text: <{text}>
"""
```

#### Tactic 2: Instruct the model to work out its own solution before rushing to a conclusion

- 由于模型很可能会粗略的浏览全文，因此可能发现不了细节错误：

``` python
prompt = f"""
Determine if the student's solution is correct or not.

Question:
I'm building a solar power installation and I need \
 help working out the financials.
- Land costs $100 / square foot
- I can buy solar panels for $250 / square foot
- I negotiated a contract for maintenance that will cost \
me a flat $100k per year, and an additional $10 / square \
foot
What is the total cost for the first year of operations
as a function of the number of square feet.

Student's Solution:
Let x be the size of the installation in square feet.
Costs:
1. Land cost: 100x
2. Solar panel cost: 250x
3. Maintenance cost: 100,000 + 100x
Total cost: 100x + 250x + 100,000 + 100x = 450x + 100,000
"""
```

- 解决方案: 通过prompt要求模型先自己计算结果，然后与上述的结果比对
- 这也说明了很多时候直接询问模型是非判断很可能**得不到**正确的结果

## Model LImitations

- Hallucination
- Makes statesments that sound plausible but are not true
- 也就是老生常谈的"编答案"
- 一个解决方案: first find relevant information, then answer the question based on the relevant information
