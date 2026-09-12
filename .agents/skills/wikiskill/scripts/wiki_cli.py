#!/usr/bin/env python3
"""
wiki_cli.py — Codebase Wiki & LLM Knowledge Management CLI
Provides index rebuilding, link linting, and semantic search for the repository wiki.
Adheres to /ponytail principles: zero third-party dependencies, standard library only.
"""

import os
import sys
import re
import argparse
from pathlib import Path

DEFAULT_WIKI_DIR = "docs/wiki"

def find_repo_root() -> Path:
    current = Path.cwd()
    for parent in [current] + list(current.parents):
        if (parent / ".git").exists() or (parent / "package.json").exists():
            return parent
    return current

def get_wiki_dir(custom_path: str = None) -> Path:
    repo_root = find_repo_root()
    if custom_path:
        p = Path(custom_path)
        return p if p.is_absolute() else repo_root / p
    return repo_root / DEFAULT_WIKI_DIR

def cmd_index(args):
    wiki_dir = get_wiki_dir(args.wiki_dir)
    if not wiki_dir.exists():
        print(f"[Error] Wiki directory not found at: {wiki_dir}")
        sys.exit(1)

    index_file = wiki_dir / "INDEX.md"
    categories = {}

    for md_file in sorted(wiki_dir.rglob("*.md")):
        if md_file.name == "INDEX.md":
            continue
        rel_path = md_file.relative_to(wiki_dir)
        category = rel_path.parent.as_posix() if rel_path.parent.as_posix() != "." else "general"

        # Read first H1 heading and first paragraph
        title = md_file.stem.replace("-", " ").title()
        summary = "No description provided."
        try:
            content = md_file.read_text(encoding="utf-8")
            h1_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
            if h1_match:
                title = h1_match.group(1).strip()
            # find overview or first substantive paragraph
            overview_match = re.search(r"##\s+(?:1\.\s+)?Overview[^\n]*\n+([^#\n][^\n]+)", content, re.IGNORECASE)
            if overview_match:
                summary = overview_match.group(1).strip()
            else:
                para_match = re.search(r"(?:^#\s+.+\n+)([^#\n].+)", content)
                if para_match:
                    summary = para_match.group(1).strip()
        except Exception:
            pass

        if category not in categories:
            categories[category] = []
        categories[category].append({
            "title": title,
            "rel_path": rel_path.as_posix(),
            "summary": summary
        })

    # Generate master index markdown
    lines = [
        "# SponsorSlot Architecture & Engineering Wiki Index",
        "",
        "> Authoritative, source-grounded knowledge base for system contracts, schemas, and runtime playbooks.",
        "",
        "---",
        ""
    ]

    for cat in sorted(categories.keys()):
        cat_title = cat.replace("-", " ").replace("_", " ").title()
        lines.append(f"## {cat_title}")
        lines.append("")
        for item in categories[cat]:
            lines.append(f"- [**{item['title']}**]({item['rel_path']}) — {item['summary']}")
        lines.append("")

    lines.append("---")
    lines.append("*Maintained via `.agents/skills/wikiskill/scripts/wiki_cli.py`.*")
    lines.append("")

    index_file.write_text("\n".join(lines), encoding="utf-8")
    print(f"✓ Successfully indexed {sum(len(v) for v in categories.values())} wiki documents into: {index_file}")

def cmd_lint(args):
    wiki_dir = get_wiki_dir(args.wiki_dir)
    repo_root = find_repo_root()
    if not wiki_dir.exists():
        print(f"[Error] Wiki directory not found at: {wiki_dir}")
        sys.exit(1)

    errors = 0
    warnings = 0

    link_pattern = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")

    for md_file in wiki_dir.rglob("*.md"):
        try:
            content = md_file.read_text(encoding="utf-8")
        except Exception as e:
            print(f"[Error] Failed to read {md_file}: {e}")
            errors += 1
            continue

        for match in link_pattern.finditer(content):
            label = match.group(1)
            target = match.group(2).strip()

            # Ignore web links, anchors, or mailto
            if target.startswith("http://") or target.startswith("https://") or target.startswith("#") or target.startswith("mailto:"):
                continue

            # Strip query strings or fragment anchors
            clean_target = target.split("#")[0].split("?")[0]
            if not clean_target:
                continue

            if clean_target.startswith("file://"):
                target_path = Path(clean_target.replace("file://", ""))
            elif clean_target.startswith("/"):
                target_path = repo_root / clean_target.lstrip("/")
            else:
                target_path = (md_file.parent / clean_target).resolve()

            if not target_path.exists():
                rel_doc = md_file.relative_to(wiki_dir)
                print(f"[Lint Error] Broken link in {rel_doc}: [{label}]({target}) -> Target does not exist: {target_path}")
                errors += 1

    if errors == 0:
        print(f"✓ Wiki link audit passed cleanly with 0 errors across {len(list(wiki_dir.rglob('*.md')))} files.")
    else:
        print(f"✗ Found {errors} broken links in wiki.")
        sys.exit(1)

def cmd_search(args):
    wiki_dir = get_wiki_dir(args.wiki_dir)
    if not wiki_dir.exists():
        print(f"[Error] Wiki directory not found at: {wiki_dir}")
        sys.exit(1)

    query = args.query.lower()
    matches = []

    for md_file in wiki_dir.rglob("*.md"):
        try:
            content = md_file.read_text(encoding="utf-8")
            if query in content.lower():
                # Extract first matching snippet
                lines = content.splitlines()
                matching_lines = [l.strip() for l in lines if query in l.lower() and not l.startswith("#")]
                snippet = matching_lines[0] if matching_lines else "Matched in document"
                matches.append((md_file.relative_to(wiki_dir), snippet))
        except Exception:
            pass

    print(f"🔍 Search results for '{args.query}' ({len(matches)} matches):")
    for path, snippet in matches:
        print(f"  • docs/wiki/{path}: {snippet[:100]}...")

def main():
    parser = argparse.ArgumentParser(description="Codebase Wiki & LLM Knowledge Management CLI")
    parser.add_argument("--wiki-dir", default=None, help="Custom path to wiki directory")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("index", help="Rebuild master INDEX.md")
    subparsers.add_parser("lint", help="Verify links and detect drift")
    search_p = subparsers.add_parser("search", help="Search wiki topics")
    search_p.add_argument("--query", "-q", required=True, help="Search query string")

    args = parser.parse_args()
    if args.command == "index":
        cmd_index(args)
    elif args.command == "lint":
        cmd_lint(args)
    elif args.command == "search":
        cmd_search(args)

if __name__ == "__main__":
    main()
