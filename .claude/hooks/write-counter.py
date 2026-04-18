#!/usr/bin/env python3
"""
Write Counter Hook
计数 docs/ 目录下文件写入次数，达到阈值时触发知识蒸馏。
"""

import json
import sys
import os
from pathlib import Path

COUNTER_FILE = ".claude/memory/.write_counter"
MEMORY_DIR = ".claude/memory"
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
    """知识蒸馏：去重合并规则"""
    memory_files = list(Path(MEMORY_DIR).glob("*-rules.md"))
    if not memory_files:
        return

    # 收集所有规则
    all_rules = {}
    for f in memory_files:
        content = f.read_text(encoding='utf-8')
        # 提取标题和关键规则
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

    # 写入索引
    counter = read_counter()
    last_distill = memory_index.read_text(encoding='utf-8')
    if 'last-distill' in last_distill:
        # 更新现有行
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

    print(f"Knowledge distilled: {len(unique_rules)} rules", file=sys.stderr)

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

    # 只计算 docs/ 目录下的文件
    if not file_path.startswith("docs/") or not file_path.endswith(".md"):
        sys.exit(0)

    # 增加计数器
    counter = read_counter() + 1
    write_counter(counter)

    # 检查是否达到蒸馏阈值
    if counter >= DISTILL_THRESHOLD:
        distill_knowledge()
        write_counter(0)  # 重置计数器

    sys.exit(0)

if __name__ == "__main__":
    main()
