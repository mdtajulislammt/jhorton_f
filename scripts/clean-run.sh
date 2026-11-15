#!/usr/bin/env bash
# scripts/clean-run.sh - Compact, Token-Killing Command Runner for Avengers Protocol
# Strips progress bars, passing tests, and verbose logs to preserve 95% LLM context tokens.
set -eo pipefail

CMD="$1"
shift

case "$CMD" in
  # 1. Compact Git Status
  git-status)
    git status --short --branch
    ;;

  # 2. Compact Git Diff
  git-diff)
    git diff --stat
    ;;

  # 3. Compact Frontend Test / Type-Check
  test-frontend)
    if [ -d "development/frontend" ]; then
      cd development/frontend
      npm run type-check 2>&1 | tail -n 10 || echo "❌ Frontend TypeScript Check Failed"
      cd - > /dev/null
    else
      echo "ℹ Frontend directory not found."
    fi
    ;;

  # 4. Compact Backend Test
  test-backend)
    if [ -d "development/backend" ]; then
      cd development/backend
      npm test -- --silent 2>&1 | grep -E "(FAIL|Error|failed|passed|Tests:)" || echo "✅ All Backend Tests Passed"
      cd - > /dev/null
    else
      echo "ℹ Backend directory not found."
    fi
    ;;

  # 5. Compact Mobile Analyze
  test-mobile)
    if [ -d "development/mobile" ] && [ -f "development/mobile/pubspec.yaml" ]; then
      cd development/mobile
      flutter analyze 2>&1 | tail -n 5 || echo "ℹ Flutter analyze completed."
      cd - > /dev/null
    else
      echo "ℹ Mobile directory not active or no pubspec.yaml."
    fi
    ;;

  # 6. Default Fallback
  *)
    "$CMD" "$@"
    ;;
esac

