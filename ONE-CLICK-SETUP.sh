#!/bin/bash
# ONE-CLICK SETUP for Solomons Chamber
# Run: bash ONE-CLICK-SETUP.sh

set -e

echo "🚀 Solomon's Chamber - One-Click Setup"
echo "========================================"

# Check dependencies
if ! command -v git &> /dev/null; then
    echo "❌ Git required. Install: apt-get install git"
    exit 1
fi

# Clone if not already in repo
if [ ! -f "README.md" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/youngstunners88/Solomons-Chamber.git ~/.solomons-chamber
    cd ~/.solomons-chamber
fi

# Install Bun (fast JS runtime)
if ! command -v bun &> /dev/null; then
    echo "📦 Installing Bun runtime..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Create first note
echo "📝 Creating your first daily note..."
mkdir -p 05-Self-Notes/daily
cd 05-Self-Notes/daily
DATE=$(date +%Y-%m-%d)
cat > "${DATE}-first-thoughts.md" << NOTE
---
date: ${DATE}
tags: [first-note, welcome]
---

# Welcome to Solomon's Chamber

This is your first note. Write anything here.

## Quick Commands

- Create daily note: 
  \`bun scripts/daily-note.ts\`

- Capture voice memo:
  \`bun scripts/voice-capture.ts\`

- Check vault status:
  \`bun scripts/status.ts\`

## What Now?

1. Explore the folders
2. Write in 05-Self-Notes/daily/
3. Run \`bun scripts/daily-note.ts\` tomorrow

That's it. Simple.
---
Created: $(date)
NOTE

cd ../..

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📍 Your vault: $(pwd)"
echo "📝 First note: 05-Self-Notes/daily/${DATE}-first-thoughts.md"
echo ""
echo "🚀 Next steps:"
echo "   cd 05-Self-Notes/daily"
echo "   cat ${DATE}-first-thoughts.md"
echo ""
echo "💡 Or open in your favorite editor:"
echo "   code .  # VS Code"
echo "   obsidian .  # Obsidian"
echo "   vim 05-Self-Notes/daily/${DATE}-first-thoughts.md"
echo ""
echo "🔗 Full guide: https://github.com/youngstunners88/Solomons-Chamber"
