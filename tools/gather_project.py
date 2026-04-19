#!/usr/bin/env python3
"""
Universal project file gatherer for AI review.

Collects relevant source/config files from a project directory
and combines them into a single markdown file for AI code review.

Smart defaults filter out noise (barrel files, generated files, secrets)
while keeping everything useful for code review.

Usage:
    python gather_project.py [root_dir] [--output output.md]
    python gather_project.py --dry-run
    python gather_project.py --include *.ext --exclude pattern
"""

import argparse
import fnmatch
import os
import re
import sys
from pathlib import Path

# ── Directories to skip entirely ──────────────────────────────────────
EXCLUDE_DIRS = {
    ".git", "node_modules", "vendor", "__pycache__",
    ".venv", "venv", "env", ".tox",
    ".mypy_cache", ".pytest_cache", ".ruff_cache",
    ".svelte-kit", ".next", ".nuxt", ".output",
    "dist", "build", "out", ".cache", ".turbo",
    ".parcel-cache", ".svelte-kit",
    "docs", "test-results",
    "static",
}

# Subdirectory path patterns to exclude (relative, partial match)
EXCLUDE_DIR_PATTERNS = [
    "drizzle/meta",
]

# ── File exclusion patterns ────────────────────────────────────────────
EXCLUDE_FILE_PATTERNS = [
    # Lock files (auto-generated, huge)
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "bun.lock", "bun.lockb", "poetry.lock", "Pipfile.lock",
    # Media
    "*.png", "*.jpg", "*.jpeg", "*.gif", "*.svg", "*.ico",
    "*.webp", "*.bmp", "*.mp4", "*.mp3", "*.wav", "*.avi",
    # Compiled
    "*.pyc", "*.pyo", "*.so", "*.dll", "*.class", "*.exe",
    "*.wasm", "*.map",
    # Archives
    "*.zip", "*.tar", "*.gz", "*.rar", "*.7z",
    # Editor junk
    ".DS_Store", "Thumbs.db", "*.swp", "*.swo", "*.swn", "*.bak",
    # Databases
    "*.sqlite", "*.db", "*.sql.gz",
    # Secrets (keep .example templates)
    ".env", ".env.local", ".env.production", ".env.development",
    # This script's own output & self
    "project_review.md", "project_review_*.md",
    "gather_project.py", "check_excluded.py",
    # Temp files from debugging
    "included.txt", "all_files.txt",
    # Misc noise
    ".gitkeep", "*.log", "*-log.txt", "_*-log.*",
]

# ── File inclusion patterns ────────────────────────────────────────────
INCLUDE_PATTERNS = [
    # Source
    "*.py", "*.js", "*.jsx", "*.ts", "*.tsx", "*.mjs", "*.cjs", "*.d.ts",
    "*.svelte", "*.vue", "*.html", "*.css", "*.scss", "*.sass",
    "*.less", "*.astro", "*.go", "*.rs", "*.java", "*.kt", "*.rb",
    "*.php", "*.cs", "*.swift",
    # SvelteKit special files
    "+page.*", "+layout.*", "+server.*", "+error.*", "+page.server.*",
    "+layout.server.*", "+page.ts", "+layout.ts",
    # Config
    "*.json", "*.yaml", "*.yml", "*.toml", "*.ini", "*.cfg",
    "*.conf", "*.env.example", "*.env.local.example", "*.config.*",
    # Docs
    "*.md", "*.txt", "*.rst",
    # Shell
    "*.sh", "*.bash", "*.zsh", "*.fish",
    # Database
    "*.sql",
    # E2E tests (Playwright)
    "*.spec.ts", "*.spec.js",
    # Special names (no extension)
    "Dockerfile", "Makefile", "Caddyfile", "LICENSE", "README",
    ".gitignore", ".dockerignore", ".prettierrc",
    ".eslintrc", ".eslintrc.*", ".editorconfig",
    # Git
    ".gitmessage", ".gitcommit", ".gitattributes",
]

# ── File type mapping ─────────────────────────────────────────────────
TYPE_MAP = {
    ".py": "python", ".js": "javascript", ".jsx": "javascript",
    ".ts": "typescript", ".tsx": "typescript", ".mjs": "javascript",
    ".cjs": "javascript", ".svelte": "svelte", ".vue": "vue",
    ".html": "html", ".css": "css", ".scss": "scss", ".sass": "sass",
    ".less": "less", ".astro": "astro", ".go": "go", ".rs": "rust",
    ".java": "java", ".kt": "kotlin", ".rb": "ruby", ".php": "php",
    ".cs": "csharp", ".swift": "swift", ".json": "json",
    ".yaml": "yaml", ".yml": "yaml", ".toml": "toml",
    ".md": "markdown", ".txt": "text", ".sql": "sql",
    ".sh": "bash", ".bash": "bash", ".zsh": "zsh", ".fish": "fish",
}


def is_barrel_file(file_path: Path) -> bool:
    """Check if a file is just a barrel re-export (index.ts with only exports)."""
    if file_path.name != "index.ts" and file_path.name != "index.js":
        return False
    try:
        content = file_path.read_text(encoding="utf-8").strip()
        # Remove comments
        content = re.sub(r"//.*$", "", content, flags=re.MULTILINE)
        content = re.sub(r"/\*.*?\*/", "", content, flags=re.DOTALL)
        lines = [l.strip() for l in content.splitlines() if l.strip()]
        if not lines:
            return True
        # Check if all non-empty lines are exports/imports/re-exports
        export_pattern = re.compile(
            r"^(export|import)\s+"           # export/import
            r"|(from\s+['\"])"               # from '...'
            r"|(export\s*\{)"                # export {
            r"|(export\s+\*)"                # export *
            r"|(\/\/)"                        # comment
        )
        for line in lines:
            if not export_pattern.search(line):
                return False
        return True
    except Exception:
        return False


def should_include_file(file_path: Path, root: Path) -> bool:
    """Determine if a file should be included."""
    rel = file_path.relative_to(root)
    rel_str = str(rel).replace("\\", "/")
    name = file_path.name

    # Skip if parent dir is in EXCLUDE_DIRS
    for part in rel.parts[:-1]:
        if part in EXCLUDE_DIRS:
            return False

    # Skip if relative path matches an exclude dir pattern
    for pat in EXCLUDE_DIR_PATTERNS:
        if rel_str.startswith(pat):
            return False

    # Check exclusions — but NOT for .env.example templates
    is_env_example = name.endswith(".env.example") or name.endswith(".env.local.example")

    for pat in EXCLUDE_FILE_PATTERNS:
        if pat.startswith("!"):
            continue  # negation handled below
        # Skip .env exclusion for .example files
        if pat == ".env" and is_env_example:
            continue
        if fnmatch.fnmatch(name, pat):
            # Check if there's a negation that saves it
            negated = False
            for neg_pat in EXCLUDE_FILE_PATTERNS:
                if neg_pat.startswith("!") and fnmatch.fnmatch(name, neg_pat[1:]):
                    negated = True
                    break
            if not negated:
                return False

    # Skip barrel files
    if is_barrel_file(file_path):
        return False

    # Check if file matches any inclusion pattern
    for pat in INCLUDE_PATTERNS:
        if fnmatch.fnmatch(name, pat):
            return True

    return False


def estimate_lang(file_path: Path) -> str:
    """Estimate language for syntax highlighting."""
    ext = file_path.suffix.lower()
    name = file_path.name
    lang = TYPE_MAP.get(ext)
    if lang:
        return lang
    if name in ("Dockerfile", "Makefile", "Caddyfile"):
        return name.lower()
    # SvelteKit special files
    if name.startswith(("+page", "+layout", "+server", "+error")):
        if ext in (".svelte",):
            return "svelte"
        return "typescript"
    if name.startswith("."):
        return "config"
    return ""


def read_file_safe(file_path: Path, max_lines: int = None) -> str:
    """Read file with encoding fallback."""
    for enc in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
        try:
            with open(file_path, "r", encoding=enc) as f:
                content = f.read()
                if max_lines:
                    lines = content.splitlines()
                    if len(lines) > max_lines:
                        return (
                            "\n".join(lines[:max_lines])
                            + f"\n\n<!-- Truncated: first {max_lines} of {len(lines)} lines -->"
                        )
                return content
        except UnicodeDecodeError:
            continue
        except Exception as e:
            return f"<!-- Error: {e} -->"
    return "<!-- Binary or unreadable -->"


def gather_files(
    root: Path,
    max_size: int = 500_000,
    max_lines: int = None,
) -> list[tuple[Path, str]]:
    """Collect all matching files."""
    results = []
    for dirpath, dirnames, filenames in os.walk(root):
        # Prune
        dirnames[:] = [
            d for d in sorted(dirnames)
            if d not in EXCLUDE_DIRS
            and (not d.startswith(".") or d in (".github", ".vscode"))
        ]
        for fn in sorted(filenames):
            fp = Path(dirpath) / fn
            try:
                if fp.stat().st_size > max_size:
                    continue
            except OSError:
                continue
            if should_include_file(fp, root):
                results.append((fp, read_file_safe(fp, max_lines)))
    return results


def build_markdown(root: Path, files: list[tuple[Path, str]]) -> str:
    """Generate combined markdown."""
    out = []
    out.append(f"# Project Review: `{root.name}`")
    out.append("")
    out.append(f"**Files:** {len(files)}  ")
    out.append(f"**Root:** `{root}`")
    out.append("")

    # Table of contents
    out.append("## Contents")
    out.append("")
    for i, (fp, _) in enumerate(files, 1):
        rel = fp.relative_to(root)
        out.append(f"{i}. `{rel}`")
    out.append("")
    out.append("---")
    out.append("")

    # Contents
    for fp, content in files:
        rel = fp.relative_to(root)
        lang = estimate_lang(fp)
        out.append(f"## `{rel}`")
        out.append("")
        out.append(f"```{lang}")
        out.append(content)
        out.append("```")
        out.append("")
        out.append("---")
        out.append("")

    return "\n".join(out)


def main():
    p = argparse.ArgumentParser(description="Gather project files for AI review")
    p.add_argument("root", nargs="?", default=".", help="Root dir (default: .)")
    p.add_argument("-o", "--output", default="project_review.md", help="Output file")
    p.add_argument("--max-size", type=int, default=500_000, help="Max file size bytes")
    p.add_argument("--max-lines", type=int, help="Max lines per file before truncation")
    p.add_argument("--include", nargs="*", help="Extra include patterns")
    p.add_argument("--exclude", nargs="*", help="Extra exclude patterns")
    p.add_argument("--dry-run", action="store_true", help="List files without generating output")
    args = p.parse_args()

    root = Path(args.root).resolve()
    if not root.is_dir():
        print(f"Error: {root} is not a directory", file=sys.stderr)
        sys.exit(1)

    if args.include:
        INCLUDE_PATTERNS.extend(args.include)
    if args.exclude:
        EXCLUDE_FILE_PATTERNS.extend(args.exclude)

    print(f"Scanning: {root}")
    files = gather_files(root, max_size=args.max_size, max_lines=args.max_lines)
    print(f"Found {len(files)} files")

    if args.dry_run:
        for fp, _ in files:
            print(f"  {fp.relative_to(root)}")
        return

    md = build_markdown(root, files)
    out = Path(args.output)
    out.write_text(md, encoding="utf-8")
    print(f"Written: {out} ({out.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
