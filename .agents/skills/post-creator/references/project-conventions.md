# Astro Blog Post Conventions

This reference captures the post format used in this repository.

## Location

- Posts live in `src/content/posts/`
- Use `.md` files

## Frontmatter schema

Use this exact key set for post files:

```yaml
---
title: <string>
pubDate: <date-time>
updated: <date-time>
categories: [<string>, ...]
tags: [<string>, ...]
description: <string>
---
```

Notes:
- `pubDate` and `updated` are parsed as dates by content config.
- Date style used by existing posts: `YYYY-MM-DD HH:MM:SS.0`.
- `categories` is required and should be an array.
- `tags` is usually present in this repo and should be an array for consistency.

## Common defaults

- Category default: `['所思所想']`
- Tag default: `['随笔']`
- For new posts, `updated` should initially equal `pubDate`.

## Naming pattern

Most files follow semantic English prefixes:
- `Thought-*.md`
- `Review-*.md`
- `Note-*.md`
- Other domain-specific prefixes are also used (for example `BG-*`, `Ark-*`).

When user does not provide filename, generate a readable ASCII name in this style.
