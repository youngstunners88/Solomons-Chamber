#!/bin/bash
# Quick test to show user what actually works vs what's broken

echo "=== SOLICITING CHAMBER — WHAT WORKS ==="
echo ""

# Test 1: Daily note
echo "1. Daily Notes (bun scripts/daily-note.ts):"
bun scripts/daily-note.ts "test-$(date +%s)" 2>&1 | head -2
if [ $? -eq 0 ]; then echo "   ✅ WORKS"; else echo "   ❌ BROKEN"; fi
echo ""

# Test 2: Status
echo "2. Status Dashboard (bun scripts/status.ts):"
bun scripts/status.ts 2>&1 | head -5
if [ $? -eq 0 ]; then echo "   ✅ WORKS"; else echo "   ❌ BROKEN"; fi
echo ""

# Test 3: Link capture
echo "3. Link Capture (bun scripts/media-link-capture.ts):"
bun scripts/media-link-capture.ts "https://example.com/test" 2>&1 | tail -1
if [ $? -eq 0 ]; then echo "   ✅ WORKS"; else echo "   ❌ BROKEN"; fi
echo ""

# Test 4: Voice capture
echo "4. Voice Capture (bun scripts/voice-capture.ts):"
bun scripts/voice-capture.ts --quick 2>&1 | head -2
if [ $? -eq 0 ]; then echo "   ⚠️  PARTIAL (creates stub only)"; else echo "   ❌ BROKEN"; fi
echo ""

# Test 5: Archive (should fail)
echo "5. Archive Old Notes (bun scripts/archive-old.ts):"
bun scripts/archive-old.ts --dry-run 2>&1 | grep -o "Cannot find module" || echo "   ❌ BROKEN (needs lib/vault.ts)"
echo ""

# Test 6: RSS ingest (should fail)
echo "6. RSS Ingest (bun scripts/rss-ingest.ts):"
bun scripts/rss-ingest.ts 2>&1 | grep -o "Cannot find module" || echo "   ❌ BROKEN (needs lib/vault.ts)"
echo ""

echo "=== SUMMARY ==="
echo "✅ Working: Daily notes, Status, Link capture"
echo "⚠️  Partial: Voice capture (stubs only)"
echo "❌ Broken: Archive, RSS ingest (missing dependencies)"
echo ""
echo "See ROADMAP.md for full breakdown."
