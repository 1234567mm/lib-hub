#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sidebar Validate Hook
验证 sidebars.js 中的 docId 是否对应实际存在的文件。

增强版：
- 修复中文编码问题（Windows GBK vs UTF-8）
- 支持 Docusaurus NN_ 前缀规则（文件名中的数字前缀不参与 docId）
- 区分 untracked / staged / committed / missing 状态
- 提供修复建议
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


def run_git_command(args, encoding='utf-8'):
    """运行 git 命令，处理编码问题"""
    try:
        result = subprocess.run(
            args,
            capture_output=True,
            encoding=encoding,
            errors='replace',
            cwd=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        )
        return result.stdout, result.returncode
    except Exception as e:
        return "", 1


def get_git_tracked_files():
    """获取 git 已追踪的文件列表"""
    stdout, _ = run_git_command(['git', 'ls-files'])
    tracked = set()
    for line in stdout.splitlines():
        line = line.strip().replace('\\', '/')
        if line:
            tracked.add(line)
    return tracked


def get_git_status():
    """获取 git 状态"""
    stdout, _ = run_git_command(['git', 'status', '--porcelain'])
    untracked = set()
    staged = set()

    for line in stdout.splitlines():
        if not line:
            continue
        # 解析状态行：状态码 + 路径
        # 格式如："?? docs/file.md" 或 "A  docs/file.md"
        parts = line.split(None, 1)
        if len(parts) < 2:
            continue

        status = parts[0]
        path = parts[1].strip().replace('\\', '/')

        if status == '??':
            untracked.add(path)
        elif status in ('A', 'M'):
            staged.add(path)

    return untracked, staged


def strip_numeric_prefix(filename):
    """去除文件名开头的 NN_ 前缀（Docusaurus docId 规则）

    Docusaurus 会自动去除文件名开头的数字+下划线前缀。
    例如：01_WSL2安装与基础配置.md -> WSL2安装与基础配置
    """
    return re.sub(r'^\d+_', '', filename)


def check_file_exists(doc_id, untracked_files, staged_files, tracked_files):
    """
    检查 docId 对应的文件是否存在

    Docusaurus docId 规则：
    - docId = docs/目录/文件名（不含 .md 后缀）
    - 文件名中的 NN_ 前缀会被自动去除

    返回: 'committed' | 'staged' | 'untracked' | 'missing'
    """
    # 直接路径（不含前缀）
    direct_path = f"docs/{doc_id}.md"
    direct_path_alt = f"docs/{doc_id.replace('/', '/')}.md"

    # 1. 检查是否在 untracked 中
    if direct_path in untracked_files or direct_path_alt in untracked_files:
        return 'untracked'

    # 2. 检查是否在 staged 中
    if direct_path in staged_files or direct_path_alt in staged_files:
        return 'staged'

    # 3. 检查是否已 committed（精确匹配）
    if direct_path in tracked_files or direct_path_alt in tracked_files:
        return 'committed'

    # 4. 精确匹配失败，尝试 NN_ 前缀规则
    # 将 docId 拆分为目录和文件名
    parts = doc_id.rsplit('/', 1)
    if len(parts) != 2:
        return 'missing'

    dir_name, filename = parts
    docs_dir = Path('docs') / dir_name

    if not docs_dir.exists():
        return 'missing'

    # 在目录中查找匹配的文件（去掉数字前缀后匹配）
    expected_base = filename
    for f in docs_dir.iterdir():
        if f.is_file() and f.suffix == '.md':
            # 去掉 NN_ 前缀后比较
            base_name = strip_numeric_prefix(f.stem)  # stem 不含后缀
            if base_name == expected_base:
                # 找到了匹配的文件，检查 git 状态
                full_path = f"docs/{dir_name}/{f.name}"
                if full_path in untracked_files:
                    return 'untracked'
                elif full_path in staged_files:
                    return 'staged'
                else:
                    return 'committed'

    return 'missing'


def extract_doc_ids(sidebars_content):
    """从 sidebars.js 中提取所有 docId"""
    doc_ids = set()

    # 匹配 type: 'doc', id: 'xxx' 格式
    pattern = r"type:\s*['\"]doc['\"],\s*id:\s*['\"]([^'\"]+)['\"]"
    matches = re.findall(pattern, sidebars_content)
    for match in matches:
        doc_ids.add(match)

    # 也匹配 type: 'link', docId: 'xxx' 格式
    pattern2 = r"type:\s*['\"]link['\"],\s*docId:\s*['\"]([^'\"]+)['\"]"
    matches2 = re.findall(pattern2, sidebars_content)
    for match in matches2:
        doc_ids.add(match)

    return doc_ids


def get_fix_suggestion(doc_id, status):
    """根据文件状态生成修复建议"""
    if status == 'untracked':
        return f"请运行: git add docs/{doc_id}.md"
    elif status == 'missing':
        return f"请检查 docId 是否正确，或创建 docs/{doc_id}.md"
    elif status == 'staged':
        return f"文件已 staged，请运行: git commit"
    else:
        return f"请检查 sidebars.js 中的 docId 引用"


def main():
    # 从 stdin 读取 Claude Code 钩子输入
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError:
        # 无有效输入，跳过验证
        print("Sidebar validation skipped (invalid input)", file=sys.stderr)
        sys.exit(0)

    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    # 只在编辑 sidebars.js 时触发
    if tool_name not in ["Write", "Edit"]:
        sys.exit(0)

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
    untracked_files, staged_files = get_git_status()
    tracked_files = get_git_tracked_files()

    # 提取 docId
    doc_ids = extract_doc_ids(content)

    # 验证每个 docId
    missing = []
    untracked = []
    committed_or_staged = []

    for doc_id in doc_ids:
        status = check_file_exists(doc_id, untracked_files, staged_files, tracked_files)

        if status == 'missing':
            missing.append(doc_id)
        elif status == 'untracked':
            untracked.append(doc_id)
        else:
            committed_or_staged.append((doc_id, status))

    # 输出结果
    if missing or untracked:
        print("\n=== Sidebar Validation Errors ===\n", file=sys.stderr)

        if untracked:
            print("Untracked files (文件未提交到 git):", file=sys.stderr)
            for doc_id in untracked:
                suggestion = get_fix_suggestion(doc_id, 'untracked')
                print(f"  - {doc_id}", file=sys.stderr)
                print(f"    {suggestion}", file=sys.stderr)

        if missing:
            print("\nMissing files (文件不存在):", file=sys.stderr)
            for doc_id in missing:
                suggestion = get_fix_suggestion(doc_id, 'missing')
                print(f"  - {doc_id}", file=sys.stderr)
                print(f"    {suggestion}", file=sys.stderr)

        print("\n请修复后重新提交", file=sys.stderr)
        sys.exit(2)

    print("Sidebar validation passed", file=sys.stderr)
    sys.exit(0)


if __name__ == "__main__":
    main()
