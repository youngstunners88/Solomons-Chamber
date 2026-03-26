# Mobile & Tablet Guide

🎯 **Goal:** Use Solomons Chamber from your phone or tablet as easily as from your computer.

---

## 📱 Option 1: Obsidian Sync (Easiest)

### Step 1: Install Obsidian
- **iOS:** App Store → Search "Obsidian"
- **Android:** Play Store → Search "Obsidian"
- **iPad:** Same as iOS

### Step 2: Add Git Community Plugin
1. Open Obsidian on Desktop
2. Settings → Community Plugins → Browse
3. Search "Obsidian Git"
4. Install and Enable

### Step 3: Clone Your Vault
1. In Obsidian Desktop: Open your Solomons-Chamber folder
2. Enable Git plugin
3. Create backup branch: `git checkout -b mobile`
4. Push to GitHub: `git push origin mobile`

### Step 4: Open on Mobile
1. Install Obsidian on phone
2. Open Folder → iCloud or Files → Select vault
3. OR use Obsidian Sync (paid) for automatic sync

### Step 5: Daily Mobile Workflow
```
Morning commute → Daily note (5 min)
Midday thought → Voice memo → QuickCapture
Evening → Review → Commit from desktop
```

**Pros:**
- Best mobile experience
- All plugins work
- Offline capable

**Cons:**
- Git sync requires manual step
- Obsidian Git plugin can be finicky

---

## 📱 Option 2: Git Client + Markdown Editor

### For iOS (iPhone/iPad)

**Apps:**
- **Working Copy** ($ free version works)
- **iA Writer** or **1Writer** (markdown editor)

**Setup:**
1. Install Working Copy
2. Clone `https://github.com/youngstunners88/Solomons-Chamber.git`
3. Install iA Writer
4. Open vault folder in iA Writer

**Workflow:**
```
1. Write in iA Writer
2. Switch to Working Copy
3. Commit + Push
4. Later: Pull on desktop
```

### For Android

**Apps:**
- **MGit** (free)
- **Markor** (free, open source)

**Setup:**
1. Install MGit
2. Clone repo
3. Install Markor
4. Set Markor to use Solomons-Chamber folder

**Workflow:**
```
1. Write in Markor
2. Open MGit
3. Commit → Push
4. Later: Pull on desktop
```

---

## 📱 Option 3: Web Editor (No Install)

Use **github.dev**:
1. Open browser on phone
2. Go to `https://github.dev/youngstunners88/Solomons-Chamber`
3. Edit files in browser-based VS Code
4. Commit directly to Git

**Pros:**
- No apps needed
- Full editor in browser

**Cons:**
- Needs internet
- Clunky on small screens

---

## 🔥 Recommended: The Quick Capture Setup

Since you're often on mobile when ideas strike, here's a minimal setup:

### Step 1: Simple Note App
Use your phone's built-in Notes app:
- Apple Notes → quick voice/text
- Google Keep → quick lists
- Simplest wins

### Step 2: Daily Sync
Every evening:
```
1. Review notes app
2. Open Solomons-Chamber on desktop
3. Manually transfer to proper location
4. Delete from notes app
5. Commit to Git
```

**Why this works:**
- Fast capture anywhere
- Proper organization later
- No complex mobile setup
- You process everything once per day

---

## 🎯 Mobile-First Vault Tips

### 1. Keep It Simple
On mobile, simpler wins:
```
05-Self-Notes/mobile-inbox.md    ← Everything goes here first
Later: process and move
```

### 2. Use Shortcuts
Set up Siri shortcuts (iOS):
```
"Hey Siri, quick note to vault"
→ Opens Notes app
→ Voice dictation
→ Later you transfer to vault
```

### 3. Voice First
Your phone is great for voice:
- Use Voice Memos app
- Save to Solomons-Chamber later
- Transcribe with scripts

### 4. Photo Notes
Screenshots, photos, captures:
- Save to Camera Roll
- Weekly: move to 06-Media/Photos/
- Tag and archive

---

## 📋 Mobile Workflow Examples

### Morning (5 min on phone)
```
1. Open 05-Self-Notes/daily/$(date +%Y-%m-%d).md
2. Add yesterday's reflection
3. Set today's focus
4. Save
```

### Midday (2 min)
```
1. Voice memo: "Buy BTC at 67k
2. Later: transcribe with script
3. Move to 03-Trading/signals/
```

### Evening (10 min)
```
1. Review mobile notes
2. Process inbox
3. Commit everything
4. Clear notes app
```

---

## 🛠️ Tech-Heavy Option: Termux

For Android power users:

```bash
# Install Termux
pkg update
pkg install git nodejs

# Setup Bun
npm install -g bun

# Clone
mkdir -p ~/storage/shared/Documents
bun git clone https://github.com/youngstunners88/Solomons-Chamber.git ~/storage/shared/Documents/Solomons-Chamber

# Run scripts from phone
bun 06-Media/Voice-Memos/capture.ts
```

**Why:** Full power. True mobile server.

---

## ✅ Mobile Setup Checklist

- [ ] Chosen sync method
- [ ] Installed required apps
- [ ] Cloned vault to device
- [ ] Verified you can edit
- [ ] Tested commit/push
- [ ] Created backup
- [ ] Tested offline use
- [ ] Set up voice capture
- [ ] Created mobile workflow
- [ ] Documented process

---

## ❓ FAQ

**Q: Can't I just use the GitHub app?**
A: You can view, but editing markdown on mobile GitHub app is painful.

**Q: What if I don't want to pay for Obsidian Sync?**
A: Use the Git client method. Free and full control.

**Q: Will my scripts work on mobile?**
A: Probably not. Mobile = capture only. Run scripts on desktop later.

**Q: Can I do trades from my phone?**
A: Yes, if your scripts run on API-only exchanges. Most require 2FA, so desktop is safer.

---

## 🎯 Bottom Line

**Best mobile experience:**
- Obsidian + Git plugin
- Or: Working Copy + iA Writer

**Easiest mobile capture:**
- Default Notes app
- Transfer later

**Full power on mobile:**
- Termux (Android only)