---
title: 个人 Ubuntu 装机配置记录
pubDate: 2024-07-05 22:03:00.0
updated: 2024-07-05 22:03:00.0
categories: ['学习笔记']
tags: ['Web开发']
description: '作为 Mac 用户，必须把 Ubuntu 配得和 Mac 几乎一模一样！'
---

马上要告别陪伴自己快一年的 Ubuntu 系统了，一想到自己作为坚定的 Mac 党，都不知道未来什么时候会再次重拾 Linux 系统。但为了那个可能的时间点，我觉得把目前我对于 Linux 的配置做一个记录，避免到时候懊悔自己为什么不早点记录。

虽然我现在已经有点后悔了，因为我也快忘了一开始是怎么配置的了。作为前端娱乐圈的一员，配置 Ubuntu 主打一个怎么好看怎么来。需要操作的比如 Vim，那是碰都不会碰的。

![完成图](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/2024-07-05_14-27.png)

## 桌面美化

进入 Ubuntu 的第一眼就会看到 GUI，这原生 GUI 我是真的欣赏不来，尤其是会联想到大学时用 Ubuntu 虚拟机写操作系统作业的痛苦场景。因此上来第一件事换个皮肤很合理吧！

桌面主题很多，可以在 [GTK Themes](https://www.gnome-look.org/browse?cat=135&ord=latest) 里面找到，主题对于桌面使用体验基本都是颠覆性的，这也是 Linux 高定制化系统的一大亮点。我在尝试了多种主题之后，最满意的还是这款高仿 Mac 主题：

[WhiteSur GTK Theme](https://github.com/vinceliuice/WhiteSur-gtk-theme)

可以参考这里面的步骤一步步操作。注意 [Gnome](https://www.gnome.org/) 的前置配置。安装好的效果和 Mac 基本一模一样：
![完成图](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/2024-07-05_14-27.png)

另外，Tweak Gnome 基本也是必安装的，可以非常灵活的配置桌面：

```Bash
sudo apt update
sudo apt install gnome-tweaks
```

运行：

```bash
gnome-tweaks
```

## Terminal 配置

### 终端选择

作为颜控，自带的 Terminal 有点太丑了。由于在我去年装机时 warp 还没有发布 Linux 版，因此摸索了一些其它终端，也简单列举一下：

1. [Hyper](https://hyper.is/)，Vercel出品，基于 Electron，主打一个好看，但是流畅性感觉稍微差点意思。 ![hyper](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/2024-07-05_14-40.png)
2. [Kitty](https://github.com/kovidgoyal/kitty)，基于Python，使用 GPU 加速。
3. Terminator，老牌终端，但是丑是真丑。

但是因为 [Warp](https://www.warp.dev/) 在去年年底出了 Linux 发行版，我觉得这基本算是最优解了。基于 rust，颜值满分，还有很多新特性。除了需要登录才能使用这个被人诟病的隐私问题之外，几乎没有任何缺点。如果介意可能存在的隐私问题，那还是选择上面列举的一些替代品为好。![warp](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/2024-07-05_14-49.png)

### Shell 选择

目前看下来 zsh 和 fish 都不错，还有一个很新的 [Nushell](https://www.nushell.sh/)看着很酷炫，如果我下次装机的话我应该会尝试一下。 但这次我使用的还是 zsh：

1. 安装 zsh

```Bash
sudo apt install zsh
```

2. 安装oh my zsh

```Bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

3. 安装插件，如 `zsh-autosuggestions` 和 `zsh-syntax-highlighting`

```Bash
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

4. 更新 zshrc

```Bash
# 更改theme
ZSH_THEME="af-magic"

# 添加plugins
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)

# 避免snap污染问题
alias lsblk="lsblk -e 7"
```

### Prompt（可选）

安装 [Starship](https://github.com/starship/starship) 作为 prompt，有非常多配置项，可以参考官网配置。![starship](https://raw.githubusercontent.com/starship/starship/master/media/demo.gif)

这里有个可能的 [Warp 兼容性问题](https://docs.warp.dev/appearance/prompt#starship) 需要注意。

## 效率工具

我也是在用了 Mac 之后才开始关注一些效率工具的。对于这一块我的观点是，避免花里胡哨。新的工具有一定学习成本，如果它带来的收益没有安装和学习成本高的话，那可能根本就不是“有效率的”。

### 全局搜索工具：Albert

全局搜索工具应该是最能提效的工具之一了，用于平替 Mac 的 Alfred，虽然现在 Mac 上 Raycast 已经完胜 Alfred了。用处就是快捷键呼出弹窗，然后搜索各种内容比如文件和应用。
![albert](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/Peek%202024-07-05%2016-01.gif)

### 安装

根据官网教程找到发行版下载：
[Albert](https://software.opensuse.org/download.html?project=home:manuelschneid3r&package=albert)

### （可选）主题美化

Albert的默认主题非常一般，可以替换主题。我很多时候都会选择使用 Dracula 的主题，因为生态比较好，对各种应用都有主题支持，这款 Albert 也不例外。安装好后就会和上面的截图一样，是一个好看的紫色框。

[Albert • Dracula Theme](https://draculatheme.com/albert)

## 截屏工具 Flameshot

这款软件我使用率极高，毕竟截图需求太常见了。虽然 UI 丑了点，但是实用性太高了，几乎不可替代。

![flameshot](https://raw.githubusercontent.com/flameshot-org/flameshot/master/data/img/preview/animatedUsage.gif)

### 安装

[Flameshot](https://github.com/flameshot-org/flameshot)

## 录屏工具 Peek/Kooha

提供了截屏之外的 Gif 或 MP4 录制功能，也是不可或缺的，比如我这篇文章就会使用到录制功能。需要注意的是，我目前使用的是 Peek，但这款软件已经不再维护了。可以尝试另一款持续更新的软件 [Kooha](https://github.com/SeaDve/Kooha)。

![peek](https://raw.githubusercontent.com/phw/peek/master/data/screenshots/peek-recording-itself.gif)

### 安装

[Peek](https://github.com/phw/peek)
[Kooha](https://github.com/SeaDve/Kooha)

## 剪贴板管理工具 CopyQ

原则上来说剪贴板管理是最常用的功能了，毕竟程序员时时刻刻都在 ctrl+c/v。Mac 上的 Paste 是绝对的体验天花板，我在 Windows 时找了半天也没找到最满意的，就一直用跨平台的 CopyQ 将就下（功能很丰富，就是依然丑），不过用久了也习惯了。

主要功能就是复制过的历史记录搜索，以及可以持久保存的分区。

### 安装

[CopyQ](https://github.com/hluk/CopyQ)

## （可选）主题美化

同样的，Dracula 也有适配 CopyQ 的主题，很棒：[CopyQ • Dracula Theme](https://draculatheme.com/copyq)

## 结语

我觉得比较重要的配置大概就这些了，其余的基建往往就看个人喜好了。
