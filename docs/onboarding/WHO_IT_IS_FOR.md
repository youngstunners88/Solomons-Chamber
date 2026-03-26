# Who Is Solomons Chamber For?

## 👤 Personas

### 1. The Trader
**You are:** Someone who trades stocks, crypto, or markets.

**You struggle with:**
- Losing track of why you entered a position
- Scattered notes across apps
- No systematic review of what worked

**Solomons Chamber helps you:**
- Capture voice memos during market hours
- Track signals with timestamps
- Review positions weekly
- Build a personal trading playbook

**Quick start:**
```bash
# Add your first signal
bun 03-Trading/signals/create.ts "BTC long at 67k"

# Review weekly
bun 05-Self-Notes/weekly/create.ts && cat 05-Self-Notes/weekly/$(date +%Y-W%U).md
```

---

### 2. The Researcher
**You are:** Someone who reads papers, analyzes data, builds knowledge.

**You struggle with:**
- Bookmark overload
- Losing sources
- No synthesis of what you've learned

**Solomons Chamber helps you:**
- Ingest PDFs and papers automatically
- Link sources to insights
- Build research networks
- Find connections across topics

**Quick start:**
```bash
# Add a paper
bun 02-Research/sources/ingest.ts "https://arxiv.org/abs/2504.19877"

# Create insight
bun 02-Research/insights/create.ts "TurboQuant compression breakthrough"
```

---

### 3. The Builder
**You are:** Someone building a business, product, or project.

**You struggle with:**
- Context switching
- Losing project history
- No documentation of decisions

**Solomons Chamber helps you:**
- Document projects from day one
- Track experiments and outcomes
- Archive learnings when done
- Build a personal playbook

**Quick start:**
```bash
# Start a project
bun 01-Projects/active/create.ts "Launch landing page"

# Log experiment
bun 01-Projects/active/experiment.ts "A/B test headline"
```

---

### 4. The Thinker
**You are:** Someone who wants to think better, clearer, deeper.

**You struggle with:**
- Thoughts scattered everywhere
- No time for reflection
- Losing good ideas

**Solomons Chamber helps you:**
- Daily notes in under 5 minutes
- Weekly reviews that matter
- Voice memos when typing is too slow
- A journal that lasts decades

**Quick start:**
```bash
# Daily note
cat > 05-Self-Notes/daily/$(date +%Y-%m-%d).md << 'EOF'
---
date: $(date +%Y-%m-%d)
mood: 
focus: 
---

## Morning
- 

## Afternoon
- 

## Evening
- 

## One insight

EOF
```

---

## 📱 Mobile & Tablet Setup

### Option 1: Obsidian Mobile (Recommended)
1. Install Obsidian on your phone/tablet
2. Clone the vault using the Git plugin
3. Sync via GitHub or your own server
4. Write anywhere, commit when ready

**Why this works:**
- Native mobile experience
- Offline access
- Auto-sync when connected
- All your plugins work

### Option 2: Working Copy (iOS) / MGit (Android)
1. Install Git client on your device
2. Clone `https://github.com/youngstunners88/Solomons-Chamber.git`
3. Use a markdown editor (iA Writer, Markor)
4. Sync via Git when ready

**Why this works:**
- Full Git control on mobile
- Any markdown app works
- No lock-in to one app

### Option 3: Termux + CLI (Android)
```bash
# In Termux
pkg install git nodejs
npm install -g bun
git clone https://github.com/youngstunners88/Solomons-Chamber.git
```

**Why this works:**
- Full server capability on phone
- Run scripts in your pocket
- True power user setup

---

## 🎯 Quick Wins by Persona

| Persona | First Week Goal | Setup Time |
|---------|-------------------|------------|
| Trader | Log 3 trades with voice memos | 15 min |
| Researcher | Ingest 2 papers with tags | 20 min |
| Builder | Start 1 project with structure | 10 min |
| Thinker | 5 daily notes | 10 min |

---

## 🚀 Your First 24 Hours

**Hour 1: Install**
```bash
git clone https://github.com/youngstunners88/Solomons-Chamber.git
cd Solomons-Chamber
```

**Hour 2: Personalize**
- Pick your persona
- Complete the quick start for that persona
- Create your first note

**Hour 3: Capture**
- Use voice memos (if trader/thinker)
- Ingest a source (if researcher)
- Start a project (if builder)

**Day 2-7: Build the habit**
- Capture one thing per day
- Review weekly (if you made it that far)
- Share what you learned

---

## ❓ Still Not Sure?

Start here:
```bash
# See what the vault looks like
find . -type f -name "*.md" | head -10

# Look at examples
ls examples/

# Read the trader example
cat examples/trader/README.md
```

**No wrong way to start. Just start.**