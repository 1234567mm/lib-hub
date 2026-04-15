#!/usr/bin/env python3
"""
Markdown Lint Hook
Validates markdown files before edit/write operations.
"""

import json
import sys
import re
from pathlib import Path

# Common lint rules
RULES = [
    {
        "name": "no-trailing-whitespace",
        "pattern": r"[ \t]+$",
        "message": "Trailing whitespace found",
        "severity": "warning"
    },
    {
        "name": "no-multiple-blank-lines",
        "pattern": r"\n\n\n+",
        "message": "Multiple consecutive blank lines found",
        "severity": "warning"
    },
    {
        "name": "heading-level-skip",
        "pattern": r"^#{1}[^#]",
        "message": "H1 headings should only be used once per file",
        "severity": "error"
    },
    {
        "name": "no-bare-urls",
        "pattern": r"https?://[^\s\)\"']+",
        "message": "Consider using link syntax instead of bare URLs",
        "severity": "info"
    },
]

def lint_content(content: str, file_path: str) -> list:
    """Lint markdown content and return issues."""
    issues = []
    lines = content.split('\n')

    # Rule: Only one H1
    h1_count = sum(1 for line in lines if line.startswith('# ') and not line.startswith('##'))
    if h1_count > 1:
        issues.append({
            "rule": "single-h1",
            "message": f"Multiple H1 headings found ({h1_count})",
            "severity": "error",
            "line": None
        })

    # Rule: Trailing whitespace
    for i, line in enumerate(lines, 1):
        if line.rstrip() != line:
            issues.append({
                "rule": "trailing-whitespace",
                "message": f"Trailing whitespace on line {i}",
                "severity": "warning",
                "line": i
            })

    # Rule: Multiple blank lines
    if '\n\n\n' in content:
        issues.append({
            "rule": "multiple-blank-lines",
            "message": "Multiple consecutive blank lines",
            "severity": "warning",
            "line": None
        })

    return issues

def main():
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print("Invalid JSON input", file=sys.stderr)
        sys.exit(1)

    tool_name = data.get("tool_name", "")

    # Only lint Write and Edit operations on .md files
    if tool_name not in ["Write", "Edit"]:
        sys.exit(0)

    tool_input = data.get("tool_input", {})

    # For Write, get content directly
    if tool_name == "Write":
        content = tool_input.get("content", "")
        file_path = tool_input.get("file_path", "")
    # For Edit, need to read the file
    elif tool_name == "Edit":
        file_path = tool_input.get("file_path", "")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception:
            sys.exit(0)  # File doesn't exist yet

    # Only lint markdown files
    if not file_path.endswith('.md'):
        sys.exit(0)

    # Check for frontmatter
    has_frontmatter = content.startswith('---')

    issues = lint_content(content, file_path)

    if issues:
        error_issues = [i for i in issues if i["severity"] == "error"]
        if error_issues:
            print(f"Markdown lint errors found:", file=sys.stderr)
            for issue in error_issues:
                print(f"  - {issue['message']}", file=sys.stderr)
            sys.exit(2)  # Block on errors

        # Just warnings - allow but report
        warning_issues = [i for i in issues if i["severity"] == "warning"]
        if warning_issues:
            output = {
                "continue": True,
                "additionalContext": f"Markdown lint warnings: {'; '.join(i['message'] for i in warning_issues)}"
            }
            print(json.dumps(output))

    sys.exit(0)

if __name__ == "__main__":
    main()
