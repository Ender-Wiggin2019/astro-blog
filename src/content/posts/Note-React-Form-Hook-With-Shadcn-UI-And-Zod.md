---
title: 学习笔记 | 基于shadcn UI, zod 和 react-form-hook 的表单提交方案
pubDate: 2023-08-15 18:00:00.0
updated: 2023-08-15 18:00:00.0
categories: ['学习笔记']
tags: ['TS']
description: ' '
---
## 前言

最近在写网站代码的时候遇到了一个需求：实现一个卡牌制作器，允许用户输入卡牌信息并生成对应的卡牌，同时包含数值验证、上传/下载 JSON 、导出图片等功能。
了解了一下近期非常热门的组件库 [shadcn/ui](https://ui.shadcn.com/docs/components/form) 后发现确实非常方便，这篇文章算是对于这个实践的记录。

![效果图](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/CleanShot%202023-08-20%20at%2021.52.16.png)

## 基础用法

```ts
const form = useForm()

<FormField
  control={form.control}
  name="username"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Username</FormLabel>
      <FormControl>
        <Input placeholder="shadcn" {...field} />
      </FormControl>
      <FormDescription>This is your public display name.</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```