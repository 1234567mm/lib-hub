#!/usr/bin/env python3
"""
Write Counter Hook
计数 docs/ 目录下文件写入次数，以及 sidebars.js 的修改
达到阈值时触发知识蒸馏。
"""

import json
import sys
import os
from pathlib import Path

COUNTER_FILE = ".claude/memory/.write_counter"
MEMORY_DIR = Path(".claude/memory")
DISTILL_THRESHOLD = 10


def read_counter():
    """读取当前计数器值"""
    counter_path = Path(COUNTER_FILE)
    if counter_path.exists():
        try:
            return int(counter_path.read_text().strip())
        except:
            return 0
    return 0


def write_counter(value):
    """写入计数器值"""
    Path(COUNTER_FILE).parent.mkdir(parents=True, exist_ok=True)
    Path(COUNTER_FILE).write_text(str(value))


def distill_knowledge():
    """知识蒸馏：去重合并规则和问题记录"""
    memory_files = list(Path(MEMORY_DIR).glob("*-rules.md"))
    # 也包含 issue-troubleshooting.md
    issue_file = Path(MEMORY_DIR) / "issue-troubleshooting.md"
    if issue_file.exists():
        memory_files.append(issue_file)

    if not memory_files:
        return

    # 收集所有规则
    all_rules = {}
    for f in memory_files:
        content = f.read_text(encoding='utf-8')
        lines = content.split('\n')
        for line in lines:
            if line.startswith('## ') or line.startswith('# '):
                title = line.lstrip('# ')
                if title not in all_rules:
                    all_rules[title] = []
                all_rules[title].append(f.name)

    # 更新 MEMORY.md
    memory_index = Path(MEMORY_DIR) / "MEMORY.md"
    rules_list = []
    for f in memory_files:
        rules_list.append(f"- `{f.name}`")

    # 去重
    seen = set()
    unique_rules = []
    for r in rules_list:
        if r not in seen:
            seen.add(r)
            unique_rules.append(r)

    # 读取并更新索引
    counter = read_counter()
    if memory_index.exists():
        last_distill = memory_index.read_text(encoding='utf-8')
        if 'last-distill' in last_distill:
            last_distill = last_distill.replace(
                f"`write-count`: {read_counter() - DISTILL_THRESHOLD}",
                f"`write-count`: {counter}"
            )
        else:
            last_distill = last_distill.replace(
                "- `last-distill`: -",
                f"- `last-distill`: {len(unique_rules)} rules"
            )
        memory_index.write_text(last_distill, encoding='utf-8')

    # 对 issue-troubleshooting.md 进行去重
    if issue_file.exists():
        distill_issue_file(issue_file)

    print(f"Knowledge distilled: {len(unique_rules)} rules", file=sys.stderr)


def distill_issue_file(issue_file):
    """对 issue-troubleshooting.md 进行去重"""
    content = issue_file.read_text(encoding='utf-8')

    # 提取现有记录
    import re
    entries = []
    current_entry = []

    for line in content.split('\n'):
        if line.startswith('### '):
            if current_entry:
                entries.append('\n'.join(current_entry))
            current_entry = [line]
        else:
            current_entry.append(line)

    if current_entry:
        entries.append('\n'.join(current_entry))

    # 去重（按日期+问题类型）
    seen = set()
    unique_entries = []
    for entry in entries:
        match = re.match(r'### (\d{4}-\d{2}-\d{2}): (.+)', entry)
        if match:
            key = f"{match.group(1)}:{match.group(2)}"
            if key not in seen:
                seen.add(key)
                unique_entries.append(entry)
        else:
            # 保留索引和统计部分
            unique_entries.append(entry)

    # 重建文件
    issue_count = len([e for e in unique_entries if re.match(r'### \d{4}-\d{2}-\d{2}:', e)])

    header_end = content.find('## 详细记录')
    if header_end > 0:
        header = content[:header_end]
    else:
        header = content

    new_content = header + '## 详细记录\n\n' + '\n\n---\n\n'.join(unique_entries)

    # 更新计数
    new_content = re.sub(
        r'`issue-count`: \d+',
        f'`issue-count`: {issue_count}',
        new_content
    )
    from datetime import datetime
    new_content = re.sub(
        r'`last-update`: \d{4}-\d{2}-\d{2}',
        f'`last-update`: {datetime.now().strftime("%Y-%m-%d")}',
        new_content
    )

    issue_file.write_text(new_content, encoding='utf-8')


def main():
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    tool_name = data.get("tool_name", "")
    if tool_name not in ["Write", "Edit"]:
        sys.exit(0)

    tool_input = data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    # 监听范围：
    # 1. docs/ 目录下的 .md 文件
    # 2. sidebars.js
    # 3. .claude/hooks/ 下的文件
    # 4. .claude/memory/ 下的文件

    should_count = False
    if file_path.startswith("docs/") and file_path.endswith(".md"):
        should_count = True
    elif file_path == "sidebars.js":
        should_count = True
    elif file_path.startswith(".claude/hooks/") and file_path.endswith(".py"):
        should_count = True
    elif file_path.startswith(".claude/memory/") and file_path.endswith(".md"):
        should_count = True

    if not should_count:
        sys.exit(0)

    # 增加计数器
    counter = read_counter() + 1
    write_counter(counter)

    # 检查是否达到蒸馏阈值
    if counter >= DISTILL_THRESHOLD:
        distill_knowledge()
        write_counter(0)

    sys.exit(0)


if __name__ == "__main__":
    main()
