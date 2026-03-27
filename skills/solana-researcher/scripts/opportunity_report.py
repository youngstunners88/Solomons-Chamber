#!/usr/bin/env python3
"""
Generate comprehensive opportunity report for Solana.
Scores and ranks potential projects based on multiple factors.
"""

import argparse
import json
from datetime import datetime
from pathlib import Path

SKILL_DIR = Path.home() / "skills" / "solana-researcher"

# Sample opportunities database (would be populated by research)
OPPORTUNITIES = [
    {
        "name": "MEV Protection Wallet",
        "category": "Infrastructure",
        "problem": "Users getting frontrun on Jupiter swaps",
        "evidence": [
            "Twitter complaints about sandwich attacks up 300%",
            "No good wallet-level protection exists",
            "Flashbots-style protection missing on Solana"
        ],
        "competition": [
            {"name": "Jito", "weakness": "Validator-level only, not wallet"},
            {"name": "Bloxroute", "weakness": "Paid, complex setup"}
        ],
        "scores": {
            "demand": 9,
            "competition": 8,  # Low competition
            "feasibility": 7,
            "profit": 8
        },
        "approach": "Browser extension + Phantom integration",
        "mvp_time": "1 month",
        "revenue": "Swap fee sharing"
    },
    {
        "name": "No-Code Token Launchpad",
        "category": "DeFi",
        "problem": "Creating tokens requires coding knowledge",
        "evidence": [
            "Pump.fun doing $1M+ daily volume",
            "500+ new tokens created daily",
            "High demand for easy token creation"
        ],
        "competition": [
            {"name": "Pump.fun", "weakness": "Meme coins only, no utility"},
            {"name": "TokenFi", "weakness": "Complex, expensive"}
        ],
        "scores": {
            "demand": 10,
            "competition": 4,  # High competition
            "feasibility": 8,
            "profit": 9
        },
        "approach": "Web UI + Metaplex integration",
        "mvp_time": "2 weeks",
        "revenue": "1% of token sales"
    },
    {
        "name": "Cross-Chain Payment Widget",
        "category": "Payments",
        "problem": "Merchants can't easily accept Solana payments",
        "evidence": [
            "Stripe dropped crypto support",
            "Coinbase Commerce limited chains",
            "SolanaPay not widely adopted"
        ],
        "competition": [
            {"name": "SolanaPay", "weakness": "Solana only, no cross-chain"},
            {"name": "Coinbase Commerce", "weakness": "No Solana support"}
        ],
        "scores": {
            "demand": 8,
            "competition": 9,  # Almost none
            "feasibility": 6,
            "profit": 8
        },
        "approach": "React component + Wormhole integration",
        "mvp_time": "6 weeks",
        "revenue": "0.5% transaction fees"
    },
    {
        "name": "AI-Powered Trading Assistant",
        "category": "DeFi",
        "problem": "New traders don't understand DeFi strategies",
        "evidence": [
            "Drift, 01 growing fast but complex UI",
            "High demand for simplified trading",
            "AI agents trending on Solana"
        ],
        "competition": [
            {"name": "3Commas", "weakness": "Not Solana native"},
            {"name": "BONKbot", "weakness": "Meme focused only"}
        ],
        "scores": {
            "demand": 9,
            "competition": 6,
            "feasibility": 7,
            "profit": 9
        },
        "approach": "Telegram bot + Jupiter API + AI",
        "mvp_time": "3 weeks",
        "revenue": "Subscription + performance fees"
    },
    {
        "name": "Developer Analytics Dashboard",
        "category": "Infrastructure",
        "problem": "No good tool for Solana program analytics",
        "evidence": [
            "Developers building in the dark",
            "Dune limited Solana support",
            "High demand for on-chain insights"
        ],
        "competition": [
            {"name": "Helius", "weakness": "RPC focused, not analytics"},
            {"name": "Dune", "weakness": "Limited Solana data"}
        ],
        "scores": {
            "demand": 7,
            "competition": 8,
            "feasibility": 7,
            "profit": 6
        },
        "approach": "Web app + custom indexer",
        "mvp_time": "2 months",
        "revenue": "SaaS subscription"
    }
]


def calculate_score(opp):
    """Calculate weighted opportunity score."""
    scores = opp["scores"]
    weights = {
        "demand": 0.25,
        "competition": 0.20,  # Higher score = less competition
        "feasibility": 0.20,
        "profit": 0.20,
        "timing": 0.15  # Default to 7
    }
    
    total = sum(scores.get(k, 7) * weights[k] for k in weights)
    return round(total, 1)


def generate_opportunity_card(opp, rank):
    """Generate formatted opportunity card."""
    score = calculate_score(opp)
    
    card = f"""
{'='*70}
## {rank}. {opp['name']} [Score: {score}/10]
{'='*70}

**Category**: {opp['category']}
**Difficulty**: {opp['mvp_time']} to MVP

### The Problem
{opp['problem']}

### Evidence
"""
    for evidence in opp['evidence']:
        card += f"- {evidence}\n"
    
    card += f"""
### Competition
"""
    for comp in opp['competition']:
        card += f"- **{comp['name']}** - Weakness: {comp['weakness']}\n"
    
    card += f"""
### Score Breakdown
"""
    for criteria, score in opp['scores'].items():
        bar = "█" * score + "░" * (10 - score)
        card += f"- {criteria.capitalize():12} [{bar}] {score}/10\n"
    
    card += f"""
### Technical Approach
{opp['approach']}

### Monetization
- Revenue model: {opp['revenue']}
- Time to MVP: {opp['mvp_time']}

### Next Steps
1. Validate demand with 5 potential users
2. Build MVP with core feature
3. Launch on Twitter/Solana forums
4. Iterate based on feedback
"""
    return card


def generate_report(focus=None, output=None):
    """Generate full opportunity report."""
    
    # Filter by focus if specified
    opportunities = OPPORTUNITIES
    if focus:
        opportunities = [o for o in opportunities if o['category'].lower() == focus.lower()]
    
    # Sort by score
    opportunities = sorted(opportunities, key=calculate_score, reverse=True)
    
    # Build report
    report = f"""
{'#'*70}
# SOLANA OPPORTUNITY REPORT
{'#'*70}

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}
Focus: {focus or 'All Categories'}

## Executive Summary

Analyzed {len(opportunities)} opportunities across Solana ecosystem.
Top opportunities combine high demand with low competition.

## Top Opportunities

"""
    
    for i, opp in enumerate(opportunities[:5], 1):
        report += generate_opportunity_card(opp, i)
    
    report += f"""
{'='*70}
## How to Choose

**If you want fast revenue**: Pick opportunity #1 or #2
**If you want less competition**: Pick opportunity #3 or #5  
**If you want to ride a trend**: Pick opportunity #4 (AI)

**Validation Checklist**:
- [ ] Talk to 5 potential users
- [ ] Build MVP in <1 month
- [ ] Launch to get feedback
- [ ] Iterate or pivot based on data

{'='*70}
"""
    
    # Output
    if output:
        with open(output, 'w') as f:
            f.write(report)
        print(f"✓ Report saved to: {output}")
    else:
        print(report)


def main():
    parser = argparse.ArgumentParser(description="Generate Solana opportunity report")
    parser.add_argument(
        "--focus",
        choices=["DeFi", "Infrastructure", "Payments", "Gaming", "Consumer"],
        help="Focus on specific category"
    )
    parser.add_argument(
        "--output", "-o",
        help="Output file path"
    )
    args = parser.parse_args()
    
    generate_report(args.focus, args.output)


if __name__ == "__main__":
    main()
