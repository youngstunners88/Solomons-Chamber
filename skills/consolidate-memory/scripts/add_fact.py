#!/usr/bin/env python3
"""
Quickly add a fact to memory without full consolidation.
"""

import argparse
import sys
from pathlib import Path
from datetime import datetime

MEMORY_DIR = Path.home() / "memory"

def add_to_recent(content):
    """Add a fact to recent memory."""
    filepath = MEMORY_DIR / "recent-memory.md"
    
    # Read existing or create new
    if filepath.exists():
        with open(filepath, "r") as f:
            existing = f.read()
    else:
        existing = "# Recent Memory (Rolling 48hr Context)\n\n"
    
    # Add new entry
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    new_entry = f"\n## Quick Add - {timestamp}\n\n- {content}\n"
    
    # Insert after header
    lines = existing.split("\n")
    insert_idx = 0
    for i, line in enumerate(lines):
        if line.startswith("# "):
            insert_idx = i + 1
    
    lines.insert(insert_idx, new_entry)
    
    with open(filepath, "w") as f:
        f.write("\n".join(lines))
    
    print(f"✓ Added to recent-memory.md")

def add_to_long_term(category, content):
    """Add a fact to long-term memory."""
    filepath = MEMORY_DIR / "long-term-memory.md"
    
    if filepath.exists():
        with open(filepath, "r") as f:
            existing = f.read()
    else:
        existing = "# Long-Term Memory\n\n"
    
    timestamp = datetime.now().strftime("%Y-%m-%d")
    new_entry = f"\n- **{category}**: {content} *(Added: {timestamp})*\n"
    
    # Append before new_learnings if exists
    if "## new_learnings" in existing:
        parts = existing.split("## new_learnings")
        existing = parts[0] + new_entry + "\n## new_learnings" + parts[1]
    else:
        existing += new_entry
    
    with open(filepath, "w") as f:
        f.write(existing)
    
    print(f"✓ Added to long-term-memory.md")

def main():
    parser = argparse.ArgumentParser(description="Quickly add a fact to memory")
    parser.add_argument("--recent", metavar="TEXT", help="Add to recent memory")
    parser.add_argument("--long-term", metavar="TEXT", help="Add to long-term memory")
    parser.add_argument("--category", default="Fact", help="Category for long-term entry")
    args = parser.parse_args()
    
    if args.recent:
        add_to_recent(args.recent)
    
    if args.long_term:
        add_to_long_term(args.category, args.long_term)
    
    if not args.recent and not args.long_term:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
