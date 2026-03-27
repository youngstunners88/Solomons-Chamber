#!/usr/bin/env python3
"""
Log a mistake to the growth log.
Usage: python log_mistake.py "What I tried" "What happened" "Type"
"""

import sys
import datetime
import os

GROWTH_LOG = os.path.expanduser("~/.kimi/skills/self-growth/references/growth-log.md")

def get_next_entry_number():
    """Find the next entry number from the log."""
    if not os.path.exists(GROWTH_LOG):
        return 1
    
    with open(GROWTH_LOG, 'r') as f:
        content = f.read()
    
    # Count existing entries
    count = content.count("### Entry #")
    return count + 1

def log_mistake(what_tried, what_happened, error_type="Unknown"):
    """Add a new entry to the growth log."""
    entry_num = get_next_entry_number()
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    
    entry = f"""
### Entry #{entry_num} - {date}
**Mistake**: {what_tried}
**Pattern_ID**: [To be classified]
**Type**: {error_type}
**Context**: [Fill in context]
**Analysis**: {what_happened}
**Lesson**: [What I learned]
**Action**: [What I did differently]
**Prevention**: [Guardrail/system change]
**Confidence**: [1-10] Recognition next time

---
"""
    
    # Append to log
    with open(GROWTH_LOG, 'r') as f:
        content = f.read()
    
    # Insert before "## Growth Statistics"
    parts = content.split("## Growth Statistics")
    new_content = parts[0].rstrip() + entry + "\n## Growth Statistics" + parts[1]
    
    with open(GROWTH_LOG, 'w') as f:
        f.write(new_content)
    
    print(f"✓ Logged mistake as Entry #{entry_num}")
    print(f"  Next steps:")
    print(f"  1. Classify the pattern ID")
    print(f"  2. Extract the lesson")
    print(f"  3. Set confidence level")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python log_mistake.py 'What I tried' 'What happened' [error_type]")
        sys.exit(1)
    
    tried = sys.argv[1]
    happened = sys.argv[2]
    error_type = sys.argv[3] if len(sys.argv) > 3 else "Unknown"
    
    log_mistake(tried, happened, error_type)
