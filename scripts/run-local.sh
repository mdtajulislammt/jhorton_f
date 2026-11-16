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
      pnpm dev
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
      pnpm dev || pnpm start:dev
    else
      echo "❌ Directory development/backend not found."
      exit 1
    fi
    ;;

  all)
    echo "🚀 Launching Full-Stack Services..."
    echo "--------------------------------------------------------"
    echo "  📱 Frontend: http://localhost:3000"
    echo "  ⚙️ Backend:  http://localhost:4000/api"
    echo "  📚 Swagger:  http://localhost:4000/api/docs"
    echo "--------------------------------------------------------"
    echo ""
    echo "To run both services side-by-side in separate terminals:"
    echo "  Terminal 1: bash scripts/run-local.sh backend"
    echo "  Terminal 2: bash scripts/run-local.sh frontend"
    echo ""
    echo "Starting Backend now..."
    if [ -d "development/backend" ]; then
      cd development/backend
      pnpm dev
    fi
    ;;

  *)
    echo "Usage: bash scripts/run-local.sh [frontend|backend|all]"
    exit 1
    ;;
esac
