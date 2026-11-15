#!/usr/bin/env bash
# scripts/sync-contracts.sh - Automated Contract Sync for Avengers Protocol
set -eo pipefail

node "$(dirname "$0")/sync-contracts.js" "$@"

