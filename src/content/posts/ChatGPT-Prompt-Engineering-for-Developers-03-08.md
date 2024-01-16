---
title: 学习笔记 | Prompt Engineering 03-08
pubDate: 2023-04-25 20:00:00.0
updated: 2023-04-25 20:00:00.0
categories: ['学习笔记']
tags: ['AI']
description: ' '
---

## 03 Iterative Prompt Develelopment

![CleanShot 2023-04-29 at 02.19.18@2x.png](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/CleanShot%202023-04-29%20at%2002.19.18%402x.png)

- 其实就是一步步迭代prompt
- 例如给prompt加上更多的限制: 篇幅(words, sentences, characters limitation), 输出内容, 输出格式...

## 04 Summarizing

本节讨论如何在总结类应用中实现更好的效果。

### Summarize with limit or focus topic

- 限定篇幅
- 限定总结的方向 (例如针对不同角度的总结，比如以运输的角度或者是价格的角度进行总结)
- Summaries include topics that are not related to the topic of focus

### Try "extract" instead of "summarize"

``` python
prompt = f"""
Your task is to extract relevant information from \
a product review from an ecommerce site to give \
feedback to the Shipping department.

From the review below, delimited by triple quotes \
extract the information relevant to shipping and \
delivery. Limit to 30 words.

Review: <prod_review>
"""
```

---

## 05 Inferring

本节主要介绍如何从文本中推断sentiment and topics

``` python
"""
What is the sentiment of the following product review,
which is delimited with triple backticks?

Give your answer as a single word, either "positive" \
or "negative"
"""
```

值得学习的一点是，利用API的格式化输出，对接应用的其它功能。比如先分析语义输出JSON格式的关键词，然后将JSON展示与前端。这样等于人人不需要训练模型就可以开发NLP相关应用，大大降低了门槛。

``` python
prompt = f"""
Identify the following items from the review text:
- Sentiment (positive or negative)
- Is the reviewer expressing anger? (true or false)
- Item purchased by reviewer
- Company that made the item

The review is delimited with triple backticks. \
Format your response as a JSON object with \
"Sentiment", "Anger", "Item" and "Brand" as the keys.
If the information isn't present, use "unknown" \
as the value.
Make your response as short as possible.
Format the Anger value as a boolean.

Review text: '''{lamp_review}'''
"""
```

---

## 06 Transforming

本节主要关于文本翻译、语法检查、语气/格式转换

### Translation

- 语言选择有很多种，甚至可以是`English pirate`
- 可以让模型自行判断文本是哪种语言
- 笔者注：多语言翻译确实很方便，比如之前在GitHub上看到了有`i18n`的命令行翻译工具，可以自动生成翻译文件

### Tone Transformation

- produce different tones
- such as `Translate the following from slang to a business letter`

### Format Conversion

- 格式转换
- such as `Translate the following python dictionary from JSON to an HTML`

### Spellcheck/Grammar check

---

## 07 Expanding

- 扩写
- example: generate customer service emails that are tailored to each customer's review
- 例如可以让模型根据不同情感作出不同反应

``` python
prompt = f"""
You are a customer service AI assistant.
Your task is to send an email reply to a valued customer.
Given the customer email delimited by ```, \
Generate a reply to thank the customer for their review.
If the sentiment is positive or neutral, thank them for \
their review.
If the sentiment is negative, apologize and suggest that \
they can reach out to customer service.
Make sure to use specific details from the review.
Write in a concise and professional tone.
Sign the email as `AI customer agent`.
Customer review: <{review}>
Review sentiment: {sentiment}
"""
```

- `temerature`越高，输出结果越随机 ![CleanShot 2023-04-29 at 21.45.15@2x.png](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/CleanShot%202023-04-29%20at%2021.45.15%402x.png)

---

## 08 Chatbot

本节主要介绍如何实现一个对话机器人


``` python
def get_completion_from_messages(messages, model="gpt-3.5-turbo", temperature=0):
    response = openai.ChatCompletion.create(
        model=model,
        messages=messages,
        temperature=temperature, # degree of randomness
    )
    return response.choices[0].message["content"]
```

- `role` contains of:
	- `system`: 预设的prompt，全局生效
	- `user`: 用户内容
	- `assistant`: AI生成的内容

``` python
messages =  [
{'role':'system', 'content':'You are an assistant that speaks like Shakespeare.'},
{'role':'user', 'content':'tell me a joke'},
{'role':'assistant', 'content':'Why did the chicken cross the road'},
{'role':'user', 'content':'I don\'t know'}  ]

response = get_completion_from_messages(messages, temperature=1)
```

- 可以通过以下代码实现对话上下文:

``` python
def collect_messages(_):
    prompt = inp.value_input
    inp.value = ''
    context.append({'role':'user', 'content':f"{prompt}"})
    response = get_completion_from_messages(context)
    context.append({'role':'assistant', 'content':f"{response}"})
    panels.append(
        pn.Row('User:', pn.pane.Markdown(prompt, width=600)))
    panels.append(
        pn.Row('Assistant:', pn.pane.Markdown(response, width=600, style={'background-color': '#F6F6F6'})))

    return pn.Column(*panels)
```