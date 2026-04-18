#!/usr/bin/env python3
"""
Sidebar Validate Hook
验证 sidebars.js 中的 docId 是否对应实际存在的文件。
"""

import json
import sys
import re
from pathlib import Path

def extract_doc_ids(sidebars_content):
    """从 sidebars.js 中提取所有 docId"""
    doc_ids = set()
    # 匹配单引号或双引号包裹的 docId
    pattern = r'[\'"]([^\'"]+)[\'"]'
    matches = re.findall(pattern, sidebars_content)
    for match in matches:
        if '/' in match or '\\' in match:  # 看起来像路径
            doc_ids.add(match)
    return doc_ids

def doc_id_to_file_path(doc_id):
    """将 docId 转换为可能的文件路径"""
    # 处理反斜杠
    path = doc_id.replace('\\', '/')
    # 尝试添加 .md 后缀
    return f"docs/{path}.md"

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

    # 提取 docId
    doc_ids = extract_doc_ids(content)

    # 验证每个 docId 是否有对应的文件
    missing = []
    for doc_id in doc_ids:
        file_path_candidate = doc_id_to_file_path(doc_id)
        if not Path(file_path_candidate).exists():
            missing.append((doc_id, file_path_candidate))

    if missing:
        print("Sidebar validation errors:", file=sys.stderr)
        for doc_id, path in missing:
            print(f"  - {doc_id} -> {path} (NOT FOUND)", file=sys.stderr)
        # 阻塞操作
        sys.exit(2)

    print("Sidebar validation passed", file=sys.stderr)
    sys.exit(0)

if __name__ == "__main__":
    main()
