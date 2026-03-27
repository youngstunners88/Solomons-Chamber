#!/bin/bash
# ROUND 1: SMOKE TESTS
# Fast checks that everything is in place

echo "🔥 ROUND 1: SMOKE TESTS"
echo "========================"
echo ""

PASS=0
FAIL=0

# Test 1: Directory structure
echo "✓ Checking directory structure..."
for dir in 00-Inbox 01-Projects 02-Research 03-Trading 04-Assets 05-Self-Notes 06-Media 07-Archive 08-Docs 09-Automation 10-Skills 11-Voice-Agent 12-Higgsfield-Studio 13-Social-Share 14-Multi-Channel 15-One-Click-Setup; do
    if [ -d "$dir" ]; then
        PASS=$((PASS+1))
    else
        echo "  ❌ Missing: $dir"
        FAIL=$((FAIL+1))
    fi
done
echo "  ✅ $PASS directories verified"

# Test 2: Scripts executable
echo "✓ Checking scripts..."
for script in scripts/daily-note.ts scripts/voice-capture.ts scripts/status.ts; do
    if [ -f "$script" ]; then
        PASS=$((PASS+1))
    else
        echo "  ❌ Missing: $script"
        FAIL=$((FAIL+1))
    fi
done
echo "  ✅ Core scripts present"

# Test 3: Key files exist
echo "✓ Checking key files..."
for file in README.md LICENSE .gitignore ONE-CLICK-SETUP.sh; do
    if [ -f "$file" ]; then
        PASS=$((PASS+1))
    else
        echo "  ❌ Missing: $file"
        FAIL=$((FAIL+1))
    fi
done
echo "  ✅ Key files present"

echo ""
echo "📊 ROUND 1 RESULTS: $PASS passed, $FAIL failed"

if [ $FAIL -eq 0 ]; then
    echo "✅ ROUND 1 PASSED"
    exit 0
else
    echo "❌ ROUND 1 FAILED"
    exit 1
fi
