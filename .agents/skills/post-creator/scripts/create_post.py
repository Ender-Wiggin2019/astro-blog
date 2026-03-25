#!/usr/bin/env python3

import argparse
from datetime import datetime
from pathlib import Path


def parse_list(raw: str) -> list[str]:
    items = [part.strip() for part in raw.split(",")]
    return [item for item in items if item]


def quote_list(values: list[str]) -> str:
    return ", ".join(f"'{value}'" for value in values)


def default_timestamp() -> str:
    return datetime.now().strftime("%Y-%m-%d") + " 12:00:00.0"


def infer_description(body: str) -> str:
    for line in body.splitlines():
        text = line.strip()
        if text:
            return text[:120]
    return ""


def build_post(
    title: str,
    pub_date: str,
    updated: str,
    categories: list[str],
    tags: list[str],
    description: str,
    body: str,
) -> str:
    frontmatter = [
        "---",
        f"title: {title}",
        f"pubDate: {pub_date}",
        f"updated: {updated}",
        f"categories: [{quote_list(categories)}]",
        f"tags: [{quote_list(tags)}]",
        f"description: '{description}'",
        "---",
        "",
    ]
    return "\n".join(frontmatter) + body.rstrip() + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create an Astro blog post markdown file."
    )
    parser.add_argument("--title", required=True, help="Post title")
    parser.add_argument("--body-file", required=True, help="Markdown body file path")
    parser.add_argument("--output", required=True, help="Output markdown file path")
    parser.add_argument("--pub-date", default=None, help="Publish date")
    parser.add_argument("--updated", default=None, help="Updated date")
    parser.add_argument(
        "--categories", default="所思所想", help="Comma-separated categories"
    )
    parser.add_argument("--tags", default="随笔", help="Comma-separated tags")
    parser.add_argument("--description", default=None, help="Post description")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite output file if it already exists",
    )
    args = parser.parse_args()

    body_path = Path(args.body_file)
    out_path = Path(args.output)

    if not body_path.exists():
        raise FileNotFoundError(f"Body file does not exist: {body_path}")

    if out_path.exists() and not args.force:
        raise FileExistsError(
            f"Output file already exists: {out_path}. Use --force to overwrite."
        )

    body = body_path.read_text(encoding="utf-8")
    pub_date = args.pub_date or default_timestamp()
    updated = args.updated or pub_date
    categories = parse_list(args.categories)
    tags = parse_list(args.tags)
    description = args.description or infer_description(body)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        build_post(
            title=args.title,
            pub_date=pub_date,
            updated=updated,
            categories=categories,
            tags=tags,
            description=description,
            body=body,
        ),
        encoding="utf-8",
    )

    print(f"Created: {out_path}")


if __name__ == "__main__":
    main()
