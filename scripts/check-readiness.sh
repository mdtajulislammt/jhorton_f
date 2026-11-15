#!/usr/bin/env bash

# check-readiness.sh - Pre-Implementation Readiness Gate Checker (BMAD-Inspired)
# Usage: bash scripts/check-readiness.sh [TASK-ID]

set -euo pipefail

TASK_ID="${1:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}🛡️  AVENGERS PROTOCOL: PRE-IMPLEMENTATION READINESS GATE${NC}"
echo -e "${BLUE}=====================================================${NC}"

if [ -z "$TASK_ID" ]; then
  echo -e "${RED}[FAIL] Missing TASK-ID argument.${NC}"
  echo -e "Usage: bash scripts/check-readiness.sh TASK-XXX"
  exit 1
fi

TASK_FILE="planning/tasks/${TASK_ID}.md"
TASK_MAIN="planning/task.md"

# 1. Check if Task is defined
if [ ! -f "$TASK_FILE" ] && ! grep -q "$TASK_ID" "$TASK_MAIN" 2>/dev/null; then
  echo -e "${RED}[FAIL] Task $TASK_ID is neither found in planning/tasks/ nor in planning/task.md.${NC}"
  exit 1
fi

echo -e "Auditing Task Specification: ${YELLOW}${TASK_ID}${NC}..."
SCORE=0
MAX_SCORE=5

# Check 1: Target Files Specified
if [ -f "$TASK_FILE" ] && grep -qi "files" "$TASK_FILE"; then
  echo -e "  ${GREEN}✓ Check 1: Target file paths explicitly identified.${NC}"
  SCORE=$((SCORE + 1))
elif grep -qi "$TASK_ID" "$TASK_MAIN"; then
  echo -e "  ${GREEN}✓ Check 1: Task exists in planning/task.md.${NC}"
  SCORE=$((SCORE + 1))
else
  echo -e "  ${RED}✗ Check 1: Target files not documented.${NC}"
fi

# Check 2: Acceptance Criteria Defined
if ([ -f "$TASK_FILE" ] && grep -qi "acceptance" "$TASK_FILE") || grep -qi "done" "$TASK_MAIN"; then
  echo -e "  ${GREEN}✓ Check 2: Acceptance criteria defined.${NC}"
  SCORE=$((SCORE + 1))
else
  echo -e "  ${RED}✗ Check 2: Missing acceptance criteria.${NC}"
fi

# Check 3: Architecture Spine or Contract available
if [ -f "docs/architecture-spine.md" ] || [ -f "docs/08-api-contract.md" ]; then
  echo -e "  ${GREEN}✓ Check 3: Architecture spine/contracts available.${NC}"
  SCORE=$((SCORE + 1))
else
  echo -e "  ${YELLOW}⚠ Check 3: Architecture spine missing.${NC}"
fi

# Check 4: Domain Lexicon Available
if [ -f "docs/domain-lexicon.md" ]; then
  echo -e "  ${GREEN}✓ Check 4: Domain lexicon exists (Zero Dummy Text check).${NC}"
  SCORE=$((SCORE + 1))
else
  echo -e "  ${YELLOW}⚠ Check 4: Domain lexicon missing.${NC}"
fi

# Check 5: Assigned Agent Designated
if grep -qE "(friday|edith|thor|jarvis|thanos|loki|ultron|iron_man)" "$TASK_FILE" 2>/dev/null || grep -qE "(friday|edith|thor|jarvis|thanos|loki|ultron|iron_man)" "$TASK_MAIN" 2>/dev/null; then
  echo -e "  ${GREEN}✓ Check 5: Responsible specialist agent designated.${NC}"
  SCORE=$((SCORE + 1))
else
  echo -e "  ${RED}✗ Check 5: No specialist agent assigned.${NC}"
fi

echo -e "-----------------------------------------------------"
echo -e "Readiness Score: ${SCORE}/${MAX_SCORE}"

if [ "$SCORE" -ge 4 ]; then
  echo -e "${GREEN}>>> STATUS: [PASS] Task $TASK_ID is READY FOR DEVELOPMENT. <<<${NC}"
  exit 0
elif [ "$SCORE" -eq 3 ]; then
  echo -e "${YELLOW}>>> STATUS: [CONCERNS] Task $TASK_ID has minor gaps. Proceed with caution. <<<${NC}"
  exit 0
else
  echo -e "${RED}>>> STATUS: [FAIL] Task $TASK_ID is NOT READY. Complete planning specs before editing code! <<<${NC}"
  exit 1
fi

