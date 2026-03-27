#!/usr/bin/env python3
"""
Research Scout - Find new information challenging existing knowledge.
Searches web, Reddit, HN, Quora for relevant updates.
"""

import os
import sys
import re
import json
import argparse
import urllib.request
import urllib.parse
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

# Configuration
MEMORY_DIR = Path.home() / "memory"
SKILL_DIR = Path.home() / "skills" / "research-scout"
LOGS_DIR = SKILL_DIR / "logs"
TOPICS_FILE = SKILL_DIR / "config" / "topics.json"

# Ensure directories exist
LOGS_DIR.mkdir(parents=True, exist_ok=True)
TOPICS_FILE.parent.mkdir(parents=True, exist_ok=True)

# Default topics based on user context
DEFAULT_TOPICS = [
    "FastAPI new features",
    "MongoDB updates 2026",
    "React TypeScript patterns",
    "Polymarket trading API",
    "Kimi CLI updates",
    "sub-atomic agents mesh networking",
    "South Africa fintech",
    "Capacitor mobile updates",
    "Docker deployment best practices",
    "Railway.app updates",
    "D-Wave quantum computing",
    "blockchain X1 chain",
    "food delivery app architecture",
    "P2P offline sync",
    "Raspberry Pi Zero cluster",
]

class ResearchScout:
    def __init__(self, dry_run=False, force=False, topic=None, source=None):
        self.dry_run = dry_run
        self.force = force
        self.target_topic = topic
        self.target_source = source
        self.now = datetime.now()
        self.findings = []
        
    def log(self, message):
        """Log to console and file."""
        timestamp = self.now.strftime("%Y-%m-%d %H:%M:%S")
        log_line = f"[{timestamp}] {message}"
        print(log_line)
        
        log_file = LOGS_DIR / "scout.log"
        with open(log_file, "a") as f:
            f.write(log_line + "\n")
    
    def load_topics(self) -> List[str]:
        """Load topics to monitor."""
        if TOPICS_FILE.exists():
            with open(TOPICS_FILE) as f:
                data = json.load(f)
                return data.get("topics", DEFAULT_TOPICS)
        return DEFAULT_TOPICS
    
    def extract_topics_from_context(self) -> List[str]:
        """Extract topics from memory files and docs."""
        topics = set()
        
        # Read long-term memory
        lt_file = MEMORY_DIR / "long-term-memory.md"
        if lt_file.exists():
            with open(lt_file) as f:
                content = f.read()
                # Extract technology mentions
                tech_patterns = [
                    r"([A-Z][a-z]+(?:[A-Z][a-z]+)*)",  # CamelCase
                    r"`([a-z-]+)`",  # Inline code
                    r"\*\*([A-Z][^*]+)\*\*",  # Bold terms
                ]
                for pattern in tech_patterns:
                    matches = re.findall(pattern, content)
                    topics.update([m for m in matches if len(m) > 3])
        
        # Read project memory
        pm_file = MEMORY_DIR / "project-memory.md"
        if pm_file.exists():
            with open(pm_file) as f:
                content = f.read()
                # Extract active project names
                project_matches = re.findall(r"### [🟠🔴🟢🟡].*?\n([^#]+)", content, re.DOTALL)
                for match in project_matches:
                    topics.update(re.findall(r"([A-Z][a-zA-Z]+)", match))
        
        return list(topics)[:20]  # Limit to top 20
    
    def search_duckduckgo(self, query: str, max_results: int = 5) -> List[Dict]:
        """Search DuckDuckGo for query."""
        results = []
        try:
            # DuckDuckGo HTML scraping (fallback to news sites)
            encoded = urllib.parse.quote(query)
            url = f"https://html.duckduckgo.com/html/?q={encoded}"
            
            headers = {
                "User-Agent": "Mozilla/5.0 (compatible; ResearchBot/1.0)"
            }
            
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                html = response.read().decode('utf-8', errors='ignore')
                
                # Extract results
                result_blocks = re.findall(
                    r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)</a>',
                    html
                )
                
                for link, title in result_blocks[:max_results]:
                    results.append({
                        "title": title.strip(),
                        "url": link if link.startswith('http') else f"https:{link}",
                        "source": "web"
                    })
                    
        except Exception as e:
            self.log(f"Search error for '{query}': {e}")
        
        return results
    
    def search_hackernews(self, query: str) -> List[Dict]:
        """Search Hacker News via Algolia."""
        results = []
        try:
            encoded = urllib.parse.quote(query)
            url = f"https://hn.algolia.com/api/v1/search?query={encoded}&tags=story&hitsPerPage=5"
            
            headers = {
                "User-Agent": "ResearchBot/1.0"
            }
            
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                
                for hit in data.get("hits", []):
                    results.append({
                        "title": hit.get("title", "No title"),
                        "url": hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}",
                        "source": "hackernews",
                        "points": hit.get("points", 0)
                    })
                    
        except Exception as e:
            self.log(f"HN search error: {e}")
        
        return results
    
    def search_reddit(self, query: str) -> List[Dict]:
        """Search Reddit."""
        results = []
        try:
            # Reddit JSON endpoint (limited without auth)
            encoded = urllib.parse.quote(query)
            url = f"https://www.reddit.com/search.json?q={encoded}&sort=new&limit=5"
            
            headers = {
                "User-Agent": "ResearchBot/1.0 (by /u/youngstunners88)"
            }
            
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                
                for post in data.get("data", {}).get("children", []):
                    post_data = post.get("data", {})
                    results.append({
                        "title": post_data.get("title", "No title"),
                        "url": f"https://reddit.com{post_data.get('permalink', '')}",
                        "source": "reddit",
                        "subreddit": post_data.get("subreddit", "")
                    })
                    
        except Exception as e:
            self.log(f"Reddit search error: {e}")
        
        return results
    
    def cross_reference_existing(self, finding: Dict) -> bool:
        """Check if finding already exists in docs."""
        if self.force:
            return True
        
        # Read existing memory
        lt_content = ""
        lt_file = MEMORY_DIR / "long-term-memory.md"
        if lt_file.exists():
            with open(lt_file) as f:
                lt_content = f.read()
        
        # Check for exact URL match
        if finding["url"] in lt_content:
            return False
        
        # Check for similar title
        title_words = set(finding["title"].lower().split())
        for line in lt_content.split("\n"):
            if line.startswith("-") and "**" in line:
                existing_words = set(line.lower().split())
                overlap = len(title_words & existing_words)
                if overlap >= len(title_words) * 0.7:  # 70% word overlap
                    return False
        
        return True
    
    def determine_impact(self, finding: Dict) -> str:
        """Determine what the finding changes or adds."""
        title = finding["title"].lower()
        
        # Pattern matching for impact assessment
        if any(word in title for word in ["deprecated", "removed", "breaking"]):
            return "Breaking change - requires migration"
        elif any(word in title for word in ["new", "announced", "released", "launched"]):
            return "New capability available"
        elif any(word in title for word in ["vs", "comparison", "better", "faster"]):
            return "Alternative approach to consider"
        elif any(word in title for word in ["tutorial", "guide", "how to"]):
            return "Learning resource available"
        elif any(word in title for word in ["update", "improved", "enhanced"]):
            return "Incremental improvement"
        else:
            return "Informational - context expansion"
    
    def stage_finding(self, finding: Dict):
        """Stage a validated finding to new_learnings."""
        timestamp = self.now.strftime("%Y-%m-%d %H:%M")
        impact = self.determine_impact(finding)
        
        entry = {
            "timestamp": timestamp,
            "source": finding["source"],
            "url": finding["url"],
            "title": finding["title"],
            "impact": impact
        }
        
        self.findings.append(entry)
        self.log(f"Staged: {finding['title'][:60]}...")
    
    def update_memory(self):
        """Update long-term-memory.md with new findings."""
        if not self.findings:
            self.log("No new findings to stage")
            return
        
        if self.dry_run:
            self.log("[DRY RUN] Would add to new_learnings:")
            for f in self.findings:
                print(f"  - {f['title'][:60]}... ({f['source']})")
            return
        
        # Read existing
        lt_file = MEMORY_DIR / "long-term-memory.md"
        if lt_file.exists():
            with open(lt_file) as f:
                content = f.read()
        else:
            content = "# Long-Term Memory\n\n"
        
        # Ensure new_learnings section exists
        if "## new_learnings" not in content:
            content += "\n\n## new_learnings\n\n"
        
        # Add findings
        new_entries = []
        for finding in self.findings:
            entry = f"- **[{finding['timestamp']}]** | Source: [{finding['source'].upper()}]({finding['url']}) | Finding: {finding['title']} | Impact: {finding['impact']}\n"
            new_entries.append(entry)
        
        # Insert after new_learnings header
        parts = content.split("## new_learnings")
        updated = parts[0] + "## new_learnings\n" + "".join(new_entries) + parts[1] if len(parts) > 1 else content + "".join(new_entries)
        
        # Write back
        with open(lt_file, "w") as f:
            f.write(updated)
        
        self.log(f"Updated long-term-memory.md with {len(self.findings)} new findings")
    
    def scout(self):
        """Main scouting process."""
        self.log(f"Starting research scout (dry_run={self.dry_run}, force={self.force})")
        
        # Get topics
        if self.target_topic:
            topics = [self.target_topic]
        else:
            topics = self.load_topics()
            context_topics = self.extract_topics_from_context()
            topics = list(set(topics + context_topics))[:15]  # Limit to avoid rate limits
        
        self.log(f"Scouting {len(topics)} topics")
        
        # Search each topic across sources
        for topic in topics:
            self.log(f"Scouting: {topic}")
            
            sources_to_search = []
            if not self.target_source or self.target_source == "web":
                sources_to_search.append(("web", self.search_duckduckgo))
            if not self.target_source or self.target_source == "hackernews":
                sources_to_search.append(("hackernews", self.search_hackernews))
            if not self.target_source or self.target_source == "reddit":
                sources_to_search.append(("reddit", self.search_reddit))
            
            for source_name, search_func in sources_to_search:
                try:
                    results = search_func(topic)
                    for result in results:
                        if self.cross_reference_existing(result):
                            self.stage_finding(result)
                        else:
                            self.log(f"  Skipped (exists): {result['title'][:50]}...")
                except Exception as e:
                    self.log(f"  Error with {source_name}: {e}")
        
        # Update memory
        self.update_memory()
        self.log("Scouting complete")


def main():
    parser = argparse.ArgumentParser(description="Research scout for new information")
    parser.add_argument("--dry-run", action="store_true", help="Show findings without writing")
    parser.add_argument("--force", action="store_true", help="Include even if seems redundant")
    parser.add_argument("--topic", help="Scout specific topic only")
    parser.add_argument("--source", choices=["web", "hackernews", "reddit"], help="Specific source only")
    args = parser.parse_args()
    
    scout = ResearchScout(
        dry_run=args.dry_run,
        force=args.force,
        topic=args.topic,
        source=args.source
    )
    scout.scout()


if __name__ == "__main__":
    main()
