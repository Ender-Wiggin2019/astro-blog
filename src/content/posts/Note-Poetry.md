---
title: "学习笔记 | Poetry: Python 包管理器"
pubDate: 2023-11-22 21:00:00.0
updated: 2023-11-22 21:00:00.0
categories: ['学习笔记']
tags: ['Web开发', 'Python']
description: ' '
---
## 依赖组

Poetry 提供了一种按组组织依赖项的方法。例如，您可能具有仅测试项目或构建文档所需的依赖项。

```toml
[tool.poetry.group.test]  # This part can be left out

[tool.poetry.group.test.dependencies]
pytest = "^6.0.0"
pytest-mock = "*"

[tool.poetry.group.docs]
optional = true # 说明该组可选, 可以通过 poetry install --with docs 安装

[tool.poetry.group.docs.dependencies]
mkdocs = "*"
```

- 除隐式 `main` 组之外的依赖项组必须仅包含开发过程中所需的依赖项。
- `[tool.poetry.extras]` 可以设定可选依赖，安装时也可以使用 `-E|--extras` 选项指定额外内容。
- `poetry add pytest --group test` 可以将依赖添加到配置文件对应组中
- `[tool.poetry.group.dev.dependencies]` 是开发依赖的首选形式, 早期版本存在 `[tool.poetry.dev-dependencies]`, 目前暂时向下兼容

```zsh
poetry install --with test,docs --without docs
```

- 通过 `with` 和 `without` 关键词可以选择组, 其中 `without` 有更高优先级
- 只想安装特定组, 可以使用 `only` ( `--only-root` 只安装根目录)

```zsh
poetry install --sync
```

Poetry 支持所谓的依赖同步。依赖项同步可确保 `poetry.lock` 文件中锁定的依赖项是环境中唯一存在的依赖项，从而删除任何不需要的内容。

## 打包

```zsh
poetry build
```

```zsh
poetry publish # 发布到 PyPl

poetry publish -r my-repository # 发布到私有仓库
```

私有仓库配置 [Repositories | Documentation | Poetry - Python dependency management and packaging made easy](https://python-poetry.org/docs/repositories/#adding-a-repository)

## 环境

```zsh
poetry env use /full/path/to/python # 指定路径
poetry env use python3.7 # 使用安装过的版本 (or poetry env use 3.7)
poetry env use system # 默认行为

poetry env info # 检查环境
```


```zsh
poetry env list # 列出与当前项目关联的所有虚拟环境
poetry env list --full-path # 显示完整路径

poetry env remove 3.7 # 删除环境
poetry env remove --all # 删除所有
```

## 更新

### Caret requirements

Caret 要求允许 SemVer 兼容更新到指定版本。如果新版本号不修改主要、次要、补丁分组中最左边的非零数字，则允许更新。例如，如果我们之前运行 `poetry add requests@^2.13.0` 并想要更新库并运行 `poetry update requests` ，诗歌会将我们更新到版本 `2.14.0` （如果可用），但会不要将我们更新为 `3.0.0` 。如果我们将版本字符串指定为 `^0.1.13` ，将更新为 `0.1.14` 而不是 `0.2.0` 。 `0.0.x` 不被视为与任何其他版本兼容。

### Tilde requirements

|REQUIREMENT 要求|VERSIONS ALLOWED 允许的版本|
|---|---|
|~1.2.3|>=1.2.3 <1.3.0|
|~1.2|>=1.2.0 <1.3.0|
|~1|>=1.0.0 <2.0.0|

### Wildcard requirements

即使用 `*`

### Using the `@` operator

```zsh
poetry add django@^4.0.0 # 类似于 == (Django = "^4.0.0")
poetry add django@latest # 特殊关键词
```

### git 依赖

```zsh
[tool.poetry.dependencies]
requests = { git = "https://github.com/requests/requests.git" } # 最基础情况

# 更加复杂的情况
[tool.poetry.dependencies]
# Get the latest revision on the branch named "next"
requests = { git = "https://github.com/kennethreitz/requests.git", branch = "next" }
# Get a revision by its commit hash
flask = { git = "https://github.com/pallets/flask.git", rev = "38eb5d3b" }
# Get a revision by its tag
numpy = { git = "https://github.com/numpy/numpy.git", tag = "v0.13.2" }
```

```zsh
# 添加
poetry add "git+https://github.com/myorg/mypackage_with_subdirs.git#subdirectory=subdir"

# ssh 配置
[tool.poetry.dependencies]
requests = { git = "git@github.com:requests/requests.git" }
```

另外本地目录以及远程链接见文档 [Dependency specification | Documentation | Poetry - Python dependency management and packaging made easy](https://python-poetry.org/docs/dependency-specification/#path-dependencies)

