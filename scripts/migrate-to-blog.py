#!/usr/bin/env python3
"""
Batch migrate docs/ articles to blog/ with proper frontmatter.

Usage:
  python scripts/migrate-to-blog.py [--dry-run]
"""
import os
import sys
import re
from pathlib import Path
from datetime import datetime, timedelta

DOCS_DIR = Path('docs')
BLOG_DIR = Path('blog')
AUTHORS = 'yamahoney'

# Directory → tag mapping
DIR_TAG_MAP = {
    'stm32': ['stm32'],
    'esp32': ['esp32'],
    'sharing': ['干货分享'],
    '开发工具': ['开发工具'],
}

# Directory → type tag
DIR_TYPE_MAP = {
    'stm32/入门教程': ['入门教程'],
    'stm32/stm32-basics': ['入门教程'],
    'stm32/stm32-peripherals': ['进阶'],
    'stm32/stm32-projects': ['项目实战'],
    'esp32': ['项目实战'],
    'sharing': ['干货分享'],
}

# Files to SKIP (intro pages, indexes)
SKIP_PATTERNS = [
    r'intro\.md$',
    r'introduction\.md$',
]

def extract_title(filepath):
    """Extract title from frontmatter or first # heading."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Try frontmatter title
    fm_match = re.search(r'^---\s*\ntitle:\s*(.+?)\s*\n---', content, re.DOTALL)
    if fm_match:
        return fm_match.group(1).strip().strip('"').strip("'")
    
    # Try # heading
    h1_match = re.search(r'^#\s+(.+?)$', content, re.MULTILINE)
    if h1_match:
        return h1_match.group(1).strip()
    
    return filepath.stem

def extract_frontmatter(filepath):
    """Extract full frontmatter block."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    fm_match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if fm_match:
        return fm_match.group(1)
    return ''

def extract_body(filepath):
    """Extract body (everything after frontmatter)."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove frontmatter
    body = re.sub(r'^---\s*\n.*?\n---\s*\n', '', content, flags=re.DOTALL)
    # Remove leading # heading if it matches title (will be in frontmatter)
    body = re.sub(r'^#\s+.+?\n', '', body)
    return body.strip()

def get_tags(rel_path):
    """Determine tags based on directory path."""
    tags = []
    path_str = str(rel_path).replace('\\', '/')
    
    # Check each mapping
    for dir_key, dir_tags in DIR_TAG_MAP.items():
        if path_str.startswith(dir_key + '/'):
            tags.extend(dir_tags)
            break
    
    for dir_key, type_tags in DIR_TYPE_MAP.items():
        if path_str.startswith(dir_key + '/'):
            tags.extend(type_tags)
            break
    
    return tags if tags else ['技术']

def should_skip(filepath):
    """Check if file should be skipped."""
    for pattern in SKIP_PATTERNS:
        if re.search(pattern, str(filepath.name)):
            return True
    return False

def get_date(filepath):
    """Get date from git or use a reasonable default."""
    # Use file modification time as fallback
    mtime = os.path.getmtime(filepath)
    return datetime.fromtimestamp(mtime).strftime('%Y-%m-%d')

def get_slug(filepath):
    """Generate a URL-friendly slug."""
    # Remove common prefixes like numbers, 笔记X-
    name = filepath.stem
    name = re.sub(r'^\d+[\.\-_]\s*', '', name)
    name = re.sub(r'^笔记[一二三四五六七八九十]+[\.\-\s]*工程?\d*[\.\-\s]*', '', name)
    # Replace Chinese punctuation with hyphens
    name = name.replace('（', '-').replace('）', '-').replace('：', '-')
    name = name.replace('，', '-').replace('。', '-').replace('、', '-')
    # Collapse hyphens
    name = re.sub(r'-+', '-', name).strip('-')
    return name

def migrate_file(src_path, rel_path, dry_run=False):
    """Migrate a single file from docs/ to blog/."""
    if should_skip(src_path):
        return None
    
    title = extract_title(src_path)
    date = get_date(src_path)
    slug = get_slug(src_path)
    tags = get_tags(rel_path)
    body = extract_body(src_path)
    description = body[:150].replace('\n', ' ').strip() if body else title
    
    # Replace docs/ internal links to work in blog context
    # e.g., [text](path) → needs adjustment for blog context
    # Skip complex link rewriting for now
    
    frontmatter = f"""---
title: "{title}"
description: "{description}..."
authors: {AUTHORS}
tags: [{', '.join(tags)}]
date: {date}
---

"""
    content = frontmatter + body
    
    blog_filename = f"{date}-{slug}.md"
    dest_path = BLOG_DIR / blog_filename
    
    if dry_run:
        print(f"  [DRY RUN] {src_path} → {dest_path}")
        print(f"    tags: {tags}")
        return dest_path
    
    os.makedirs(dest_path.parent, exist_ok=True)
    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  [OK] {src_path} -> {dest_path}")
    return dest_path

def main():
    dry_run = '--dry-run' in sys.argv
    
    if dry_run:
        print("=== DRY RUN MODE ===\n")
    
    docs_dir = DOCS_DIR
    if not docs_dir.exists():
        print("Error: docs/ directory not found!")
        sys.exit(1)
    
    os.makedirs(BLOG_DIR, exist_ok=True)
    
    migrated = 0
    skipped = 0
    
    for md_file in sorted(docs_dir.rglob('*.md')):
        rel_path = md_file.relative_to(docs_dir)
        
        if should_skip(md_file):
            print(f"  - SKIP: {rel_path}")
            skipped += 1
            continue
        
        result = migrate_file(md_file, rel_path, dry_run)
        if result:
            migrated += 1
    
    print(f"\n{'='*50}")
    if dry_run:
        print(f"DRY RUN: Would migrate {migrated} files, skip {skipped} files")
    else:
        print(f"Migrated: {migrated} files, Skipped: {skipped} files")
    print(f"Destination: {BLOG_DIR.absolute()}")

if __name__ == '__main__':
    main()
