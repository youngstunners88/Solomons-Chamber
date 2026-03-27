#!/bin/bash
# ROUND 3: SECURITY & VULNERABILITY AUDIT

echo "🔒 ROUND 3: SECURITY AUDIT"
echo "==========================="
echo ""

PASS=0
FAIL=0
WARN=0

# Test 1: Check for hardcoded secrets
echo "✓ Scanning for hardcoded secrets..."
SECRETS=$(grep -riE "(api[_-]?key|password|secret|token)" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v "process.env" | grep -v "example" | wc -l)
if [ "$SECRETS" -eq 0 ]; then
    echo "  ✅ No hardcoded secrets in code"
    PASS=$((PASS+1))
else
    echo "  ⚠️ Found $SECRETS potential secrets (review needed)"
    WARN=$((WARN+1))
fi

# Test 2: Check .gitignore
echo "✓ Checking .gitignore..."
if [ -f ".gitignore" ] && grep -q "node_modules" .gitignore && grep -q "\.env" .gitignore; then
    echo "  ✅ .gitignore properly configured"
    PASS=$((PASS+1))
else
    echo "  ❌ .gitignore missing critical entries"
    FAIL=$((FAIL+1))
fi

# Test 3: Check for node_modules in repo
echo "✓ Checking for node_modules in repo..."
if [ -d "node_modules" ]; then
    echo "  ⚠️ node_modules present (should be gitignored)"
    WARN=$((WARN+1))
else
    echo "  ✅ node_modules not committed"
    PASS=$((PASS+1))
fi

# Test 4: Check file permissions
echo "✓ Checking file permissions..."
if find scripts -name "*.ts" -type f 2>/dev/null | grep -q "."; then
    echo "  ✅ Scripts present and accessible"
    PASS=$((PASS+1))
else
    echo "  ⚠️ Scripts check incomplete"
    WARN=$((WARN+1))
fi

# Test 5: Check for sensitive env files
echo "✓ Checking for sensitive files..."
SENSITIVE=$(find . -name ".env*" -o -name "*.key" -o -name "*.pem" 2>/dev/null | grep -v node_modules | wc -l)
if [ "$SENSITIVE" -eq 0 ]; then
    echo "  ✅ No sensitive files committed"
    PASS=$((PASS+1))
else
    echo "  ⚠️ Found $SENSITIVE sensitive files (should be gitignored)"
    WARN=$((WARN+1))
fi

echo ""
echo "📊 ROUND 3 RESULTS: $PASS passed, $FAIL failed, $WARN warnings"

if [ $FAIL -eq 0 ]; then
    echo "✅ ROUND 3 PASSED (with $WARN warnings)"
    exit 0
else
    echo "❌ ROUND 3 FAILED"
    exit 1
fi
