#!/usr/bin/env bash
# Run on the VPS from the repo root (or any cwd; script cd's to project root).
# Usage: bash scripts/deploy-from-github.sh
# Env: GIT_BRANCH (default main), PM2_APP_NAME (default flashpoint-dashboard), SKIP_PM2=1 to skip restart

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH="${GIT_BRANCH:-main}"
PM2_NAME="${PM2_APP_NAME:-flashpoint-dashboard}"

echo "[deploy] $(pwd) branch=$BRANCH"

if [[ "${SKIP_PM2:-}" != "1" ]] && command -v pm2 >/dev/null 2>&1; then
  pm2 stop "$PM2_NAME" 2>/dev/null || true
fi

git fetch origin
git pull origin "$BRANCH"

npm ci
npm run build

test -f .next/BUILD_ID && echo "[deploy] BUILD OK"

if [[ "${SKIP_PM2:-}" != "1" ]] && command -v pm2 >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME"
  echo "[deploy] PM2 restarted: $PM2_NAME"
else
  echo "[deploy] SKIP_PM2=1 or pm2 not found — restart your app manually."
fi
