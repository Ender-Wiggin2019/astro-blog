---
title: 魔法运动员 | 如何制作属于自己的魔法运动员卡牌！
pubDate: 2026-05-05 12:00:00.0
updated: 2026-05-05 12:00:00.0
categories: ['桌游相关']
tags: ['魔法运动员']
description: '《魔法运动员》是一款画风魔性的欢乐聚会游戏，本文分享如何借助 AI 制作自用角色卡牌与实物。'
---

## 背景

[魔法运动员 (Magical Athlete)](https://boardgamegeek.com/image/9106864/magical-athlete) 是一款画风魔性的欢乐聚会游戏。游戏本身也非常支持玩家自己设计角色，因此本文分享一下如何在 AI 的帮助下制作出属于自己的卡牌。这个教程仅用于让玩家生成自用的角色，禁止用于商业用途。

![image.png](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/20260505131915814.webp)

最终实物效果如下

![9bab92a9f256782b71c5654b5966567d.jpg](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/9bab92a9f256782b71c5654b5966567d.webp)

## 前置要求

本文使用的是 [gpt-image-2](https://developers.openai.com/api/docs/models/gpt-image-2) 模型，推荐渠道是 ChatGPT 官方订阅账号。如果没有订阅账号的话，可以尝试使用第三方 API 接入。这里也提供一个可用的第三方平台：

https://right.codes/register?aff=e09d43ce

## 提示词

要让 AI 生成类似画风的图片，需要如下准备：

1. 原画风参考素材
2. 卡牌模版
3. (可选) 想生成角色的参考素材 (如果你想生成的角色有一定知名度，比如某个动漫主角，不需要素材 AI 自己也能生成)
4. 提示词

![CleanShot 2026-05-05 at 13.36.00@2x.png](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/CleanShot%202026-05-05%20at%2013.36.00%402x.webp)

复制内容如下：

### 1、原画风参考素材

![racer_info_top100_collage_all_cards.png](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/racer_info_top100_collage_all_cards.webp)

### 2、卡牌模版

![9b3ffd6c1438fb782f8fd477e0c19f7f.png](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/9b3ffd6c1438fb782f8fd477e0c19f7f.webp)

### 3、提示词

```text
参考图一的艺术风格，为我在图二里面填充空白地方，生成类似风格的角色，需要形象夸张。正确替换图二的模版，除了卡牌名字，其余都使用中文：

卡牌名字：xxxx
角色形象：xxxx
卡牌效果：xxxx
下方小字：xxxx

艺术风格是：稚拙艺术风格，局外人艺术，怪诞卡通角色，粗黑线条，手绘感强，线条不规则，平涂色块，复古90年代卡牌插画风，低俗艺术风格，造型夸张不符合解剖，儿童画风但带荒诞幽默，角色居中，背景简单，高饱和配色。
```

## 实物制作

这一步设计排版 & 制作。可以自行 P 图，卡背如下：

![card_back.png](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/card_back.webp)

如果可以运行 Python 脚本，或者用 AI 可以帮忙运行，可以尝试使用如下脚本一键排版 & 导出：

https://github.com/Ender-Wiggin2019/magical_athlete_generator

生成后，推荐使用 A4 铜版纸双面彩打。

接下来是角色立牌的制作，方案有二：

1. 让 AI 生成可裁剪人物立牌，然后自己打印并使用立牌支架固定：

```text
生成一张图片，把这张图片的人物主体提取出来，并且在每个角色外部填充一下符合背景颜色的圆润外边框，制作成用于打印的贴纸风格，让人物适合裁剪。
```

2. 在第一步的基础之上，如果有 3D 打印机，可以 3D 打印一个底座，然后双面贴图。

![image.png](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/20260505152410435.webp)
