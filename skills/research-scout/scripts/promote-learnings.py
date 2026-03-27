#!/usr/bin/env python3
"""
Weekly promotion of new_learnings to main memory sections.
Reviews staged findings, promotes confirmed patterns, clears staging.
"""

import re
from datetime import datetime, timedelta
from pathlib import Path

MEMORY_DIR = Path.home() / "memory"
SKILL_DIR = Path.home() / "skills" / "research-scout"
LOGS_DIR = SKILL_DIR / "logs"

LOGS_DIR.mkdir(parents=True, exist_ok=True)

class LearningPromoter:
    def __init__(self, dry_run=False):
        self.dry_run = dry_run
        self.now = datetime.now()
        self.promoted = []
        self.discarded = []
        self.flagged = []
        
    def log(self, message):
        """Log to console and file."""
        timestamp = self.now.strftime("%Y-%m-%d %H:%M:%S")
        log_line = f"[{timestamp}] {message}"
        print(log_line)
        
        log_file = LOGS_DIR / "promotion.log"
        with open(log_file, "a") as f:
            f.write(log_line + "\n")
    
    def parse_new_learnings(self):
        """Extract entries from new_learnings section."""
        lt_file = MEMORY_DIR / "long-term-memory.md"
        if not lt_file.exists():
            return []
        
        with open(lt_file) as f:
            content = f.read()
        
        # Find new_learnings section
        match = re.search(r'## new_learnings\n\n(.*?)(?=\n## |\Z)', content, re.DOTALL)
        if not match:
            return []
        
        section = match.group(1)
        entries = []
        
        # Parse each entry
        for line in section.strip().split('\n'):
            if not line.startswith('- '):
                continue
            
            # Extract timestamp
            ts_match = re.search(r'\*\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\]\*', line)
            timestamp = ts_match.group(1) if ts_match else None
            
            # Extract URL
            url_match = re.search(r'\]\(([^)]+)\)', line)
            url = url_match.group(1) if url_match else ""
            
            # Extract finding
            finding_match = re.search(r'Finding: ([^|]+)', line)
            finding = finding_match.group(1).strip() if finding_match else ""
            
            # Extract impact
            impact_match = re.search(r'Impact: ([^|]+)', line)
            impact = impact_match.group(1).strip() if impact_match else ""
            
            if timestamp and finding:
                entries.append({
                    "timestamp": timestamp,
                    "url": url,
                    "finding": finding,
                    "impact": impact,
                    "raw_line": line
                })
        
        return entries
    
    def should_promote(self, entry):
        """Determine if entry should be promoted to main memory."""
        entry_date = datetime.strptime(entry["timestamp"], "%Y-%m-%d %H:%M")
        age_days = (self.now - entry_date).days
        
        # Auto-promote criteria
        if "Breaking change" in entry["impact"]:
            return True  # Breaking changes are urgent
        
        if age_days >= 7:
            return True  # Older than a week, probably stable
        
        if "New capability" in entry["impact"] and age_days >= 3:
            return True  # New stuff confirmed after 3 days
        
        # Keep in staging
        return False
    
    def should_flag(self, entry):
        """Flag for user review if contradictory or uncertain."""
        return "Breaking change" in entry["impact"] or "contradicts" in entry["finding"].lower()
    
    def promote_entry(self, entry):
        """Promote entry to appropriate main memory section."""
        # Determine category based on impact
        if "Breaking change" in entry["impact"]:
            category = "Critical Update"
        elif "New capability" in entry["impact"]:
            category = "New Capability"
        elif "Alternative" in entry["impact"]:
            category = "Alternative Approach"
        else:
            category = "Update"
        
        # Format for main memory
        promoted_text = f"\n- **{category}**: {entry['finding']} ([Source]({entry['url']}), Discovered: {entry['timestamp']})"
        
        return promoted_text
    
    def update_memory_files(self, entries_to_promote, entries_to_keep):
        """Update memory files with promotions."""
        lt_file = MEMORY_DIR / "long-term-memory.md"
        
        with open(lt_file) as f:
            content = f.read()
        
        # Build new new_learnings section
        if entries_to_keep:
            new_section = "## new_learnings\n\n"
            for entry in entries_to_keep:
                new_section += f"{entry['raw_line']}\n"
        else:
            new_section = "## new_learnings\n\n*No pending findings*\n"
        
        # Replace old section
        content = re.sub(
            r'## new_learnings\n\n.*?\n(?=## |\Z)',
            new_section + "\n",
            content,
            flags=re.DOTALL
        )
        
        # Add promoted entries to relevant sections
        if entries_to_promote:
            # For now, add to a "Recent Updates" section
            promoted_section = "\n## Recent Updates (Auto-Promoted)\n\n"
            for entry in entries_to_promote:
                promoted_section += self.promote_entry(entry) + "\n"
            
            # Insert before new_learnings
            content = content.replace("## new_learnings", promoted_section + "\n## new_learnings")
        
        if self.dry_run:
            self.log("[DRY RUN] Would update memory files:")
            print(f"  Promoting: {len(entries_to_promote)} entries")
            print(f"  Keeping in staging: {len(entries_to_keep)} entries")
            return
        
        # Write back
        with open(lt_file, "w") as f:
            f.write(content)
        
        self.log(f"Updated memory: promoted {len(entries_to_promote)}, kept {len(entries_to_keep)}")
    
    def promote(self):
        """Main promotion process."""
        self.log(f"Starting weekly promotion (dry_run={self.dry_run})")
        
        # Parse current learnings
        entries = self.parse_new_learnings()
        self.log(f"Found {len(entries)} staged learnings")
        
        if not entries:
            self.log("No learnings to process")
            return
        
        # Categorize entries
        to_promote = []
        to_keep = []
        
        for entry in entries:
            if self.should_flag(entry):
                self.flagged.append(entry)
                to_keep.append(entry)  # Keep flagged for user review
            elif self.should_promote(entry):
                to_promote.append(entry)
                self.promoted.append(entry)
            else:
                to_keep.append(entry)
        
        self.log(f"Promoting: {len(to_promote)}")
        self.log(f"Flagged for review: {len(self.flagged)}")
        self.log(f"Keeping in staging: {len(to_keep)}")
        
        # Update files
        self.update_memory_files(to_promote, to_keep)
        
        # Report flagged items
        if self.flagged:
            print("\n⚠️  FLAGGED FOR REVIEW:")
            for entry in self.flagged:
                print(f"  - {entry['finding'][:70]}...")
                print(f"    Impact: {entry['impact']}")
        
        self.log("Promotion complete")


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Promote new learnings to main memory")
    parser.add_argument("--dry-run", action="store_true", help="Show what would change")
    args = parser.parse_args()
    
    promoter = LearningPromoter(dry_run=args.dry_run)
    promoter.promote()


if __name__ == "__main__":
    main()
