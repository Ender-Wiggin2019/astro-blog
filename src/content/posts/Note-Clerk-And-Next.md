---
title: Clerk+Next.js 从开发到生产配置全流程与坑点一览
pubDate: 2024-06-27 22:03:00.0
updated: 2024-06-27 22:03:00.0
categories: ['学习笔记']
tags: ['Web开发']
description: 'Clerk 号称是最开箱即用的登录鉴权serverless服务，这篇文章会介绍一下配置的流程，以及其中的坑点'
---

[Clerk](https://clerk.com/) 号称是最开箱即用的登录鉴权serverless服务，确实可以帮助开发者避免前期重复无聊的鉴权逻辑从而快速开发一些小玩具。但是这里面也有不少坑，这篇文章会介绍一下配置的流程，以及其中的坑点。

## 0. 技术栈选择

本文使用 Next.js 作为前端框架，配合 Clerk 实现登录功能。如果说想要实现全面的白嫖方案搭建功能强大（但是没啥使用量）的网站，建议增加如下配置：

1. [Neon](https://neon.tech/)，继 Planetscale 背刺收费之后的第二个serverless数据库界赛博活菩萨。另外的选择还有 [Supabase](https://supabase.com/)，同样是基于pg的，但是国内访问特别卡，不建议使用。
2. 域名&Cloudflare。域名可以自己买一个自己喜欢的，或者去白嫖一个不太好看的免费域名使用。然后通过 Cloudflare 这个真·赛博菩萨绑定 ssl 证书。

在这种全副武装之下，这网站可以说是白嫖界的天花板了，有前端有边缘函数还有后端，抛开用户量暴涨带来的额外计费的可能性，限制这网站能力边界的就只有自己的编码能力了。

## 1. Hello World! 项目搭建

首先需要明确的一点是，不论是Clerk，还是其它的鉴权解决方案（NextAuth/Supabase Auth/Firebase Auth），都是封装了底层鉴权基础知识的技术黑盒。因此，如果是还不太理解鉴权原理的新人，建议先通过学习基础的鉴权知识（如jwt/OAuth/加密算法），这样在选择这些五花八门的服务时不至于“乱花渐欲迷人眼”。

创建一个新项目的方式有很多种：

1. **（推荐）找一个 Next + Clerk 的starter，例如[这个](https://github.com/clerk/clerk-nextjs-demo-app-router)，克隆即可。这种方式适合想快速体验 Clerk 功能的人。**
2. 从一些其它 starter 开始搭建，然后整合 Clerk，这种方式比较灵活。最原始的就是从 [Next.js 官方文档](https://nextjs.org/docs/getting-started/installation)开始创建，其余的可以自己搜索。创建后再按照 [Clerk 官方文档](https://clerk.com/docs/quickstarts/nextjs) 配置。

## 2. 配置 Clerk 开发环境

Clerk 中最重要的两个概念是**中间件**和**开发/生产环境**。一般的实践是，本地开发时使用 Clerk 开发环境，只要项目正式上线了，就必须配置生产环境。在代码侧区分环境使用的就是环境变量。

配置环境变量的步骤如下，也可以直接参考[官方文档](https://clerk.com/docs/quickstarts/setup-clerk)：

1. [注册 Clerk 账号](https://dashboard.clerk.com/sign-up)
2. 点击 **Create application** 创建一个应用，也就是我们现在开发的这个项目。
3. 配置鉴权选项，例如第三方登录提供商。这里需要事先声明的是，第三方登录提供商在开发环境是可以随意增加的，**但是在生产环境每一个都需要额外的配置**。所以这边量力而行。
4. 进入 [Clerk 控制台](https://dashboard.clerk.com/last-active?path=api-keys) 找到 API keys，分别是一个公钥和私钥，将这个配置复制到我们项目中的环境变量里。

补充：环境变量是文件夹中的 `.env` 文件，如果没有的话可以手动创建，或者从 starter 中的样例文件（`.env.example` 或者 `.env.template` 啥的，反正一般都会有一个这样的文件）。内容大致是这样：

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=需要粘贴的内容
CLERK_SECRET_KEY=需要粘贴的内容
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
# NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
# NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

不论如何，都不要将这个文件上传到公共网络例如 GitHub 上。

至此，如果是从 starter 克隆的项目的话，已经可以根据自己对应的包管理器运行了。

如果是自己手动创建的，那么还需要配置 Middleware 和 `<ClerkProvider>`，可以参考[官网](https://clerk.com/docs/quickstarts/nextjs)。

## 3. 中间件 Middleware 配置

这是 Clerk 的第一个坑。Clerk 有两种不同版本的鉴权中间件，一定要注意。

如果你使用的是 `authMiddleware()` 函数，这个函数虽然可以使用但是已经deprecated了，见[文档](https://clerk.com/docs/references/nextjs/auth-middleware)。这个中间件会**默认拦截整个项目的所有页面**，必须用户显示声明允许在未登录状态下可以访问的页面。因此，如果配置稍有不慎，就会发现自己所有页面全都是404。因此建议弃用，改为使用新的API。

新的 API 是 `clerkMiddleware()`，它默认不保护任何路由，这确实更加符合开发规范，不会禁用一些原本可以正常使用的功能。

## 4. 组件配置

接下来就是在项目中加入注册登录按钮了，这也是 Clerk 最大快人心的一步。还有什么比写一个 `<SignedIn>` 即可实现登录更加方便的开发体验了？

步骤如下：

1. 在项目根目录下配置 `<ClerkProvider>`，这也是很多库使用的全局配置方案。根目录取决于你使用的是 Next.js 的 page 路由还是 app 路由，这里也有一些小坑，但是因为属于 Next,js 相关的问题，这篇文章就不讨论了。
2. 在想加入的地方加入对应注册/登录/用户信息组件，这里就建议参考官网和 starter 来写了，一步步走就行了，没什么坑点。

如果是使用 starter 的话，应该这一步什么都不用做就可以使用了。

## 5. 走向生产环境

其实从用户体验上来说，使用测试环境除了当用户跳转第三方登录的时候会显示一个奇奇怪怪的域名（Clerk 开发环境域名）之外，并没有什么区别。因此似乎不上生产环境也不错，还不需要搞其它的配置。

**但是！但是！但是！Clerk 开发环境有一个非常坑的点，就是 google search console 无法访问，会直接报错 401，也就是等于根本没有seo！**

这个问题我很晚才发现，寻思着明明我的网站访问量不低并且有外链，为什么一直上不了 google 首页。在知道是 401 的问题后，我也一直无法定位到原因，stack overflow 上也没有答案。直到今年3月份才有一位好心人[一语道破天机](https://stackoverflow.com/questions/76816776/getting-unauthorised-401-for-my-nextjs-13-app-on-search-console)。

所以，只要你的网站是想上线的，就要做好生产环境配置。步骤如下，也可以参考[官网教程](https://clerk.com/docs/deployments/overview#deploy-your-clerk-app-to-production)：

1. 创建生产实例。
2. 更新环境变量。**这里也有一个坑点，就是只要在本地环境使用生产环境的API key，就会报错。** 解决方案就是老老实实的本地用测试的环境变量，部署到云端再用生产环境的环境变量，做好严格隔离。
3. 配置第三方鉴权和路径。**生产实例和开发实例几乎完全不一样，所有配置项都要重新配置。** 开发环境的快乐在配置生产环境时几乎全还回去了，或许鉴权也没有银弹——开发效率和安全性不可兼得。
4. 找到自己的域名，都生产环境了有个域名很合理吧。
5. 每个 OAuth 证书都需要去对应平台自己配置。这一步建议照着[文档](https://clerk.com/docs/authentication/social-connections/overview)慢慢走，只能说几乎 OAuth 的配置方案都是类似的，虽然第一次很累但是一劳永逸了属于是。
6. DNS 记录。生产环境需要使用 Clerk 的一些服务来实现会话管理和邮件管理。总的来说就是得把自己域名和 Clerk 绑在一起。这一步一方面验证很慢，差不多得要一天；另一方面 Cloudflare 还有坑，需要把这个子域名设置为 `DNS only`。具体操作还是见[文档的 Troubleshooting 部分](https://clerk.com/docs/deployments/overview#deploy-your-clerk-app-to-production)。

等一切就绪后，应该就终于可以使用了。一方面可以自己登录网站看看能不能登录，另一方面访问一下 google search console 看看能不能登记自己的子域名就可以了。
