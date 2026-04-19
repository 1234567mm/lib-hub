#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sidebar Validate Hook
验证 sidebars.js 中的 docId 是否对应实际存在的文件。
增强版：
- 修复中文编码问题
- 区分 untracked / staged / committed / missing 状态
- 提供修复建议
- 联动 issue-tracker 记录问题
"""

import json
import sys
import re
import subprocess
import os
from pathlib import Path

# 强制设置stdout/stderr编码为UTF-8
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, errors='replace')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, errors='replace')


def get_git_status():
    """获取 git 状态"""
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True,
            text=True,
            errors='replace'
        )
        untracked = set()
        tracked = {}
        for line in result.stdout.splitlines():
            if line.startswith("?? "):
                path = line[3:].strip().replace('\\', '/')
                untracked.add(path)
            elif line.startswith("A ") or line.startswith("M "):
                path = line[3:].strip().replace('\\', '/')
                tracked[path] = 'staged'
        return untracked, tracked
    except Exception as e:
        return set(), {}


def strip_numeric_prefix(filename):
    """去除文件名开头的 NN_ 前缀（Docusaurus docId 规则）"""
    # 匹配开头的一个或多个数字 + 下划线
    return re.sub(r'^\d+_', '', filename)


def check_file_status(doc_id, untracked_files):
    """
    检查 docId 对应的文件状态
    返回: 'committed' | 'staged' | 'untracked' | 'missing'
    """
    # 转换 docId 为文件路径
    path = doc_id.replace('\\', '/')
    file_path = f"docs/{path}.md"

    # 检查是否在 untracked 列表中（精确匹配）
    for f in untracked_files:
        f_clean = f.replace('\\', '/')
        if f_clean == file_path or f_clean.endswith(f"{path}.md"):
            return 'untracked'

    # 检查文件是否存在（精确匹配）
    if Path(file_path).exists():
        # 检查是否已提交
        try:
            result = subprocess.run(
                ["git", "ls-files", "--error-unmatch", file_path],
                capture_output=True,
                text=True,
                errors='replace'
            )
            if result.returncode == 0:
                return 'committed'
        except Exception:
            pass
        return 'staged'

    # 精确匹配失败，尝试带数字前缀的文件（NN_ 前缀规则）
    dir_path = Path(file_path).parent
    filename = Path(file_path).name
    if dir_path.exists():
        for f in dir_path.iterdir():
            if f.is_file() and strip_numeric_prefix(f.name) == filename:
                # 找到了带前缀的文件，等效于 committed
                return 'committed'

    return 'missing'


def extract_doc_ids(sidebars_content):
    """从 sidebars.js 中提取所有 docId"""
    doc_ids = set()
    # 匹配单引号或双引号包裹的 docId
    pattern = r'[\'"]([^\'"]+)[\'"]'
    matches = re.findall(pattern, sidebars_content)
    for match in matches:
        if '/' in match or '\\' in match:
            # 排除对象格式的 label
            if match.startswith('{') or match.startswith('id:'):
                continue
            # 排除 @docusaurus 导入和以 .md 结尾的
            if match.startswith('@') or match.endswith('.md'):
                continue
            # 排除包含空格的（可能是注释）
            if ' ' in match:
                continue
            doc_ids.add(match)
    return doc_ids


def get_fix_suggestion(doc_id, status):
    """根据文件状态生成修复建议"""
    path = doc_id.replace('\\', '/')

    if status == 'untracked':
        return f"请运行: git add docs/{path}.md"
    elif status == 'missing':
        return f"请检查 docId 是否正确，或创建 docs/{path}.md"
    elif status == 'staged':
        return f"文件已 staged，请运行: git commit"
    else:
        return f"请检查 sidebars.js 中的 docId 引用"


def main():
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print("Invalid JSON input", file=sys.stderr)
        sys.exit(0)

    tool_name = data.get("tool_name", "")

    # 只在编辑 sidebars.js 时触发
    if tool_name not in ["Write", "Edit"]:
        sys.exit(0)

    tool_input = data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    if not file_path.endswith('sidebars.js'):
        sys.exit(0)

    # 读取 sidebars.js 内容
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Cannot read sidebars.js: {e}", file=sys.stderr)
        sys.exit(0)

    # 获取 git 状态
    untracked_files, _ = get_git_status()

    # 提取 docId
    doc_ids = extract_doc_ids(content)

    # 验证每个 docId
    missing = []
    untracked = []
    for doc_id in doc_ids:
        path = f"docs/{doc_id.replace(chr(92), '/')}.md"
        status = check_file_status(doc_id, untracked_files)

        if status == 'untracked':
            untracked.append((doc_id, path, status))
        elif status == 'missing':
            missing.append((doc_id, path, status))

    # 记录问题到 issue-tracker
    if missing or untracked:
        try:
            # 调用 issue-tracker.py
            all_issues = missing + untracked
            for doc_id, path, status in all_issues:
                suggestion = get_fix_suggestion(doc_id, status)
                # 构造错误信息
                error_msg = f"{doc_id} ({status})"
                subprocess.run(
                    [sys.executable, ".claude/hooks/issue-tracker.py", error_msg],
                    capture_output=True,
                    text=True,
                    errors='replace'
                )
        except Exception as e:
            print(f"Warning: Failed to record issue: {e}", file=sys.stderr)

    # 输出错误信息
    if missing or untracked:
        print("\n=== Sidebar Validation Errors ===\n", file=sys.stderr)

        if untracked:
            print("Untracked files (文件未提交到 git):", file=sys.stderr)
            for doc_id, path, status in untracked:
                suggestion = get_fix_suggestion(doc_id, status)
                # 安全打印（处理编码）
                safe_doc_id = doc_id.encode('utf-8', errors='replace').decode('utf-8', errors='replace')
                print(f"  - {safe_doc_id}", file=sys.stderr)
                print(f"    {suggestion}", file=sys.stderr)

        if missing:
            print("\nMissing files (文件不存在):", file=sys.stderr)
            for doc_id, path, status in missing:
                suggestion = get_fix_suggestion(doc_id, status)
                safe_doc_id = doc_id.encode('utf-8', errors='replace').decode('utf-8', errors='replace')
                print(f"  - {safe_doc_id}", file=sys.stderr)
                print(f"    {suggestion}", file=sys.stderr)

        print("\n请修复后重新提交", file=sys.stderr)
        sys.exit(2)

    print("Sidebar validation passed", file=sys.stderr)
    sys.exit(0)


if __name__ == "__main__":
    main()
