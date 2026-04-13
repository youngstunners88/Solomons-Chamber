#!/bin/bash
# 🚨 MANDATORY PREFLIGHT CHECK 🚨
# Run this at the start of EVERY session before doing ANY work

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🚨 MANDATORY STARTUP CHECK - DO NOT SKIP 🚨             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# Check 1: Did we read CLAUDE.md?
echo -e "${YELLOW}[CHECK 1]${NC} Did you READ Solomons-Chamber/CLAUDE.md? (yes/no)"
read -r response
if [[ ! "$response" =~ ^[Yy] ]]; then
    echo -e "${RED}❌ FAILED: You MUST read CLAUDE.md before doing anything${NC}"
    echo "   Run: cat Solomons-Chamber/CLAUDE.md"
    FAILED=1
else
    echo -e "${GREEN}✅ PASSED${NC}"
fi
echo ""

# Check 2: Check Solomon's Chamber for previous work
echo -e "${YELLOW}[CHECK 2]${NC} Checking Solomon's Chamber for active tasks..."
CURRENT_DIR="/home/teacherchris37/Solomons-Chamber/09-Agent-Sessions/current"
if [ -d "$CURRENT_DIR" ]; then
    ACTIVE_TASKS=$(ls -1 "$CURRENT_DIR"/*.md 2>/dev/null | wc -l)
    if [ "$ACTIVE_TASKS" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Found $ACTIVE_TASKS active task(s):${NC}"
        ls -1 "$CURRENT_DIR"/*.md | xargs -n1 basename
        echo ""
        echo -e "${YELLOW}Did you review these tasks? (yes/no)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy] ]]; then
            echo -e "${RED}❌ FAILED: Review active tasks before proceeding${NC}"
            FAILED=1
        fi
    else
        echo -e "${GREEN}✅ No active tasks found${NC}"
    fi
else
    echo -e "${RED}❌ FAILED: Solomon's Chamber directory not found${NC}"
    FAILED=1
fi
echo ""

# Check 3: Check YBTM workspace state
echo -e "${YELLOW}[CHECK 3]${NC} Checking Mr. Garcia's website state..."
if [ -f "/home/teacherchris37/youbecamethemoney/.workspace-state.json" ]; then
    echo -e "${GREEN}✅ YBTM workspace state found${NC}"
    cat /home/teacherchris37/youbecamethemoney/.workspace-state.json | grep -E '"status"|"project"'
else
    echo -e "${YELLOW}⚠️  YBTM workspace state not found${NC}"
fi
echo ""

# Check 4: Create task log for current work
echo -e "${YELLOW}[CHECK 4]${NC} Creating task log for this session..."
cd /home/teacherchris37/Solomons-Chamber
node 09-Agent-Sessions/session-logger.js init 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Session logger initialized${NC}"
else
    echo -e "${YELLOW}⚠️  Could not initialize session logger${NC}"
fi
echo ""

# Final result
echo "═══════════════════════════════════════════════════════════════"
if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED - You may proceed${NC}"
    echo "═══════════════════════════════════════════════════════════════"
    exit 0
else
    echo -e "${RED}❌ CHECKS FAILED - Fix issues before proceeding${NC}"
    echo "═══════════════════════════════════════════════════════════════"
    exit 1
fi
