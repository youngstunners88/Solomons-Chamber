#!/usr/bin/env python3
"""
Analyze error patterns for recurrence and trends.
"""

import os
import re
from collections import Counter

GROWTH_LOG = os.path.expanduser("~/.kimi/skills/self-growth/references/growth-log.md")
ERROR_PATTERNS = os.path.expanduser("~/.kimi/skills/self-growth/references/error-patterns.md")

def extract_patterns():
    """Extract all pattern IDs from the error patterns file."""
    if not os.path.exists(ERROR_PATTERNS):
        return []
    
    with open(ERROR_PATTERNS, 'r') as f:
        content = f.read()
    
    # Find all PATTERN_ID lines
    pattern_ids = re.findall(r'PATTERN_ID: ([A-Z]+_\d+)', content)
    return pattern_ids

def analyze_growth_log():
    """Analyze the growth log for patterns and trends."""
    if not os.path.exists(GROWTH_LOG):
        return {"total": 0, "patterns": Counter(), "types": Counter()}
    
    with open(GROWTH_LOG, 'r') as f:
        content = f.read()
    
    # Count entries
    total = len(re.findall(r'### Entry #\d+', content))
    
    # Extract pattern IDs
    patterns = re.findall(r'\*\*Pattern_ID\*\*: ([A-Z]+_\d+|\[.*\])', content)
    pattern_counter = Counter([p for p in patterns if not p.startswith('[')])
    
    # Extract types
    types = re.findall(r'\*\*Type\*\*: (.+)', content)
    type_counter = Counter(types)
    
    return {
        "total": total,
        "patterns": pattern_counter,
        "types": type_counter
    }

def print_report():
    """Print analysis report."""
    print("=" * 50)
    print("SELF-GROWTH PATTERN ANALYSIS")
    print("=" * 50)
    
    analysis = analyze_growth_log()
    all_patterns = extract_patterns()
    
    print(f"\n📊 Overall Stats:")
    print(f"   Total mistakes logged: {analysis['total']}")
    print(f"   Documented patterns: {len(all_patterns)}")
    
    if analysis['patterns']:
        print(f"\n🔁 Recurring Patterns:")
        for pattern, count in analysis['patterns'].most_common():
            print(f"   {pattern}: {count} occurrence(s)")
    
    if analysis['types']:
        print(f"\n📁 Error Types:")
        for error_type, count in analysis['types'].most_common():
            print(f"   {error_type}: {count}")
    
    print(f"\n💡 Recommendations:")
    if analysis['total'] == 0:
        print("   No mistakes logged yet. Start logging to see patterns.")
    elif len(analysis['patterns']) == 0:
        print("   Mistakes logged but not classified. Add Pattern_IDs.")
    else:
        top_pattern = analysis['patterns'].most_common(1)[0]
        if top_pattern[1] > 1:
            print(f"   Focus area: {top_pattern[0]} ({top_pattern[1]} times)")
        else:
            print("   No recurring patterns yet. Good variety in mistakes.")
    
    print("=" * 50)

if __name__ == "__main__":
    print_report()
