#!/usr/bin/env python3
"""
Markdown Lint Hook
Validates markdown files before edit/write operations.
Checks content quality and filename bracket consistency.
"""

import json
import sys
import os
from pathlib import Path

def has_half_brackets(filename: str) -> bool:
    """Check if filename contains half-width parentheses."""
    return '(' in filename or ')' in filename

def fix_brackets(filename: str) -> str:
    """Convert half-width parentheses to full-width."""
    return filename.replace('(', '（').replace(')', '）')

def check_filename_brackets(file_path: str, tool_name: str) -> dict:
    """Check bracket consistency in filename.
    - Write: Block if half-width brackets detected (require correct filename)
    - Edit: Auto-fix if file exists with half-width brackets
    """
    filename = os.path.basename(file_path)

    if not filename.endswith('.md'):
        return {"action": "pass", "filename": filename}

    if not has_half_brackets(filename):
        return {"action": "pass", "filename": filename}

    # Half-width brackets detected
    fixed_name = fix_brackets(filename)

    if tool_name == "Write":
        # For new files, block and require correct filename
        return {
            "action": "block",
            "filename": filename,
            "fixed_name": fixed_name,
            "message": f"Filename uses half-width brackets. Use '{fixed_name}' instead of '{filename}'"
        }

    elif tool_name == "Edit":
        if os.path.exists(file_path):
            return {
                "action": "warn",
                "filename": filename,
                "fixed_name": fixed_name,
                "message": f"File has half-width brackets. Consider renaming to '{fixed_name}'"
            }
        else:
            return {
                "action": "block",
                "filename": filename,
                "fixed_name": fixed_name,
                "message": f"Filename uses half-width brackets. Use '{fixed_name}' instead of '{filename}'"
            }

    return {"action": "pass", "filename": filename}

def lint_content(content: str) -> list:
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

    # Only lint Write and Edit operations
    if tool_name not in ["Write", "Edit"]:
        sys.exit(0)

    tool_input = data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    # Only lint markdown files
    if not file_path.endswith('.md'):
        sys.exit(0)

    # Check 1: Filename bracket consistency
    bracket_result = check_filename_brackets(file_path, tool_name)

    if bracket_result["action"] == "block":
        print(f"Error: {bracket_result['message']}", file=sys.stderr)
        sys.exit(2)

    elif bracket_result["action"] == "warn":
        print(f"Warning: {bracket_result['message']}", file=sys.stderr)

    # Check 2: Content linting
    content = ""
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception:
            pass

    if content:
        issues = lint_content(content)

        if issues:
            error_issues = [i for i in issues if i["severity"] == "error"]
            if error_issues:
                print(f"Markdown lint errors found:", file=sys.stderr)
                for issue in error_issues:
                    print(f"  - {issue['message']}", file=sys.stderr)
                sys.exit(2)

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
