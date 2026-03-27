---
name: solana-researcher
description: Research Solana ecosystem and community to identify successful, desirable project opportunities. Analyzes hackathon projects, GitHub repos, DApp usage, community needs, gaps in the market, and emerging trends. Activated when user says "lets build on Solana" or "lets use Colosseum".
---

# Solana Researcher Skill

Deep research into the Solana ecosystem to discover what to build.

## Activation Triggers

**Say these phrases to activate:**
- "lets build on Solana"
- "lets use Colosseum"
- "research Solana opportunities"
- "what should we build on Solana"

## Purpose

Find the intersection of:
- **Community needs** - What Solana users actually want
- **Market gaps** - What's missing from the ecosystem  
- **Your strengths** - What you can build well
- **Profit potential** - What can be monetized

## Research Process

```
1. Data Collection
   ├── Colosseum hackathon projects (5,400+)
   ├── GitHub trending Solana repos
   ├── DApp radar (usage statistics)
   ├── Twitter/X sentiment analysis
   └── Discord community requests

2. Gap Analysis
   ├── Compare: What's built vs What's needed
   ├── Identify: Underserved niches
   ├── Find: Failed projects (why they failed)
   └── Spot: Emerging trends

3. Opportunity Scoring
   ├── Community demand (1-10)
   ├── Competition level (1-10)
   ├── Technical feasibility (1-10)
   └── Profit potential (1-10)

4. Recommendation
   └── Top 3-5 opportunities with evidence
```

## Data Sources

| Source | What It Tells Us | How We Use It |
|--------|------------------|---------------|
| **Colosseum** | 5,400+ hackathon projects | See what builders are trying, what's winning |
| **GitHub** | Open source Solana projects | Find trending tech, forks, stars |
| **DApp Radar** | On-chain usage metrics | See what's actually being used |
| **DefiLlama** | TVL, protocol metrics | Find profitable niches |
| **Twitter/X** | Community sentiment | Hear complaints, requests, hype |
| **Discord** | Developer discussions | Find pain points, tool gaps |
| **Solana Foundation** | Grants, initiatives | Align with ecosystem priorities |

## Research Commands

### 1. Ecosystem Scan

```bash
# Full ecosystem analysis
python3 ~/skills/solana-researcher/scripts/ecosystem_scan.py --depth full

# Quick trending check
python3 ~/skills/solana-researcher/scripts/ecosystem_scan.py --depth quick
```

### 2. Hackathon Research (Colosseum)

```bash
# Search Colosseum projects
python3 ~/skills/solana-researcher/scripts/search_colosseum.py \
  --query "DeFi lending" \
  --sort-by winners

# Analyze winning patterns
python3 ~/skills/solana-researcher/scripts/analyze_winners.py \
  --track "Grizzlython" \
  --category "DeFi"
```

### 3. Gap Analysis

```bash
# Find ecosystem gaps
python3 ~/skills/solana-researcher/scripts/find_gaps.py \
  --sector "payments" \
  --min-tvl 1000000

# Compare to Ethereum (what's missing)
python3 ~/skills/solana-researcher/scripts/compare_chains.py \
  --from ethereum \
  --to solana
```

### 4. Community Research

```bash
# Analyze Twitter sentiment
python3 ~/skills/solana-researcher/scripts/analyze_sentiment.py \
  --query "Solana needs" \
  --days 30

# Find Discord feature requests
python3 ~/skills/solana-researcher/scripts/discord_insights.py \
  --server "solana-tech"
```

### 5. Opportunity Report

```bash
# Generate full opportunity report
python3 ~/skills/solana-researcher/scripts/opportunity_report.py \
  --focus "infrastructure" \
  --output ./solana-opportunities.md
```

## Analysis Framework

### What We Look For

**Green Flags (Good Opportunities)**
- High community demand, low competition
- Solves real pain point
- Builds on existing protocol
- Founder-market fit
- Clear monetization

**Red Flags (Avoid)**
- Saturated market (10+ competitors)
- "Me too" product
- Complex without benefit
- No clear user
- Regulatory gray area

**Questions We Answer**

1. **Who wants this?**
   - Specific user personas
   - Proven demand (not speculative)

2. **Why Solana?**
   - Why not Ethereum/Base/Arbitrum?
   - Solana-specific advantages

3. **Why you?**
   - Your relevant experience
   - Competitive advantage

4. **Why now?**
   - Market timing
   - Ecosystem readiness

## Research Categories

### DeFi (Decentralized Finance)

```
Sub-niches:
├── DEX & AMM (Jupiter, Raydium, Orca)
├── Lending/Borrowing (Solend, MarginFi, Kamino)
├── Yield Farming
├── Derivatives (Drift, 01)
├── Options (PsyOptions, Ribbon)
├── Structured Products
├── Real World Assets (RWA)
└── Payments & Remittances

What to look for:
- High TVL growth
- User retention
- Fee generation
- Underserved markets
```

### Infrastructure

```
Sub-niches:
├── Wallets (Phantom, Solflare, Backpack)
├── Explorers (Solscan, SolanaFM)
├── RPC Providers (Helius, QuickNode)
├── Indexers (The Graph, Subsquid)
├── Oracles (Pyth, Switchboard)
├── Bridges (Wormhole, Allbridge)
├── Account Abstraction
├── MEV Protection
└── Developer Tools

What to look for:
- Developer pain points
- Missing tooling
- Performance bottlenecks
```

### Consumer/Gaming

```
├── NFT Marketplaces (Tensor, Magic Eden)
├── Gaming (Star Atlas, Aurory)
├── Social (Dialect, Access Protocol)
├── Loyalty/Rewards
├── Ticketing
├── Music/Entertainment
└── Metaverse

What to look for:
- User engagement
- Retention metrics
- Viral mechanics
```

### Emerging

```
├── AI x Crypto
├── DePIN (Decentralized Physical Infrastructure)
├── Zero Knowledge
├── Intent-Based Systems
├── Account Abstraction
└── Restaking
```

## Output Format

### Opportunity Card

```markdown
## Opportunity: [Name]

**Category**: DeFi / Infrastructure / Consumer
**Difficulty**: Easy / Medium / Hard
**Time to MVP**: 2 weeks / 1 month / 3 months

### The Problem
[What pain point this solves]

### Evidence
- [Data point 1]
- [Data point 2]
- [Data point 3]

### Competition
- [Competitor 1] - Their weakness: [X]
- [Competitor 2] - Their weakness: [Y]

### Why It Wins
1. [Advantage 1]
2. [Advantage 2]
3. [Advantage 3]

### Technical Approach
- **Stack**: Rust/Anchor, React, Next.js
- **Key integrations**: Jupiter, Pyth
- **MVP scope**: [Specific features]

### Monetization
- Revenue model: [Fees/subscriptions/etc]
- Target ARR: $X
- Path to profitability: [Steps]

### Next Steps
1. [Immediate action]
2. [Follow-up action]
3. [Validation step]
```

## Usage Examples

### Example 1: "Find me a DeFi opportunity"

I would:
1. Query Colosseum for winning DeFi projects
2. Check DefiLlama for TVL gaps
3. Analyze Jupiter/Solend feature requests
4. Score opportunities
5. Present top 3 with evidence

### Example 2: "What infrastructure is missing?"

I would:
1. Survey developer Discord channels
2. Check GitHub for most-requested features
3. Compare tooling to Ethereum ecosystem
4. Look at failed projects (why they failed)
5. Recommend 3-5 infrastructure plays

### Example 3: "Quick trending check"

I would:
1. Pull last 30 days of hackathon submissions
2. Check GitHub star velocity
3. Read Twitter sentiment
4. Give you 3 hot opportunities in 5 minutes

## Decision Matrix

When presenting opportunities, I use this scoring:

| Criteria | Weight | Score |
|----------|--------|-------|
| Community Demand | 25% | 1-10 |
| Competition Level | 20% | 1-10 (higher = less competition) |
| Your Fit | 20% | 1-10 |
| Technical Feasibility | 15% | 1-10 |
| Profit Potential | 15% | 1-10 |
| Timing | 5% | 1-10 |

**Total Score**: Weighted average
- 8.0+ = Must build
- 6.0-7.9 = Strong candidate
- 4.0-5.9 = Consider with caveats
- < 4.0 = Skip

## Resources

### Data APIs
- Colosseum: https://copilot.colosseum.com/api/v1
- DefiLlama: https://api.llama.fi
- DApp Radar: https://dappradar.com/api
- GitHub: https://api.github.com
- Twitter: https://api.twitter.com/2

### Community Hubs
- Solana Tech Discord
- Solana StackExchange
- r/solana (Reddit)
- Solana Forums

### Analysis Tools
- Built-in: ecosystem_scan.py
- External: Token Terminal, Artemis, Nansen

## Remember

**I will NOT use your Colosseum token unless you say:**
- "lets build on Solana"
- "lets use Colosseum"
- "research Solana opportunities"

This skill is about **research and discovery**, not execution. Once we pick an opportunity, we'll use other skills to build it.
