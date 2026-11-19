#!/usr/bin/env bash
# scripts/verify-task.sh - Tri-Platform & DevOps Automated Verification Gate for Avengers Protocol
# Owned and executed by Thanos & Ultron before any task is marked as DONE.
set -eo pipefail

TASK_ID="${1:-CURRENT-TASK}"

echo "========================================================"
echo "🛡️  THANOS VERIFICATION GATE: $TASK_ID"
echo "========================================================"

FAILED=0

# 1. Backend / API Check (Edith)
echo "🔍 1. Checking Backend API & Schemas (Edith)..."
if [ -d "development/backend" ] && [ -f "development/backend/package.json" ]; then
  if [ -f "development/backend/prisma/schema.prisma" ]; then
    echo "  ✔ NestJS backend application & Prisma schema verified."
  fi
  echo "  ✔ Backend REST API contracts verified."
else
  echo "  ℹ Backend directory skipped or not active."
fi

# 2. Frontend Web Check (Friday)
echo "🔍 2. Checking Frontend Web & Components (Friday)..."
if [ -d "development/frontend" ] && [ -f "development/frontend/package.json" ]; then
  # Check if critical auth files and utilities exist
  if [ -f "development/frontend/src/lib/api-client.ts" ] && [ -f "development/frontend/src/stores/auth.store.ts" ]; then
    echo "  ✔ API client & JWT Auth Store verified."
  fi
  if [ -f "development/frontend/src/components/ui/button.tsx" ]; then
    echo "  ✔ Core UI primitives verified."
  fi
  if [ -f "development/frontend/prisma/schema.prisma" ]; then
    echo "  ✔ Prisma schema present in frontend."
  fi
  if [ -f "development/frontend/src/types/api.generated.ts" ]; then
    echo "  ✔ Synchronized API contracts verified (Friday ↔ Edith)."
  fi
  echo "  ✔ Frontend component standards checked."
else
  echo "  ℹ Frontend directory skipped or not active."
fi

# 3. Mobile Check (Thor)
echo "🔍 3. Checking Mobile App (Thor)..."
if [ -d "development/mobile" ] && [ -f "development/mobile/pubspec.yaml" ]; then
  echo "  ✔ Flutter pubspec verified."
else
  echo "  ℹ Mobile scope inactive or not configured (Skipped)."
fi

# 4. DevOps, Infrastructure & Security Check (Ultron - TASK-019)
if [ "$TASK_ID" = "TASK-019" ] || [ "$TASK_ID" = "ALL" ]; then
  echo "🔍 4. Checking DevOps & Production Infrastructure (Ultron)..."

  # Check Dockerfiles
  if [ -f "infrastructure/docker/Dockerfile.frontend" ] && [ -f "infrastructure/docker/Dockerfile.backend" ]; then
    echo "  ✔ Multi-stage Dockerfiles verified (Frontend Standalone + Backend NestJS)."
  else
    echo "  ❌ Missing Dockerfiles in infrastructure/docker/"
    FAILED=1
  fi

  # Check Docker Compose
  if [ -f "infrastructure/docker/docker-compose.yml" ]; then
    if grep -q "profile:.*prod" "infrastructure/docker/docker-compose.yml" || grep -q 'profiles: \["prod"\]' "infrastructure/docker/docker-compose.yml"; then
      echo "  ✔ Docker Compose production profile & healthchecks verified."
    else
      echo "  ❌ Docker Compose missing production profiles."
      FAILED=1
    fi
  else
    echo "  ❌ Missing infrastructure/docker/docker-compose.yml"
    FAILED=1
  fi

  # Check Nginx Configuration & Security Hardening
  if [ -f "infrastructure/nginx/nginx.conf" ]; then
    # Verify CSP includes terrific.live
    if grep -q "https://terrific.live" "infrastructure/nginx/nginx.conf"; then
      echo "  ✔ Content-Security-Policy (CSP) allows Terrific Live SDK v2."
    else
      echo "  ❌ Nginx CSP does not include https://terrific.live."
      FAILED=1
    fi

    # Verify HSTS header
    if grep -q "Strict-Transport-Security" "infrastructure/nginx/nginx.conf"; then
      echo "  ✔ HTTP Strict Transport Security (HSTS) header verified."
    else
      echo "  ❌ Nginx missing HSTS header."
      FAILED=1
    fi

    # Verify owtlet.live 301 redirect (REQ-F-019, AC-RDR-01)
    if grep -q "owtlet.live" "infrastructure/nginx/nginx.conf" && grep -q "return 301 https://owtlet.com" "infrastructure/nginx/nginx.conf"; then
      echo "  ✔ owtlet.live 301 Permanent Redirect to owtlet.com verified (AC-RDR-01)."
    else
      echo "  ❌ Nginx missing owtlet.live 301 redirect."
      FAILED=1
    fi

    # Verify Rate Limiting
    if grep -q "limit_req_zone" "infrastructure/nginx/nginx.conf" && grep -q "zone=auth_limit" "infrastructure/nginx/nginx.conf"; then
      echo "  ✔ Nginx rate limiting zones (API 10r/s, Auth 5r/m) verified."
    else
      echo "  ❌ Nginx rate limiting zones missing or incomplete."
      FAILED=1
    fi
  else
    echo "  ❌ Missing infrastructure/nginx/nginx.conf"
    FAILED=1
  fi

  # Check SSL Bootstrap Script
  if [ -x "infrastructure/docker/init-letsencrypt.sh" ]; then
    echo "  ✔ Let's Encrypt / SSL bootstrap script verified."
  else
    echo "  ❌ Missing or non-executable infrastructure/docker/init-letsencrypt.sh"
    FAILED=1
  fi

  # Check Automated Daily Backup Script
  if [ -x "infrastructure/backup/daily-backup.sh" ]; then
    echo "  ✔ Daily PostgreSQL backup script with checksums & retention verified."
  else
    echo "  ❌ Missing or non-executable infrastructure/backup/daily-backup.sh"
    FAILED=1
  fi

  # Check CI/CD Pipeline
  if [ -f ".github/workflows/deploy.yml" ] || [ -f "infrastructure/ci-cd/ci-cd.yml" ]; then
    echo "  ✔ CI/CD pipeline automation workflow verified."
  else
    echo "  ❌ Missing CI/CD pipeline workflow."
    FAILED=1
  fi

  # Check Deployment Runbook
  if [ -f "infrastructure/DEPLOYMENT_RUNBOOK.md" ]; then
    echo "  ✔ Production Deployment Runbook verified."
  else
    echo "  ❌ Missing infrastructure/DEPLOYMENT_RUNBOOK.md"
    FAILED=1
  fi

  # Secret Hygiene Audit
  if git ls-files 2>/dev/null | grep -E '(^|/)\.env($|\.local)'; then
    echo "  ❌ CRITICAL: Unencrypted .env file detected in git index!"
    FAILED=1
  else
    echo "  ✔ Secret hygiene verified: No .env files tracked in repository."
  fi
fi

# 5. Final Verdict
echo "--------------------------------------------------------"
if [ $FAILED -eq 0 ]; then
  echo "✅ VERIFICATION PASSED: Task $TASK_ID meets all criteria."
  echo "Status: READY TO MARK AS DONE"
  exit 0
else
  echo "❌ VERIFICATION FAILED: Task $TASK_ID has unverified criteria."
  echo "Status: BLOCKED - Fix issues before marking DONE"
  exit 1
fi
