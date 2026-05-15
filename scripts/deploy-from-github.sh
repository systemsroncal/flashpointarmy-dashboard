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
# .env.production on the VPS is NEVER deleted by this script: it is gitignored, excluded from
# `git clean`, backed up before sync, and restored if missing after reset/clean. Do not use
# `git clean -fdx` manually (that removes ignored files). Prefer this script over a manual
# `git reset --hard` before deploy — the script already resets to origin.
#
# Examples (Hestia: run as the shell user that owns the site, from the clone directory):
#   Producción:  bash scripts/deploy-from-github.sh
#   Dev:         GIT_BRANCH=dev PM2_APP_NAME=dev-fparmychapters APP_PORT=3001 bash scripts/deploy-from-github.sh
#
# Two apps on one host: pin PORT (see ecosystem.config.cjs in repo root) so prod never shares 3000 with dev.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH="${GIT_BRANCH:-main}"
PM2_NAME="${PM2_APP_NAME:-app-fparmychapters}"
APP_PORT="${APP_PORT:-3000}"
export PORT="${APP_PORT}"

ENV_FILE=".env.production"
ENV_BACKUP=""
# Also protect optional local overrides if present on the host (never in git).
EXTRA_ENV_FILES=(".env.local")

backup_env_files() {
  if [[ -f "$ENV_FILE" ]]; then
    ENV_BACKUP="$(mktemp)"
    cp -a "$ENV_FILE" "$ENV_BACKUP"
    echo "[deploy] Backed up ${ENV_FILE} ($(wc -c < "$ENV_FILE" | tr -d ' ') bytes)"
  fi
  for f in "${EXTRA_ENV_FILES[@]}"; do
    if [[ -f "$f" ]]; then
      echo "[deploy] Keeping ${f} (gitignored; not touched by git sync)"
    fi
  done
}

restore_env_files() {
  if [[ -n "$ENV_BACKUP" && -f "$ENV_BACKUP" ]]; then
    if [[ ! -f "$ENV_FILE" ]]; then
      cp -a "$ENV_BACKUP" "$ENV_FILE"
      echo "[deploy] Restored ${ENV_FILE} (was missing after git sync)"
    elif ! cmp -s "$ENV_FILE" "$ENV_BACKUP"; then
      cp -a "$ENV_BACKUP" "$ENV_FILE"
      echo "[deploy] Restored ${ENV_FILE} from pre-deploy backup (file had changed during sync)"
    fi
    rm -f "$ENV_BACKUP"
    ENV_BACKUP=""
  fi
  if [[ -f "$ENV_FILE" ]]; then
    echo "[deploy] OK: ${ENV_FILE} present ($(wc -c < "$ENV_FILE" | tr -d ' ') bytes)"
  elif [[ "${SKIP_DEPLOY_ENV_WARN:-}" != "1" ]]; then
    echo "[deploy] WARNING: ${ENV_FILE} not found in $(pwd). next build expects Supabase vars there (or export them before this script)." >&2
  fi
}

warn_if_env_tracked() {
  if git ls-files --error-unmatch "$ENV_FILE" >/dev/null 2>&1; then
    echo "[deploy] WARNING: ${ENV_FILE} is tracked in git — secrets may be overwritten by reset. Remove it from the repo and keep it only on the VPS." >&2
  fi
}

if [[ "${SKIP_DEPLOY_ENV_WARN:-}" != "1" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "[deploy] WARNING: ${ENV_FILE} not found in $(pwd). next build/next start expect Supabase vars there (or export them before this script)." >&2
  fi
fi

echo "[deploy] $(pwd) branch=$BRANCH PORT=$PORT pm2=$PM2_NAME"

warn_if_env_tracked
backup_env_files

port_holders() {
  ss -ltnp 2>/dev/null | awk -v p=":${APP_PORT}" '$4 ~ p { print $0 }'
}

if [[ "${SKIP_PM2:-}" != "1" ]] && command -v pm2 >/dev/null 2>&1; then
  pm2 stop "$PM2_NAME" 2>/dev/null || true
  # Let the old Node process release the TCP port (avoids EADDRINUSE on immediate restart).
  sleep 2
fi

git fetch origin

if [[ "${DEPLOY_SOFT_PULL:-}" == "1" ]]; then
  git pull origin "$BRANCH"
else
  # Match the remote exactly: avoids "untracked working tree files would be overwritten by merge"
  # (e.g. manual copies under public/). Ignored files (node_modules, .env.production) are kept.
  # Never use `git clean -fdx` — that deletes ignored env files on the VPS.
  git reset --hard "origin/${BRANCH}"
  git clean -fd -e .env.production -e .env.local -e .env
fi

# Always restore .env.production backup after any git sync (reset or pull).
restore_env_files

npm ci
npm run build

test -f .next/BUILD_ID && echo "[deploy] BUILD OK"

if [[ "${SKIP_PM2:-}" != "1" ]] && command -v pm2 >/dev/null 2>&1; then
  # Free APP_PORT before bind: `ss` can miss short-lived listeners; fuser clears stale Node/Next.
  echo "[deploy] Checking port ${APP_PORT} (listeners, if any):"
  port_holders || true
  if command -v fuser >/dev/null 2>&1; then
    echo "[deploy] Clearing any process on ${APP_PORT}/tcp (fuser)..."
    fuser -k "${APP_PORT}/tcp" 2>/dev/null || true
    sleep 2
  elif [[ -n "$(port_holders)" ]]; then
    echo "[deploy] ERROR: Port ${APP_PORT} is in use and fuser is not installed. Install package psmisc, or stop the other process manually." >&2
    exit 1
  fi

  echo "[deploy] PM2 will bind PORT=$PORT for process name: $PM2_NAME"

  if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
    PORT="$APP_PORT" NODE_ENV=production pm2 restart "$PM2_NAME" --update-env
    echo "[deploy] PM2 restarted: $PM2_NAME"
  else
    PORT="$APP_PORT" NODE_ENV=production pm2 start npm --name "$PM2_NAME" -- start
    echo "[deploy] PM2 started: $PM2_NAME"
  fi
else
  echo "[deploy] SKIP_PM2=1 or pm2 not found — restart your app manually."
fi
