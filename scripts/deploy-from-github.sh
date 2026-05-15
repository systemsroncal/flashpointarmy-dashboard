#!/usr/bin/env bash
# Run on the VPS from the repo root (or any cwd; script cd's to project root).
# Usage: bash scripts/deploy-from-github.sh
# Env:
#   GIT_BRANCH      — default main
#   PM2_APP_NAME    — default app-fparmychapters (use another name for dev, e.g. dev-fparmychapters)
#   APP_PORT        — default 3000 (Next.js reads PORT; dev on same host should use e.g. 3001)
#   SKIP_PM2=1      — skip stop/restart (only pull + build)
#   DEPLOY_SOFT_PULL=1 — use `git pull` only (fails if untracked files block merge). Default: reset to origin + clean.
#   SKIP_DEPLOY_ENV_WARN=1 — skip warning when .env.production is missing (e.g. vars injected elsewhere).
#
# Examples (Hestia: run as the shell user that owns the site, from the clone directory):
#   Producción:  bash scripts/deploy-from-github.sh
#   Dev:         GIT_BRANCH=main PM2_APP_NAME=dev-fparmychapters APP_PORT=3001 bash scripts/deploy-from-github.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH="${GIT_BRANCH:-main}"
PM2_NAME="${PM2_APP_NAME:-app-fparmychapters}"
APP_PORT="${APP_PORT:-3000}"
export PORT="${APP_PORT}"

if [[ "${SKIP_DEPLOY_ENV_WARN:-}" != "1" ]]; then
  if [[ ! -f .env.production ]]; then
    echo "[deploy] WARNING: .env.production not found in $(pwd). next build/next start expect Supabase vars there (or export them before this script)." >&2
  fi
fi

echo "[deploy] $(pwd) branch=$BRANCH PORT=$PORT pm2=$PM2_NAME"

port_holders() {
  ss -ltnp 2>/dev/null | awk -v p=":${APP_PORT}" '$4 ~ p { print $0 }'
}

if [[ "${SKIP_PM2:-}" != "1" ]] && command -v pm2 >/dev/null 2>&1; then
  pm2 stop "$PM2_NAME" 2>/dev/null || true
fi

git fetch origin

if [[ "${DEPLOY_SOFT_PULL:-}" == "1" ]]; then
  git pull origin "$BRANCH"
else
  # Match the remote exactly: avoids "untracked working tree files would be overwritten by merge"
  # (e.g. manual copies under public/). Ignored files (node_modules, .env*, .env.production) are kept.
  git reset --hard "origin/${BRANCH}"
  git clean -fd
fi

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
    pm2 restart "$PM2_NAME" --update-env
    echo "[deploy] PM2 restarted: $PM2_NAME"
  else
    pm2 start npm --name "$PM2_NAME" -- start
    echo "[deploy] PM2 started: $PM2_NAME"
  fi
else
  echo "[deploy] SKIP_PM2=1 or pm2 not found — restart your app manually."
fi
