#!/usr/bin/env bash
# Run on the VPS from the repo root (or any cwd; script cd's to project root).
# Usage: bash scripts/deploy-from-github.sh
# Env: GIT_BRANCH (default main), PM2_APP_NAME (default app-fparmychapters),
#      APP_PORT (default 3000), SKIP_PM2=1 to skip restart

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH="${GIT_BRANCH:-main}"
PM2_NAME="${PM2_APP_NAME:-app-fparmychapters}"
APP_PORT="${APP_PORT:-3000}"

echo "[deploy] $(pwd) branch=$BRANCH"

port_holders() {
  ss -ltnp 2>/dev/null | awk -v p=":${APP_PORT}" '$4 ~ p { print $0 }'
}

if [[ "${SKIP_PM2:-}" != "1" ]] && command -v pm2 >/dev/null 2>&1; then
  pm2 stop "$PM2_NAME" 2>/dev/null || true
fi

git fetch origin
git pull origin "$BRANCH"

npm ci
npm run build

test -f .next/BUILD_ID && echo "[deploy] BUILD OK"

if [[ "${SKIP_PM2:-}" != "1" ]] && command -v pm2 >/dev/null 2>&1; then
  # If another process is still binding APP_PORT, clear it before starting.
  if [[ -n "$(port_holders)" ]]; then
    echo "[deploy] Port ${APP_PORT} in use before PM2 start/restart:"
    port_holders || true
    if command -v fuser >/dev/null 2>&1; then
      echo "[deploy] Killing process on ${APP_PORT}/tcp via fuser..."
      fuser -k "${APP_PORT}/tcp" || true
      sleep 1
    fi
  fi

  if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
    pm2 restart "$PM2_NAME"
    echo "[deploy] PM2 restarted: $PM2_NAME"
  else
    pm2 start npm --name "$PM2_NAME" -- start
    echo "[deploy] PM2 started: $PM2_NAME"
  fi
else
  echo "[deploy] SKIP_PM2=1 or pm2 not found — restart your app manually."
fi
