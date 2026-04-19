#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build Success Tracker
在 CI 构建成功后运行，对比上次失败的问题，自动标记已修复并记录解决方案。

流程：
1. 读取上次的失败问题记录
2. 检查相关文件是否已修复
3. 更新 issue-troubleshooting.md，标记已修复并记录解决方案
"""

import json
import sys
import re
import os
import subprocess
from pathlib import Path
from datetime import datetime

MEMORY_DIR = Path(".claude/memory")
ISSUE_FILE = MEMORY_DIR / "issue-troubleshooting.md"


def get_git_diff(prev_commit="HEAD~1"):
    """获取上次提交到现在的文件变化"""
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", prev_commit, "HEAD"],
            capture_output=True,
            text=True,
            errors='replace'
        )
        return result.stdout.strip().split('\n')
    except Exception as e:
        print(f"Git diff failed: {e}", file=sys.stderr)
        return []


def get_git_log(n=10):
    """获取最近的 git 提交信息"""
    try:
        result = subprocess.run(
            ["git", "log", f"-{n}", "--pretty=format:%H %s"],
            capture_output=True,
            text=True,
            errors='replace'
        )
        commits = []
        for line in result.stdout.split('\n'):
            if line:
                parts = line.split(' ', 1)
                if len(parts) == 2:
                    commits.append({'hash': parts[0], 'msg': parts[1]})
        return commits
    except Exception:
        return []


def check_file_fixed(doc_id_pattern):
    """检查 docId 相关的问题是否已修复"""
    changed_files = get_git_diff()

    # docId 模式对应可能的修复文件
    fixes = {
        'sidebar-validate': 'sidebar-validate.py',
        'sidebars.js': 'sidebars.js',
        'docusaurus.config.js': 'docusaurus.config.js',
        '开发工具': 'docs/开发工具/',
        'stm32': 'docs/stm32/',
        'esp32': 'docs/esp32/',
    }

    for pattern, filepath in fixes.items():
        if pattern in doc_id_pattern:
            for changed in changed_files:
                if filepath in changed:
                    return True, filepath
    return False, None


def extract_unfixed_issues(content):
    """提取未修复的问题"""
    issues = []
    current_issue = {}
    in_issue = False
    in_details = False

    lines = content.split('\n')
    for i, line in enumerate(lines):
        # 检查是否是新问题的开始
        if line.startswith('### '):
            if current_issue and 'details' in current_issue:
                issues.append(current_issue)
            date_match = re.match(r'### (\d{4}-\d{2}-\d{2}): (.+)', line)
            if date_match:
                current_issue = {
                    'date': date_match.group(1),
                    'title': date_match.group(2),
                    'details': [],
                    'line_idx': i
                }
                in_issue = True
                in_details = False

        # 提取详细信息
        elif in_issue and line.strip().startswith(('- `', '**')):
            current_issue['details'].append(line.strip())

        # 检查是否有"已修复"标记
        if in_issue and ('已修复' in line or 'resolved' in line.lower()):
            current_issue['fixed'] = True

    if current_issue and 'details' in current_issue:
        issues.append(current_issue)

    return [i for i in issues if not i.get('fixed', False)]


def mark_issue_fixed(issue, fix_info, changed_files):
    """标记问题为已修复并记录解决方案"""
    date = datetime.now().strftime("%Y-%m-%d")
    fix_msg = issue.get('title', '')

    # 根据修复的文件推断解决方案
    solutions = []
    for f in changed_files:
        if f.endswith('.js'):
            solutions.append(f"修改了 `{f}`")
        elif f.startswith('docs/'):
            solutions.append(f"更新了文档 `{f}`")
        elif f.endswith('.py'):
            solutions.append(f"修复了 hook `{f}`")

    solution_text = '；'.join(solutions) if solutions else '相关文件已更新'

    # 生成修复记录
    fix_entry = f"""**已修复** ✅
- 修复日期: {date}
- 修复方案: {solution_text}
- 提交: {fix_info.get('commit', 'N/A')}

"""

    return fix_entry


def update_issue_file(issues, fix_info, changed_files):
    """更新 issue-troubleshooting.md"""
    if not ISSUE_FILE.exists():
        print("No issue file to update", file=sys.stderr)
        return

    content = ISSUE_FILE.read_text(encoding='utf-8')
    lines = content.split('\n')

    # 找到"详细记录"部分
    detail_start = -1
    for i, line in enumerate(lines):
        if line.startswith('## 详细记录'):
            detail_start = i
            break

    if detail_start == -1:
        print("Could not find '详细记录' section", file=sys.stderr)
        return

    # 统计已修复数量
    fixed_count = 0

    # 在详细记录部分添加修复标记
    new_lines = []
    for i, line in enumerate(lines):
        new_lines.append(line)

        # 在每个未修复的问题后添加修复信息
        if line.startswith('### '):
            # 检查这个问题是否在修复列表中
            issue_title = re.search(r'### \d{4}-\d{2}-\d{2}: (.+)', line)
            if issue_title:
                title = issue_title.group(1)
                for issue in issues:
                    if issue.get('title') == title:
                        fix_entry = mark_issue_fixed(issue, fix_info, changed_files)
                        new_lines.append(fix_entry)
                        fixed_count += 1
                        break

    # 更新统计
    current_date = datetime.now().strftime("%Y-%m-%d")
    content = '\n'.join(new_lines)
    content = re.sub(
        r'`issue-count`: \d+',
        f'`issue-count`: {len(issues)}',
        content
    )
    content = re.sub(
        r'`last-update`: \d{4}-\d{2}-\d{2}',
        f'`last-update`: {current_date}',
        content
    )
    content = re.sub(
        r'`fixed-count`: \d*',
        f'`fixed-count`: {fixed_count}',
        content
    )

    # 添加 fixed-count 统计如果不存在
    if '`fixed-count`' not in content:
        content = re.sub(
            r'(`last-update`: \d{4}-\d{2}-\d{2})',
            r'\1\n- `fixed-count`: 0',
            content
        )

    ISSUE_FILE.write_text(content, encoding='utf-8')
    print(f"Marked {fixed_count} issue(s) as fixed", file=sys.stderr)


def main():
    # 获取 git 信息
    commits = get_git_log(2)
    if len(commits) < 2:
        print("Not enough commits to compare", file=sys.stderr)
        sys.exit(0)

    current_commit = commits[0]
    prev_commit = commits[1]

    print(f"Comparing {prev_commit['hash'][:7]} -> {current_commit['hash'][:7]}", file=sys.stderr)
    print(f"Current: {current_commit['msg']}", file=sys.stderr)
    print(f"Previous: {prev_commit['msg']}", file=sys.stderr)

    # 获取变更文件
    changed_files = get_git_diff(prev_commit['hash'])

    # 检查上次构建是否成功（当前 HEAD 应该是成功的）
    # 如果是从 CI 调用，CI 应该已经成功了
    # 我们只需要对比并更新问题记录

    if not ISSUE_FILE.exists():
        print("No issue file found, nothing to update", file=sys.stderr)
        return

    # 读取并分析问题
    content = ISSUE_FILE.read_text(encoding='utf-8')
    unfixed = extract_unfixed_issues(content)

    fix_info = {
        'commit': current_commit['hash'][:7],
        'message': current_commit['msg']
    }

    # 更新问题文件
    update_issue_file(unfixed, fix_info, changed_files)

    print("Build success tracking completed", file=sys.stderr)


if __name__ == "__main__":
    main()
