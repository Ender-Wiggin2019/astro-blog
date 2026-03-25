---
name: post-creator
description: Create or update blog posts for this Astro repository without re-discovering project conventions. Use this skill whenever the user asks to publish, draft, or revise an article, especially when they provide title/date/body and want a ready-to-commit markdown post.
---

# Post Creator

Create blog posts quickly and consistently for this repo.

## When to use

Use this skill when the user asks to:
- create a new post
- update an existing post
- rewrite title/date/tags/frontmatter
- generate a post file directly from user-provided content

## What this skill guarantees

1. Correct file location and naming convention
2. Correct frontmatter keys and date format
3. Clean markdown body formatting
4. A fast verification pass before responding

## Required project conventions

Read `references/project-conventions.md` before writing any post.

Use `assets/post-template.md` as the default skeleton.

If you need deterministic generation from a body file, use `scripts/create_post.py`.

## Workflow

1. Parse user input
   - Required: `title`, `body`
   - Optional: `date`, `updated`, `filename`, `categories`, `tags`, `description`

2. Resolve defaults
   - If `date` is missing, use today's date with `12:00:00.0`
   - If `updated` is missing, set it equal to `pubDate`
   - If `categories` is missing, default to `['所思所想']`
   - If `tags` is missing, default to `['随笔']`
   - If `description` is missing, use the first sentence or first paragraph trimmed to a short summary

3. Resolve filename
   - If user provides filename, use it
   - Otherwise generate an ASCII filename in `Pascal-Case` with a semantic prefix:
     - `所思所想` -> `Thought-...`
     - `影评` -> `Review-...`
     - `笔记` -> `Note-...`
   - Save under `src/content/posts/<filename>.md`

4. Write or update post
   - Keep user body text faithful
   - Preserve paragraph breaks
   - Do not add extra headings unless the user requests structure changes

5. Verify
   - Re-read the file
   - Confirm frontmatter includes `title`, `pubDate`, `updated`, `categories`, `tags`, `description`
   - Confirm dates use `YYYY-MM-DD HH:MM:SS.0`

6. Respond
   - Return final path and key metadata
   - Mention any defaults that were auto-applied

## Safety and boundaries

- Do not modify unrelated files.
- Do not rewrite user prose style unless asked.
- If updating an existing file, only touch requested sections.

## Optional deterministic generator

Use this helper when the user provides content in a file and wants fast generation:

```bash
python .agents/skills/post-creator/scripts/create_post.py \
  --title "所思所想 | 示例标题" \
  --body-file /tmp/post-body.md \
  --output src/content/posts/Thought-Example.md \
  --pub-date "2026-03-26 12:00:00.0" \
  --categories "所思所想" \
  --tags "随笔"
```
