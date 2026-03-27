#!/usr/bin/env python3
"""
Consolidate conversation history into persistent memory.
Reads past 24hrs of logs, extracts key info, updates memory files.
"""

import os
import sys
import json
import re
import argparse
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
MEMORY_DIR = Path.home() / "memory"
SKILL_DIR = Path.home() / "skills" / "consolidate-memory"
LOGS_DIR = SKILL_DIR / "logs"
CLAUDE_DIR = Path.home() / ".claude"

# Ensure directories exist
LOGS_DIR.mkdir(parents=True, exist_ok=True)

class MemoryConsolidator:
    def __init__(self, dry_run=False, full=False):
        self.dry_run = dry_run
        self.full = full
        self.now = datetime.now()
        self.cutoff = self.now - timedelta(hours=24 if not full else 168)  # 24hr or 7 days
        self.extracted_facts = []
        self.extracted_preferences = []
        self.extracted_decisions = []
        self.extracted_patterns = []
        
    def log(self, message):
        """Log to console and file."""
        timestamp = self.now.strftime("%Y-%m-%d %H:%M:%S")
        log_line = f"[{timestamp}] {message}"
        print(log_line)
        
        log_file = LOGS_DIR / "consolidation.log"
        with open(log_file, "a") as f:
            f.write(log_line + "\n")
    
    def find_conversation_files(self):
        """Find conversation log files from the past 24 hours."""
        files = []
        
        # Look in ~/.claude/conversations/
        conv_dir = CLAUDE_DIR / "conversations"
        if conv_dir.exists():
            for file in conv_dir.glob("*.jsonl"):
                mtime = datetime.fromtimestamp(file.stat().st_mtime)
                if mtime > self.cutoff:
                    files.append(file)
        
        # Also check for .log files
        if conv_dir.exists():
            for file in conv_dir.glob("*.log"):
                mtime = datetime.fromtimestamp(file.stat().st_mtime)
                if mtime > self.cutoff:
                    files.append(file)
        
        # Check Kimi-specific locations
        kimi_dir = Path.home() / ".kimi"
        if kimi_dir.exists():
            for file in kimi_dir.rglob("*.log"):
                mtime = datetime.fromtimestamp(file.stat().st_mtime)
                if mtime > self.cutoff:
                    files.append(file)
        
        return sorted(files, key=lambda f: f.stat().st_mtime, reverse=True)
    
    def parse_conversation(self, file_path):
        """Parse a conversation file and extract key information."""
        content = ""
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except Exception as e:
            self.log(f"Warning: Could not read {file_path}: {e}")
            return []
        
        facts = []
        
        # Try JSONL format
        if file_path.suffix == ".jsonl":
            for line in content.strip().split("\n"):
                try:
                    data = json.loads(line)
                    if "content" in data:
                        facts.extend(self.extract_from_text(data["content"]))
                except json.JSONDecodeError:
                    continue
        else:
            # Plain text format
            facts.extend(self.extract_from_text(content))
        
        return facts
    
    def extract_from_text(self, text):
        """Extract key information from text."""
        facts = []
        
        # Extract preferences ("I prefer...", "I like...", "I want...")
        preference_patterns = [
            r"I (?:prefer|like|want|need|hate|dislike)\s+([^\.\n]+)",
            r"(?:Please|Always|Never)\s+([^\.\n]+)",
            r"Make sure to\s+([^\.\n]+)",
        ]
        for pattern in preference_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                facts.append({"type": "preference", "content": match.strip()})
        
        # Extract decisions ("Let's use...", "We decided...", "Going with...")
        decision_patterns = [
            r"(?:Let's|We|I|Going to)\s+(?:use|decided|choose|go with|pick)\s+([^\.\n]+)",
            r"Decision:\s*([^\.\n]+)",
            r"(?:Use|Using)\s+([^\.\n]+)\s+(?:instead|for|as)",
        ]
        for pattern in decision_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                facts.append({"type": "decision", "content": match.strip()})
        
        # Extract important facts ("Remember...", "Important...", "Key...")
        fact_patterns = [
            r"(?:Remember|Important|Key|Note):?\s*([^\.\n]+)",
            r"(?:The|This|That)\s+(?:is|means|represents)\s+([^\.\n]+)",
        ]
        for pattern in fact_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                facts.append({"type": "fact", "content": match.strip()})
        
        # Extract error patterns
        error_patterns = [
            r"(?:Mistake|Error|Bug|Issue):?\s*([^\.\n]+)",
            r"(?:Pattern ID|Error Pattern):?\s*([A-Z]+_\d+)",
            r"Lesson learned:?\s*([^\.\n]+)",
        ]
        for pattern in error_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                facts.append({"type": "pattern", "content": match.strip()})
        
        # Extract project context
        project_patterns = [
            r"(?:Working on|Project|Task):?\s*([^\.\n]+)",
            r"Status:\s*(\w+)",
        ]
        for pattern in project_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                facts.append({"type": "project", "content": match.strip()})
        
        return facts
    
    def read_memory_file(self, filename):
        """Read a memory file if it exists."""
        filepath = MEMORY_DIR / filename
        if filepath.exists():
            with open(filepath, "r") as f:
                return f.read()
        return ""
    
    def write_memory_file(self, filename, content):
        """Write to a memory file."""
        if self.dry_run:
            self.log(f"[DRY RUN] Would write to {filename}")
            print(f"--- Content preview ---")
            print(content[:500] + "..." if len(content) > 500 else content)
            print(f"--- End preview ---\n")
            return
        
        filepath = MEMORY_DIR / filename
        with open(filepath, "w") as f:
            f.write(content)
        self.log(f"Updated {filename}")
    
    def update_recent_memory(self, new_facts):
        """Update recent-memory.md with new facts."""
        existing = self.read_memory_file("recent-memory.md")
        
        # Parse existing entries
        current_time = self.now.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # Build new content
        sections = [f"# Recent Memory (Rolling 48hr Context)\n", f"Last Updated: {current_time}\n"]
        
        # Group facts by type
        facts_by_type = {}
        for fact in new_facts:
            ftype = fact.get("type", "fact")
            if ftype not in facts_by_type:
                facts_by_type[ftype] = []
            facts_by_type[ftype].append(fact["content"])
        
        # Add new session context
        sections.append(f"\n## Session {current_time[:10]}\n")
        
        for ftype, contents in facts_by_type.items():
            sections.append(f"\n### {ftype.title()}s\n")
            for content in set(contents):  # Deduplicate
                sections.append(f"- {content}\n")
        
        # Keep some recent context from existing (last 2000 chars)
        if existing:
            # Find older sessions to archive
            sections.append(f"\n## Previous Context\n")
            sections.append("*See long-term-memory.md for older facts*\n")
        
        self.write_memory_file("recent-memory.md", "".join(sections))
    
    def update_long_term_memory(self, new_facts):
        """Update long-term-memory.md with promoted facts."""
        existing = self.read_memory_file("long-term-memory.md")
        
        # Only promote certain types to long-term
        promotable_types = ["preference", "pattern"]
        promoted = [f for f in new_facts if f.get("type") in promotable_types]
        
        if not promoted and not self.full:
            self.log("No new long-term memories to add")
            return
        
        current_time = self.now.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # If file exists, update timestamp and append
        if existing:
            existing = existing.replace(
                re.search(r"Last Updated: .*", existing).group(0),
                f"Last Updated: {current_time}"
            )
            
            # Append new patterns/preferences
            if promoted:
                new_section = f"\n## Auto-Consolidated ({current_time[:10]})\n\n"
                for fact in promoted:
                    new_section += f"- **{fact['type'].title()}**: {fact['content']}\n"
                
                # Insert before new_learnings section
                if "## new_learnings" in existing:
                    parts = existing.split("## new_learnings")
                    existing = parts[0] + new_section + "\n## new_learnings" + parts[1]
                else:
                    existing += new_section
            
            self.write_memory_file("long-term-memory.md", existing)
        else:
            # Create new file
            content = f"# Long-Term Memory\n\nLast Updated: {current_time}\n\n"
            for fact in promoted:
                content += f"- **{fact['type'].title()}**: {fact['content']}\n"
            self.write_memory_file("long-term-memory.md", content)
    
    def consolidate(self):
        """Main consolidation process."""
        self.log(f"Starting memory consolidation (dry_run={self.dry_run}, full={self.full})")
        
        # Find conversation files
        files = self.find_conversation_files()
        self.log(f"Found {len(files)} conversation files")
        
        if not files:
            self.log("No recent conversations found")
            return
        
        # Parse all files
        all_facts = []
        for file in files:
            self.log(f"Processing {file.name}")
            facts = self.parse_conversation(file)
            all_facts.extend(facts)
        
        self.log(f"Extracted {len(all_facts)} facts")
        
        if not all_facts:
            self.log("No facts extracted")
            return
        
        # Update memory files
        self.update_recent_memory(all_facts)
        self.update_long_term_memory(all_facts)
        
        self.log("Consolidation complete")


def main():
    parser = argparse.ArgumentParser(description="Consolidate conversation history into memory")
    parser.add_argument("--dry-run", action="store_true", help="Show what would change without writing")
    parser.add_argument("--full", action="store_true", help="Process last 7 days instead of 24 hours")
    args = parser.parse_args()
    
    consolidator = MemoryConsolidator(dry_run=args.dry_run, full=args.full)
    consolidator.consolidate()


if __name__ == "__main__":
    main()
