#!/usr/bin/env python3
# /// script
# requires-python = ">=3.9"
# dependencies = ["tiktoken"]
# ///
"""
Codebase Scanner for Mercator AI (Merkle-Enhanced)
Scans a directory tree, computes merkle tree of hashes, and outputs file paths with token counts.
Uses tiktoken for accurate Claude-compatible token estimation.

Run with: uv run scan-codebase.py [path]
UV will automatically install tiktoken in an isolated environment.

Merkle tree enables:
- O(1) change detection via root hash comparison
- Surgical updates: only re-explore changed branches
- Works without git (hash-based diff)

Based on Bootoshi's Cartographer scanner (https://github.com/kingbootoshi/cartographer)
Enhanced with merkle tree hashing, diff mode, and manifest generation.
"""

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Optional

try:
    import tiktoken
except ImportError:
    print("ERROR: tiktoken not installed.", file=sys.stderr)
    print("", file=sys.stderr)
    print("Recommended: Install UV for automatic dependency handling:", file=sys.stderr)
    print("  curl -LsSf https://astral.sh/uv/install.sh | sh", file=sys.stderr)
    print("  Then run: uv run scan-codebase.py", file=sys.stderr)
    print("", file=sys.stderr)
    print("Or install tiktoken manually: pip install tiktoken", file=sys.stderr)
    sys.exit(1)

# Default patterns to always ignore (common non-code files)
DEFAULT_IGNORE = {
    # Directories
    ".git", ".svn", ".hg", "node_modules", "__pycache__", ".pytest_cache",
    ".mypy_cache", ".ruff_cache", "venv", ".venv", "env", ".env", "dist",
    "build", ".next", ".nuxt", ".output", "coverage", ".coverage", ".nyc_output",
    "target", "vendor", ".bundle", ".cargo",
    # Files
    ".DS_Store", "Thumbs.db", "*.pyc", "*.pyo", "*.so", "*.dylib", "*.dll",
    "*.exe", "*.o", "*.a", "*.lib", "*.class", "*.jar", "*.war", "*.egg",
    "*.whl", "*.lock", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "bun.lockb", "Cargo.lock", "poetry.lock", "Gemfile.lock", "composer.lock",
    # Binary/media
    "*.png", "*.jpg", "*.jpeg", "*.gif", "*.ico", "*.svg", "*.webp",
    "*.mp3", "*.mp4", "*.wav", "*.avi", "*.mov", "*.pdf", "*.zip",
    "*.tar", "*.gz", "*.rar", "*.7z", "*.woff", "*.woff2", "*.ttf",
    "*.eot", "*.otf",
    # Large generated files
    "*.min.js", "*.min.css", "*.map", "*.chunk.js", "*.bundle.js",
}


def parse_gitignore(root: Path) -> list[str]:
    """Parse .gitignore file and return patterns."""
    gitignore_path = root / ".gitignore"
    patterns = []
    if gitignore_path.exists():
        with open(gitignore_path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    patterns.append(line)
    return patterns


def matches_pattern(path: Path, pattern: str, root: Path) -> bool:
    """Check if a path matches a gitignore-style pattern."""
    import fnmatch

    if pattern.startswith("!"):
        return False

    if pattern.endswith("/"):
        if not path.is_dir():
            return False
        pattern = pattern[:-1]

    rel_path = str(path.relative_to(root))
    if "/" in pattern:
        pattern = pattern.lstrip("/")
        return fnmatch.fnmatch(rel_path, pattern) or fnmatch.fnmatch(rel_path, pattern + "/**")

    return fnmatch.fnmatch(path.name, pattern)


def should_ignore(path: Path, root: Path, gitignore_patterns: list[str]) -> bool:
    """Check if a path should be ignored."""
    import fnmatch
    name = path.name

    for pattern in DEFAULT_IGNORE:
        if ("*" in pattern and fnmatch.fnmatch(name, pattern)) or name == pattern:
            return True

    return any(matches_pattern(path, pattern, root) for pattern in gitignore_patterns)


def count_tokens(text: str, encoding: tiktoken.Encoding) -> int:
    """Count tokens in text using tiktoken."""
    try:
        return len(encoding.encode(text))
    except Exception:
        return len(text) // 4


def compute_hash(content: bytes) -> str:
    """Compute SHA-256 hash of content, return first 12 chars."""
    return hashlib.sha256(content).hexdigest()[:12]


def compute_merkle_hash(child_hashes: list[str]) -> str:
    """Compute merkle hash from sorted child hashes."""
    combined = "".join(sorted(child_hashes))
    return hashlib.sha256(combined.encode()).hexdigest()[:12]


def is_text_file(path: Path) -> bool:
    """Check if a file is likely a text file."""
    text_extensions = {
        ".py", ".js", ".ts", ".jsx", ".tsx", ".vue", ".svelte", ".html", ".htm",
        ".css", ".scss", ".sass", ".less", ".json", ".yaml", ".yml", ".toml",
        ".xml", ".md", ".mdx", ".txt", ".rst", ".sh", ".bash", ".zsh", ".fish",
        ".ps1", ".bat", ".cmd", ".sql", ".graphql", ".gql", ".proto", ".go",
        ".rs", ".rb", ".php", ".java", ".kt", ".kts", ".scala", ".clj", ".cljs",
        ".edn", ".ex", ".exs", ".erl", ".hrl", ".hs", ".lhs", ".ml", ".mli",
        ".fs", ".fsx", ".fsi", ".cs", ".vb", ".swift", ".m", ".mm", ".h",
        ".hpp", ".c", ".cpp", ".cc", ".cxx", ".r", ".R", ".jl", ".lua", ".vim",
        ".el", ".lisp", ".scm", ".rkt", ".zig", ".nim", ".d", ".dart", ".v",
        ".sv", ".vhd", ".vhdl", ".tf", ".hcl", ".dockerfile", ".containerfile",
        ".makefile", ".cmake", ".gradle", ".groovy", ".rake", ".gemspec",
        ".podspec", ".cabal", ".nix", ".dhall", ".jsonc", ".json5", ".cson",
        ".ini", ".cfg", ".conf", ".config", ".env", ".env.example", ".env.local",
        ".env.development", ".env.production", ".gitignore", ".gitattributes",
        ".editorconfig", ".prettierrc", ".eslintrc", ".stylelintrc", ".babelrc",
        ".nvmrc", ".ruby-version", ".python-version", ".node-version", ".tool-versions",
    }

    suffix = path.suffix.lower()
    if suffix in text_extensions:
        return True

    name = path.name.lower()
    text_names = {
        "readme", "license", "licence", "changelog", "authors", "contributors",
        "copying", "dockerfile", "containerfile", "makefile", "rakefile",
        "gemfile", "procfile", "brewfile", "vagrantfile", "justfile", "taskfile",
    }
    if name in text_names:
        return True

    try:
        with open(path, "rb") as f:
            chunk = f.read(8192)
            if b"\x00" in chunk:
                return False
            try:
                chunk.decode("utf-8")
                return True
            except UnicodeDecodeError:
                return False
    except Exception:
        return False


def scan_directory(
    root: Path,
    encoding: tiktoken.Encoding,
    max_file_tokens: int = 50000,
) -> dict:
    """
    Scan a directory and return file information with token counts and merkle tree.

    Returns a dict with:
    - files: list of {path, tokens, size_bytes, hash}
    - directories: list of directory paths
    - total_tokens: sum of all file tokens
    - total_files: count of files
    - skipped: list of skipped files
    - merkle: {root_hash, tree: {path: {hash, children}}}
    """
    root = root.resolve()
    gitignore_patterns = parse_gitignore(root)

    files = []
    directories = []
    skipped = []
    total_tokens = 0

    merkle_tree: dict = {}

    def walk(current: Path, depth: int = 0) -> Optional[str]:
        """Walk directory, return merkle hash for this node."""
        nonlocal total_tokens

        if should_ignore(current, root, gitignore_patterns):
            return None

        rel_path = str(current.relative_to(root))

        if current.is_dir():
            if rel_path != ".":
                directories.append(rel_path)

            child_hashes = []
            child_paths = []

            try:
                entries = sorted(current.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower()))
                for entry in entries:
                    child_hash = walk(entry, depth + 1)
                    if child_hash:
                        child_hashes.append(child_hash)
                        child_paths.append(str(entry.relative_to(root)))
            except PermissionError:
                skipped.append({"path": rel_path, "reason": "permission_denied"})
                return None

            if child_hashes:
                dir_hash = compute_merkle_hash(child_hashes)
                merkle_tree[rel_path if rel_path != "." else "/"] = {
                    "hash": dir_hash,
                    "children": child_paths,
                    "type": "dir"
                }
                return dir_hash
            return None

        elif current.is_file():
            size_bytes = current.stat().st_size

            if size_bytes > 1_000_000:
                skipped.append({"path": rel_path, "reason": "too_large", "size_bytes": size_bytes})
                return None

            if not is_text_file(current):
                skipped.append({"path": rel_path, "reason": "binary"})
                return None

            try:
                with open(current, "rb") as f:
                    content_bytes = f.read()

                file_hash = compute_hash(content_bytes)
                content = content_bytes.decode("utf-8", errors="ignore")
                tokens = count_tokens(content, encoding)

                if tokens > max_file_tokens:
                    skipped.append({"path": rel_path, "reason": "too_many_tokens", "tokens": tokens})
                    return None

                files.append({
                    "path": rel_path,
                    "tokens": tokens,
                    "size_bytes": size_bytes,
                    "hash": file_hash,
                })

                merkle_tree[rel_path] = {
                    "hash": file_hash,
                    "tokens": tokens,
                    "type": "file"
                }

                total_tokens += tokens
                return file_hash

            except Exception as e:
                skipped.append({"path": rel_path, "reason": f"read_error: {str(e)}"})
                return None

        return None

    root_hash = walk(root)

    return {
        "root": str(root),
        "files": files,
        "directories": directories,
        "total_tokens": total_tokens,
        "total_files": len(files),
        "skipped": skipped,
        "merkle": {
            "root_hash": root_hash or "",
            "tree": merkle_tree
        }
    }


def diff_merkle(old_tree: dict, new_tree: dict) -> dict:
    """
    Compare two merkle trees and return changes.

    Returns:
    - changed: list of paths where hash differs
    - added: list of new paths
    - removed: list of deleted paths
    - unchanged: list of paths with same hash
    """
    old_paths = set(old_tree.keys())
    new_paths = set(new_tree.keys())

    added = list(new_paths - old_paths)
    removed = list(old_paths - new_paths)

    changed = []
    unchanged = []

    for path in old_paths & new_paths:
        if old_tree[path].get("hash") != new_tree[path].get("hash"):
            changed.append(path)
        else:
            unchanged.append(path)

    return {
        "changed": sorted(changed),
        "added": sorted(added),
        "removed": sorted(removed),
        "unchanged": sorted(unchanged),
        "has_changes": bool(changed or added or removed)
    }


def format_tree(scan_result: dict, show_tokens: bool = True, show_hash: bool = False) -> str:
    """Format scan results as a tree structure."""
    lines = []
    root_name = Path(scan_result["root"]).name
    root_hash = scan_result.get("merkle", {}).get("root_hash", "")

    if show_hash and root_hash:
        lines.append(f"{root_name}/ [{root_hash}]")
    else:
        lines.append(f"{root_name}/")
    lines.append(f"Total: {scan_result['total_files']} files, {scan_result['total_tokens']:,} tokens")
    lines.append("")

    tree: dict = {}
    for f in scan_result["files"]:
        parts = Path(f["path"]).parts
        current = tree
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]
        current[parts[-1]] = f

    def print_tree(node: dict, prefix: str = ""):
        items = sorted(node.items(), key=lambda x: ("tokens" in x[1], x[0].lower()))

        for i, (name, value) in enumerate(items):
            is_last = i == len(items) - 1
            connector = "└── " if is_last else "├── "

            if isinstance(value, dict) and "tokens" not in value:
                lines.append(f"{prefix}{connector}{name}/")
                extension = "    " if is_last else "│   "
                print_tree(value, prefix + extension)
            else:
                tokens = value.get("tokens", 0)
                hash_str = value.get("hash", "")
                if show_hash and show_tokens:
                    lines.append(f"{prefix}{connector}{name} ({tokens:,} tok) [{hash_str}]")
                elif show_tokens:
                    lines.append(f"{prefix}{connector}{name} ({tokens:,} tokens)")
                elif show_hash:
                    lines.append(f"{prefix}{connector}{name} [{hash_str}]")
                else:
                    lines.append(f"{prefix}{connector}{name}")

    print_tree(tree)
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Scan a codebase and output file paths with token counts and merkle tree"
    )
    parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Path to scan (default: current directory)",
    )
    parser.add_argument(
        "--format",
        choices=["json", "tree", "compact", "merkle"],
        default="json",
        help="Output format (default: json). 'merkle' outputs just the merkle tree.",
    )
    parser.add_argument(
        "--diff",
        metavar="MANIFEST",
        help="Compare against a previous merkle manifest (JSON file) and output changes only",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=50000,
        help="Skip files with more than this many tokens (default: 50000)",
    )
    parser.add_argument(
        "--encoding",
        default="cl100k_base",
        help="Tiktoken encoding to use (default: cl100k_base)",
    )
    parser.add_argument(
        "--show-hash",
        action="store_true",
        help="Show file hashes in tree output",
    )

    args = parser.parse_args()
    path = Path(args.path).resolve()

    if not path.exists():
        print(f"ERROR: Path does not exist: {path}", file=sys.stderr)
        sys.exit(1)

    if not path.is_dir():
        print(f"ERROR: Path is not a directory: {path}", file=sys.stderr)
        sys.exit(1)

    try:
        encoding = tiktoken.get_encoding(args.encoding)
    except Exception as e:
        print(f"ERROR: Failed to load encoding '{args.encoding}': {e}", file=sys.stderr)
        sys.exit(1)

    result = scan_directory(path, encoding, args.max_tokens)

    # Diff mode: compare against previous manifest
    if args.diff:
        try:
            with open(args.diff, "r") as f:
                old_manifest = json.load(f)
            old_tree = old_manifest.get("merkle", {}).get("tree", {})
            new_tree = result.get("merkle", {}).get("tree", {})
            diff = diff_merkle(old_tree, new_tree)

            diff["current_root_hash"] = result["merkle"]["root_hash"]
            diff["previous_root_hash"] = old_manifest.get("merkle", {}).get("root_hash", "")
            diff["total_files"] = result["total_files"]
            diff["total_tokens"] = result["total_tokens"]

            print(json.dumps(diff, indent=2))
        except FileNotFoundError:
            print(f"ERROR: Manifest file not found: {args.diff}", file=sys.stderr)
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"ERROR: Invalid JSON in manifest: {e}", file=sys.stderr)
            sys.exit(1)
        return

    if args.format == "json":
        print(json.dumps(result, indent=2))
    elif args.format == "tree":
        print(format_tree(result, show_tokens=True, show_hash=args.show_hash))
    elif args.format == "merkle":
        print(json.dumps(result["merkle"], indent=2))
    elif args.format == "compact":
        files_sorted = sorted(result["files"], key=lambda x: x["tokens"], reverse=True)
        print(f"# {result['root']}")
        print(f"# Total: {result['total_files']} files, {result['total_tokens']:,} tokens")
        print(f"# Merkle root: {result['merkle']['root_hash']}")
        print()
        for f in files_sorted:
            print(f"{f['tokens']:>8} [{f['hash']}] {f['path']}")


if __name__ == "__main__":
    main()
