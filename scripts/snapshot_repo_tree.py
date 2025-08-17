#!/usr/bin/env python3
"""
Snapshot repository tree to a Markdown file with line counts.

Usage (from repo root):
  python3 scripts/snapshot_repo_tree.py --out "_Test_Guardian_Homebase/data/repo-tree-$(date +%Y-%m-%d_%H-%M-%S).md"

Options:
  --root PATH          Root directory to scan (default: current working directory)
  --out PATH           Output Markdown file path (required)
  --exclude NAME ...   One or more directory/file names to exclude (exact name match)

Notes:
  - Excludes common build/cache directories by default (node_modules, target, etc.).
  - Counts lines by counting "\n" bytes; binary files are treated as 0 on read error.
  - Output is a Markdown fenced code block containing a tree-like structure.
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path
from typing import Iterable, List, Set


DEFAULT_EXCLUDES: Set[str] = {
    ".git",
    "node_modules",
    "target",
    "dist",
    "build",
    ".idea",
    ".vscode",
    ".DS_Store",
    "playwright-report",
    "test-results",
    ".pytest_cache",
    ".mypy_cache",
    "__pycache__",
}


def parse_args(argv: Iterable[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a Markdown tree snapshot with line counts."
    )
    parser.add_argument(
        "--root", default=str(Path.cwd()), help="Root directory to scan (default: CWD)"
    )
    parser.add_argument("--out", required=True, help="Output Markdown file path")
    parser.add_argument(
        "--exclude",
        nargs="*",
        default=[],
        help="Additional names (files/dirs) to exclude; exact name matching",
    )
    return parser.parse_args(list(argv))


def count_lines(path: Path) -> int:
    """Count lines by reading bytes and counting newlines. Return 0 on error."""
    try:
        total = 0
        with path.open("rb") as f:
            while True:
                chunk = f.read(1 << 20)  # 1 MiB
                if not chunk:
                    break
                total += chunk.count(b"\n")
        return total
    except Exception:
        return 0


def iter_entries(directory: Path, excludes: Set[str]) -> List[Path]:
    try:
        entries = [e for e in directory.iterdir() if e.name not in excludes]
    except (PermissionError, FileNotFoundError):
        return []
    dirs = sorted((e for e in entries if e.is_dir()), key=lambda p: p.name.lower())
    files = sorted((e for e in entries if e.is_file()), key=lambda p: p.name.lower())
    return [*dirs, *files]


def build_tree_lines(root: Path, excludes: Set[str]) -> List[str]:
    lines: List[str] = []

    def add_tree(d: Path, prefix: str = "") -> None:
        entries = iter_entries(d, excludes)
        for idx, e in enumerate(entries):
            is_last = idx == len(entries) - 1
            tee = "└── " if is_last else "├── "
            child_prefix = prefix + ("    " if is_last else "│   ")
            if e.is_dir():
                lines.append(f"{prefix}{tee}{e.name}/")
                add_tree(e, child_prefix)
            else:
                lc = count_lines(e)
                lines.append(f"{prefix}{tee}{e.name}  ({lc} lines)")

    add_tree(root)
    return lines


def main(argv: Iterable[str]) -> int:
    args = parse_args(argv)
    root = Path(args.root).resolve()
    out_path = Path(args.out)
    excludes = set(DEFAULT_EXCLUDES)
    excludes.update(args.exclude or [])

    header = [
        "# Repository tree with line counts",
        "",
        f"- Generated: {time.strftime('%Y-%m-%d %H:%M:%S %Z')}",
        f"- Root: {root}",
        f"- Excludes: {', '.join(sorted(excludes))}",
        "",
        "```text",
    ]

    body = build_tree_lines(root, excludes)
    content = "\n".join([*header, *body, "```", ""]) + "\n"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(content, encoding="utf-8")
    print(out_path)
    return 0


if __name__ == "__main__":  # pragma: no cover - simple CLI wrapper
    raise SystemExit(main(sys.argv[1:]))
