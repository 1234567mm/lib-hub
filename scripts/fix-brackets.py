#!/usr/bin/env python3
"""
Fix brackets in markdown filenames.
Converts half-width parentheses () to full-width （）.
All files should use full-width brackets for consistency.
"""

import os
import sys
import shutil
from pathlib import Path

def has_half_brackets(filename: str) -> bool:
    """Check if filename contains half-width parentheses."""
    return '(' in filename or ')' in filename

def fix_brackets(filename: str) -> str:
    """Convert half-width parentheses to full-width."""
    result = filename.replace('(', '（').replace(')', '）')
    return result

def scan_and_fix(directory: str, dry_run: bool = False) -> list:
    """Scan directory for .md files with mixed brackets and fix them."""
    fixes = []
    directory = Path(directory)

    for root, dirs, files in os.walk(directory):
        for filename in files:
            if not filename.endswith('.md'):
                continue

            if has_half_brackets(filename):
                fixed_name = fix_brackets(filename)
                original_path = Path(root) / filename
                fixed_path = Path(root) / fixed_name

                if dry_run:
                    fixes.append({
                        'action': 'would rename',
                        'original': str(original_path),
                        'fixed': str(fixed_path)
                    })
                else:
                    try:
                        shutil.move(str(original_path), str(fixed_path))
                        fixes.append({
                            'action': 'renamed',
                            'original': str(original_path),
                            'fixed': str(fixed_path)
                        })
                    except Exception as e:
                        fixes.append({
                            'action': 'error',
                            'original': str(original_path),
                            'error': str(e)
                        })

    return fixes

def main():
    dry_run = '--dry-run' in sys.argv

    # Default to docs/ directory
    target_dir = 'docs/'
    for arg in sys.argv[1:]:
        if not arg.startswith('--'):
            target_dir = arg

    if not os.path.exists(target_dir):
        print(f"Error: Directory '{target_dir}' does not exist")
        sys.exit(1)

    print(f"Scanning: {target_dir}")
    if dry_run:
        print("Mode: DRY RUN (no changes will be made)")

    fixes = scan_and_fix(target_dir, dry_run)

    if not fixes:
        print("No mixed brackets found.")
        return

    print(f"\nFound {len(fixes)} file(s) with mixed brackets:")
    for fix in fixes:
        if fix['action'] == 'error':
            print(f"  ✗ {fix['original']}")
            print(f"    Error: {fix['error']}")
        else:
            print(f"  → {fix['original']}")
            print(f"    {fix['action']}: {fix['fixed']}")

    if dry_run:
        print("\nRun without --dry-run to apply fixes.")

if __name__ == "__main__":
    main()
