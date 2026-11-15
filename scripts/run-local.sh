#!/usr/bin/env bash
# scripts/run-local.sh - Quick Local Runner for Avengers Protocol Full-Stack Application
# Allows easy, one-command launching of Frontend, Backend, or Full-Stack services.
set -eo pipefail

TARGET="${1:-all}"

echo "========================================================"
echo "🛡️  AVENGERS LOCAL RUNNER: $TARGET"
echo "========================================================"

case "$TARGET" in
  frontend)
    echo "🚀 Starting Frontend Web application (Next.js)..."
    echo "🌐 URL: http://localhost:3000"
    if [ -d "development/frontend" ]; then
      cd development/frontend
      npm run dev
    else
      echo "❌ Directory development/frontend not found."
      exit 1
    fi
    ;;

  backend)
    echo "⚙️ Starting Backend API service (NestJS/Node.js)..."
    echo "🌐 API URL: http://localhost:4000/api"
    echo "📚 Swagger Docs: http://localhost:4000/api/docs"
    if [ -d "development/backend" ]; then
      cd development/backend
      npm run start:dev 2>/dev/null || npm run dev 2>/dev/null || npm start
    else
      echo "ℹ️  Owtlet has no separate backend — the API is /api/* inside the Next.js app (ADR-015)."
      echo "   Run: bash scripts/run-local.sh frontend"
      exit 0
    fi
    ;;

  all)
    echo "🚀 Launching Full-Stack Services..."
    echo "--------------------------------------------------------"
    echo "  📱 Frontend: http://localhost:3000"
    echo "  ⚙️ API:      http://localhost:3000/api (same Next.js app)"
    echo "--------------------------------------------------------"
    echo ""
    echo "Starting Frontend in this terminal (Ctrl+C to stop)..."
    if [ -d "development/frontend" ]; then
      cd development/frontend
      npm run dev
    fi
    ;;

  *)
    echo "Usage: bash scripts/run-local.sh [frontend|backend|all]"
    exit 1
    ;;
esac

