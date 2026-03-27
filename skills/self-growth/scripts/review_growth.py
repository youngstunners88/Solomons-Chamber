#!/usr/bin/env python3
"""
Spaced repetition review of past mistakes.
"""

import os
import re
import datetime

GROWTH_LOG = os.path.expanduser("~/.kimi/skills/self-growth/references/growth-log.md")

def parse_entries():
    """Parse all entries from the growth log."""
    if not os.path.exists(GROWTH_LOG):
        return []
    
    with open(GROWTH_LOG, 'r') as f:
        content = f.read()
    
    entries = []
    entry_blocks = re.split(r'### Entry #\d+', content)[1:]  # Skip header
    
    for block in entry_blocks:
        date_match = re.search(r'- (\d{4}-\d{2}-\d{2})', block)
        mistake_match = re.search(r'\*\*Mistake\*\*: (.+)', block)
        lesson_match = re.search(r'\*\*Lesson\*\*: (.+)', block)
        
        if date_match and mistake_match:
            entries.append({
                'date': date_match.group(1),
                'mistake': mistake_match.group(1),
                'lesson': lesson_match.group(1) if lesson_match else "Not documented"
            })
    
    return entries

def should_review(date_str, review_type):
    """Check if entry should be reviewed based on spaced repetition."""
    entry_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
    today = datetime.date.today()
    delta = (today - entry_date).days
    
    if review_type == "daily":
        return delta < 1
    elif review_type == "weekly":
        return delta == 7 or delta == 6
    elif review_type == "monthly":
        return delta == 30 or delta == 29
    
    return False

def print_review(entries, review_type):
    """Print entries to review."""
    to_review = [e for e in entries if should_review(e['date'], review_type)]
    
    if not to_review:
        return
    
    print(f"\n📚 {review_type.upper()} REVIEW:")
    print("-" * 40)
    
    for entry in to_review:
        print(f"\n   Date: {entry['date']}")
        print(f"   Mistake: {entry['mistake']}")
        print(f"   Lesson: {entry['lesson']}")

if __name__ == "__main__":
    entries = parse_entries()
    
    if not entries:
        print("No entries to review yet.")
        sys.exit(0)
    
    print("=" * 50)
    print("SPACED REPETITION REVIEW")
    print("=" * 50)
    
    print_review(entries, "daily")
    print_review(entries, "weekly")
    print_review(entries, "monthly")
    
    print(f"\n✓ Total entries: {len(entries)}")
    print("=" * 50)
