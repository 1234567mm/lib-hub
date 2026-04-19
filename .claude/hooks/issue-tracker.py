#!/usr/bin/env python3
"""
Issue Tracker Hook
在 CI 构建失败后，解析错误日志并记录到 issue-troubleshooting.md
"""

import json
import sys
import os
import re
from pathlib import Path
from datetime import datetime

# 共享计数器文件（与 write-counter.py 共用）
COUNTER_FILE = ".claude/memory/.write_counter"
MEMORY_DIR = Path(".claude/memory")
ISSUE_FILE = MEMORY_DIR / "issue-troubleshooting.md"
DISTILL_THRESHOLD = 10


def get_git_status():
    """获取 git untracked 文件列表"""
    try:
        import subprocess
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True,
            text=True,
            errors='replace'
        )
        untracked = []
        for line in result.stdout.splitlines():
            if line.startswith("?? "):
                path = line[3:].strip()
                untracked.append(path)
        return untracked
    except Exception:
        return []


def check_file_status(doc_id):
    """
    检查 docId 对应的文件状态
    返回: 'committed' | 'staged' | 'untracked' | 'missing'
    """
    # 转换 docId 为文件路径
    path = doc_id.replace('\\', '/')
    file_path = Path(f"docs/{path}.md")

    if not file_path.exists():
        # 检查是否是 untracked 文件
        untracked = get_git_status()
        for f in untracked:
            f_clean = f.replace('\\', '/')
            if f_clean.endswith(f"{path}.md") or f_clean == f"docs/{path}.md":
                return 'untracked'
        return 'missing'

    # 文件存在，检查 git 状态
    try:
        import subprocess
        result = subprocess.run(
            ["git", "ls-files", "--error-unmatch", str(file_path)],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            return 'committed'
        else:
            return 'untracked'
    except Exception:
        return 'unknown'


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
    COUNTER_FILE_path = Path(COUNTER_FILE)
    COUNTER_FILE_path.parent.mkdir(parents=True, exist_ok=True)
    COUNTER_FILE_path.write_text(str(value))


def distill_knowledge():
    """知识蒸馏：去重合并问题记录"""
    if not ISSUE_FILE.exists():
        return

    content = ISSUE_FILE.read_text(encoding='utf-8')

    # 提取现有记录
    entries = []
    current_entry = []
    in_entry = False

    for line in content.split('\n'):
        if line.startswith('### '):
            if current_entry:
                entries.append('\n'.join(current_entry))
            current_entry = [line]
            in_entry = True
        elif in_entry:
            current_entry.append(line)

    if current_entry:
        entries.append('\n'.join(current_entry))

    # 去重（简单按日期+问题类型去重）
    seen = set()
    unique_entries = []
    for entry in entries:
        # 提取日期和问题类型作为 key
        match = re.match(r'### (\d{4}-\d{2}-\d{2}): (.+)', entry)
        if match:
            key = f"{match.group(1)}:{match.group(2)}"
            if key not in seen:
                seen.add(key)
                unique_entries.append(entry)
        else:
            unique_entries.append(entry)

    # 更新 issue-count
    issue_count = len([e for e in unique_entries if re.match(r'### \d{4}-\d{2}-\d{2}:', e)])

    # 重建文件（保留索引和统计）
    header = content.split('## 详细记录')[0] if '## 详细记录' in content else ''

    new_content = f"""{header}## 详细记录

"""
    new_content += '\n\n---\n\n'.join(unique_entries)

    # 更新统计
    new_content = re.sub(
        r'`issue-count`: \d+',
        f'`issue-count`: {issue_count}',
        new_content
    )
    new_content = re.sub(
        r'`last-update`: \d{4}-\d{2}-\d{2}',
        f'`last-update`: {datetime.now().strftime("%Y-%m-%d")}',
        new_content
    )

    ISSUE_FILE.write_text(new_content, encoding='utf-8')
    print(f"Knowledge distilled: {issue_count} issues", file=sys.stderr)


def parse_build_log(log_text):
    """
    解析构建日志，提取 Docusaurus 错误信息
    返回: list of {doc_id, error_type, suggestion}
    """
    errors = []

    # 匹配 "These sidebar document ids do not exist:"
    if "sidebar document ids do not exist" in log_text:
        # 提取缺失的 docId 列表
        pattern = r'-\s+([^\s]+)\s*$'
        matches = re.findall(pattern, log_text, re.MULTILINE)

        for doc_id in matches:
            file_status = check_file_status(doc_id)
            error = {
                'doc_id': doc_id,
                'error_type': 'sidebar_doc_missing',
                'file_status': file_status,
                'suggestion': get_fix_suggestion(doc_id, file_status)
            }
            errors.append(error)

    return errors


def get_fix_suggestion(doc_id, file_status):
    """根据文件状态生成修复建议"""
    if file_status == 'untracked':
        path = doc_id.replace('\\', '/')
        return f"文件未提交。请运行: git add docs/{path}.md"
    elif file_status == 'missing':
        return f"文件不存在。请检查 docId 是否正确，或创建对应文件。"
    elif file_status == 'committed':
        return f"文件已提交但 docId 可能错误。请检查 sidebars.js 中的引用。"
    else:
        return f"请检查文件状态。"


def record_issue(errors):
    """将问题记录追加到 issue-troubleshooting.md"""
    if not errors:
        return

    date = datetime.now().strftime("%Y-%m-%d")

    # 构建新的问题记录
    new_entry = f"""### {date}: CI 构建失败 - Sidebar docId 错误

**问题类型**：Docusaurus 构建错误

**错误详情**：
"""
    for err in errors:
        new_entry += f"- `{err['doc_id']}` - {err['file_status']} - {err['suggestion']}\n"

    new_entry += """
**根因分析**：
1. 文件已创建但未提交到仓库
2. 或 docId 与实际文件路径不匹配

**预防措施**：
- 新建文档后立即 `git add` + `commit`
- 使用 `npm run start` 本地预览验证后再 push
- 修改 sidebars.js 后运行 `npm run build` 验证
"""

    # 追加到文件
    if ISSUE_FILE.exists():
        content = ISSUE_FILE.read_text(encoding='utf-8')

        # 在 "## 详细记录" 部分后插入
        if '## 详细记录' in content:
            parts = content.split('## 详细记录')
            content = parts[0] + '## 详细记录\n\n' + new_entry + '\n\n---\n\n' + parts[1]
        else:
            content += '\n\n---\n\n' + new_entry

        # 更新计数
        content = re.sub(
            r'`issue-count`: \d+',
            lambda m: f'`issue-count`: {int(m.group().split(": ")[1]) + 1}',
            content
        )
        content = re.sub(
            r'`last-update`: \d{4}-\d{2}-\d{2}',
            f'`last-update`: {date}',
            content
        )

        ISSUE_FILE.write_text(content, encoding='utf-8')
    else:
        # 创建新文件
        ISSUE_FILE.write_text(f"""# 问题修复记录

## 索引

| 日期 | 问题类型 | 现象 | 修复方法 | 相关文件 |
|------|----------|------|----------|----------|
| {date} | CI 构建失败 | sidebars docId 错误 | 见详情 | sidebars.js |

## 统计

- `issue-count`: 1
- `last-update`: {date}

---

## 详细记录

{new_entry}
""", encoding='utf-8')

    print(f"Recorded {len(errors)} issue(s) to {ISSUE_FILE}", file=sys.stderr)


def main():
    # 支持两种模式：
    # 1. 从命令行参数读取错误信息
    # 2. 从环境变量读取 CI 日志路径

    if len(sys.argv) > 1:
        # 模式1: 直接记录
        error_info = ' '.join(sys.argv[1:])
        errors = [{
            'doc_id': error_info,
            'error_type': 'manual',
            'file_status': 'unknown',
            'suggestion': '请手动检查'
        }]
        record_issue(errors)
        return

    # 模式2: 从 stdin 读取 JSON
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError:
        # 如果不是 JSON，尝试从环境变量或文件读取
        log_path = os.environ.get('CI_LOG_FILE')
        if log_path and Path(log_path).exists():
            log_text = Path(log_path).read_text(encoding='utf-8', errors='replace')
            errors = parse_build_log(log_text)
            if errors:
                record_issue(errors)
                # 增加计数器
                counter = read_counter() + 1
                write_counter(counter)
                if counter >= DISTILL_THRESHOLD:
                    distill_knowledge()
                    write_counter(0)
        return

    tool_name = data.get("tool_name", "")

    # 只在 CI 构建失败后调用（通常通过 CI 配置触发）
    # 这里只做简单记录
    print("Issue tracker ready", file=sys.stderr)
    sys.exit(0)


if __name__ == "__main__":
    main()
