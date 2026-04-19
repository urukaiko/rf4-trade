"""
Project Tree Generator
======================
Generates a clean file tree for AI context / documentation.
Excludes noise directories and generated artifacts.
"""

import os

# ── Configuration ──────────────────────────────────────────────

EXCLUDE_DIRS = {
    '.git',
    '.qwen',
    '.svelte-kit',
    'build',
    'node_modules',
}

EXCLUDE_FILES = {
    'bun.lock',
    'tree.py',
    'project-tree.txt',
}

OUTPUT_FILE = 'project-tree.txt'

# ── Tree Generation ────────────────────────────────────────────

def build_tree(root='.', prefix=''):
    """Recursively build a visual tree structure."""
    entries = []
    
    try:
        items = sorted(os.listdir(root))
    except PermissionError:
        return entries
    
    dirs = [i for i in items if os.path.isdir(os.path.join(root, i))]
    files = [i for i in items if os.path.isfile(os.path.join(root, i))]
    
    # Apply exclusions at root level only
    if root == '.':
        dirs = [d for d in dirs if d not in EXCLUDE_DIRS]
        files = [f for f in files if f not in EXCLUDE_FILES]
    
    all_items = [(d, True) for d in dirs] + [(f, False) for f in files]
    
    for idx, (name, is_dir) in enumerate(all_items):
        is_last = idx == len(all_items) - 1
        connector = '└── ' if is_last else '├── '
        entries.append(prefix + connector + name)
        
        if is_dir:
            extension = '    ' if is_last else '│   '
            child_path = os.path.join(root, name)
            child_prefix = prefix + extension
            entries.extend(build_tree(child_path, child_prefix))
    
    return entries

# ── Main ───────────────────────────────────────────────────────

def main():
    tree = build_tree('.')
    
    content = chr(10).join(tree)
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    
    total = len(tree)
    print(f'Done! {total} entries -> {OUTPUT_FILE}')

if __name__ == '__main__':
    main()