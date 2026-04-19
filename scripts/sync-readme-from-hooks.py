#!/usr/bin/env python3
"""
Sync README.md from hooks/ and skills/ changes.
Detects changes in .claude/hooks/ and .claude/skills/ directories
and updates corresponding sections in README.md.
"""

import os
import json
import sys
import re
import hashlib
from pathlib import Path

README_PATH = 'README.md'
STATE_FILE = '.claude/.readme-sync-state.json'
HOOKS_DIR = '.claude/hooks'
SKILLS_DIR = '.claude/skills'

def get_file_hash(file_path: str) -> str:
    """Get MD5 hash of file content."""
    with open(file_path, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()

def get_directory_hashes(directory: str, extensions: list = None) -> dict:
    """Get hashes of all files in directory."""
    hashes = {}
    for root, dirs, files in os.walk(directory):
        for filename in files:
            if extensions and not any(filename.endswith(ext) for ext in extensions):
                continue
            file_path = os.path.join(root, filename)
            rel_path = os.path.relpath(file_path, directory)
            hashes[rel_path] = get_file_hash(file_path)
    return hashes

def load_state() -> dict:
    """Load previous state from file."""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    return {'hooks': {}, 'skills': {}}

def save_state(state: dict):
    """Save state to file."""
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def detect_changes(hooks_hashes: dict, skills_hashes: dict, prev_state: dict) -> tuple:
    """Detect which files changed since last sync."""
    hooks_changed = []
    skills_changed = []

    for file, hash_val in hooks_hashes.items():
        if file not in prev_state.get('hooks', {}) or prev_state['hooks'][file] != hash_val:
            hooks_changed.append(file)

    for file, hash_val in skills_hashes.items():
        if file not in prev_state.get('skills', {}) or prev_state['skills'][file] != hash_val:
            skills_changed.append(file)

    return hooks_changed, skills_changed

def get_hooks_info() -> list:
    """Get information about all hooks."""
    hooks_info = []
    hooks_path = Path(HOOKS_DIR)

    if not hooks_path.exists():
        return hooks_info

    for hook_file in sorted(hooks_path.glob('*.py')):
        if hook_file.name == '__pycache__':
            continue
        # Get trigger info from hook file
        triggers = []
        if 'lint-md' in hook_file.name:
            triggers = ['Write/Edit .md']
        elif 'sidebar-validate' in hook_file.name:
            triggers = ['Write/Edit sidebars.js']
        elif 'write-counter' in hook_file.name:
            triggers = ['Write/Edit docs/*, sidebars.js, .claude/*']
        elif 'issue-tracker' in hook_file.name:
            triggers = ['CI build failure']
        elif 'build-success-tracker' in hook_file.name:
            triggers = ['Build success']

        hooks_info.append({
            'name': hook_file.stem,
            'triggers': triggers if triggers else ['Unknown']
        })

    return hooks_info

def get_skills_info() -> list:
    """Get information about all skills."""
    skills_info = []
    skills_path = Path(SKILLS_DIR)

    if not skills_path.exists():
        return skills_info

    for skill_dir in sorted(skills_path.iterdir()):
        if not skill_dir.is_dir():
            continue
        skill_md = skill_dir / 'SKILL.md'
        if skill_md.exists():
            # Parse SKILL.md for description
            with open(skill_md, 'r', encoding='utf-8') as f:
                content = f.read()
                # Get first line after # for brief description
                lines = content.split('\n')
                desc = '功能说明见 SKILL.md'
                for line in lines[1:5]:  # Check first few lines
                    if line.strip() and not line.startswith('#'):
                        desc = line.strip()[:50]
                        break
            skills_info.append({
                'name': skill_dir.name,
                'description': desc
            })

    return skills_info

def update_readme_hooks_section(hooks_info: list) -> str:
    """Generate updated hooks table section."""
    lines = ['## Hooks', '', '| Hook | 触发 | 功能 |', '|------|------|------|']

    for hook in hooks_info:
        triggers = ', '.join(hook['triggers'])
        lines.append(f'| `{hook["name"]}` | {triggers} | ... |')

    return '\n'.join(lines) + '\n'

def update_readme_skills_section(skills_info: list) -> str:
    """Generate updated skills table section."""
    lines = ['## 项目技能', '', '| Skill | 命令 | 功能 |', '|-------|------|------|']

    for skill in skills_info:
        lines.append(f'| `{skill["name"]}` | `/{skill["name"]}` | {skill["description"]} |')

    return '\n'.join(lines) + '\n'

def sync_readme(hooks_changed: list, skills_changed: list, dry_run: bool = False) -> bool:
    """Sync README.md with hooks and skills changes."""
    if not hooks_changed and not skills_changed:
        print("No changes detected in hooks/ or skills/.")
        return True

    print(f"Changes detected:")
    if hooks_changed:
        print(f"  Hooks: {', '.join(hooks_changed)}")
    if skills_changed:
        print(f"  Skills: {', '.join(skills_changed)}")

    if dry_run:
        print("\nDry run - no changes written.")
        return True

    # Get updated info
    hooks_info = get_hooks_info()
    skills_info = get_skills_info()

    # Read current README
    with open(README_PATH, 'r', encoding='utf-8') as f:
        readme_content = f.read()

    # Update hooks section
    new_hooks_section = update_readme_hooks_section(hooks_info)
    # Find and replace hooks section
    hooks_pattern = r'## Hooks\n\n\|[^\n]*\|[^\n]*\|[^\n]*\|\n((?:\|[^\n]*\|\n)*)'
    match = re.search(hooks_pattern, readme_content)
    if match:
        old_section = match.group(0)
        readme_content = readme_content.replace(old_section, new_hooks_section + '\n')

    # Update skills section
    new_skills_section = update_readme_skills_section(skills_info)
    skills_pattern = r'## 项目技能\n\n\|[^\n]*\|[^\n]*\|[^\n]*\|\n((?:\|[^\n]*\|\n)*)'
    match = re.search(skills_pattern, readme_content)
    if match:
        old_section = match.group(0)
        readme_content = readme_content.replace(old_section, new_skills_section + '\n')

    # Write updated README
    with open(README_PATH, 'w', encoding='utf-8') as f:
        f.write(readme_content)

    print(f"\nREADME.md has been updated.")
    return True

def main():
    dry_run = '--dry-run' in sys.argv

    if dry_run:
        print("Mode: DRY RUN\n")

    # Get current state
    hooks_hashes = get_directory_hashes(HOOKS_DIR, ['.py'])
    skills_hashes = get_directory_hashes(SKILLS_DIR, ['.md'])
    prev_state = load_state()

    # Detect changes
    hooks_changed, skills_changed = detect_changes(hooks_hashes, skills_hashes, prev_state)

    # Sync README
    success = sync_readme(hooks_changed, skills_changed, dry_run)

    if success and not dry_run:
        # Save new state
        new_state = {
            'hooks': hooks_hashes,
            'skills': skills_hashes
        }
        save_state(new_state)

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
