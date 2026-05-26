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
#   MAINTENANCE_MODE=1 in .env.production — full-site /maintenance redirect (optional).
#   MAINTENANCE_BANNER=0 — hide the white top maintenance bar (default: shown).
#
# .env.production on the VPS is NEVER deleted by this script: it is gitignored, excluded from
# `git clean`, backed up before sync, and restored if missing after reset/clean. Do not use
# `git clean -fdx` manually (that removes ignored files). Prefer this script over a manual
# `git reset --hard` before deploy — the script already resets to origin.
#
# PM2 user: always run deploy as the SAME user that owns PM2 (root *or* admin — never mix).
# Root on Hestia (repo owned by admin): script auto-runs `git config --global --add safe.directory`.
# Examples:
#   Prod (root PM2):  cd .../app.fparmychapters.com/public_html && bash scripts/deploy-from-github.sh
#   Dev (root PM2):   cd .../dev.fparmychapters.com/public_html && GIT_BRANCH=dev PM2_APP_NAME=dev-fparmychapters APP_PORT=3001 bash scripts/deploy-from-github.sh
#   Dev (admin PM2):  sudo -u admin bash -lc 'cd .../dev.../public_html && GIT_BRANCH=dev PM2_APP_NAME=dev-fparmychapters APP_PORT=3001 bash scripts/deploy-from-github.sh'
#
# Two apps on one host: ports are pinned in ecosystem.config.cjs + scripts/pm2-next-start.sh.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH="${GIT_BRANCH:-main}"
PM2_NAME="${PM2_APP_NAME:-app-fparmychapters}"
APP_PORT="${APP_PORT:-3000}"
export PORT="${APP_PORT}"

ENV_FILE=".env.production"
ENV_BACKUP=""
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

# Root deploy on Hestia clones owned by `admin` triggers git "dubious ownership".
ensure_git_safe_directory() {
  if git status >/dev/null 2>&1; then
    return 0
  fi
  echo "[deploy] git blocked (dubious ownership?) — adding safe.directory for: $ROOT"
  git config --global --add safe.directory "$ROOT" 2>/dev/null || true
  if git status >/dev/null 2>&1; then
    echo "[deploy] OK: git safe.directory configured for this clone"
    return 0
  fi
  echo "[deploy] ERROR: git still blocked. Run as repo owner or:" >&2
  echo "  git config --global --add safe.directory $ROOT" >&2
  exit 1
}

port_holders() {
  ss -ltnp 2>/dev/null | awk -v p=":${APP_PORT}" '$4 ~ p { print $0 }'
}

port_in_use() {
  ss -ltnp 2>/dev/null | grep -q ":${APP_PORT} "
}

free_listen_port() {
  local port="$1"
  echo "[deploy] Freeing port ${port} (listeners before):"
  ss -ltnp 2>/dev/null | awk -v p=":${port}" '$4 ~ p { print $0 }' || true

  if [[ -x scripts/free-next-host-ports.sh ]] || [[ -f scripts/free-next-host-ports.sh ]]; then
    bash scripts/free-next-host-ports.sh "$port" || true
  elif command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
    sleep 2
  fi

  if ss -ltnp 2>/dev/null | awk -v p=":${port}" '$4 ~ p { exit 0 } END { exit 1 }'; then
    if command -v sudo >/dev/null 2>&1; then
      echo "[deploy] Port ${port} still busy — trying sudo fuser (orphaned next-server)..."
      sudo fuser -k "${port}/tcp" 2>/dev/null || true
      sleep 2
    fi
  fi

  if ss -ltnp 2>/dev/null | awk -v p=":${port}" '$4 ~ p { exit 0 } END { exit 1 }'; then
    echo "[deploy] WARNING: Port ${port} still in use — killing PIDs from ss..." >&2
    ss -ltnp 2>/dev/null | awk -v p=":${port}" '$4 ~ p {
      while (match($0, /pid=([0-9]+)/, a)) { system("kill -9 " a[1] " 2>/dev/null"); $0=substr($0, RSTART+RLENGTH) }
    }' || true
    sleep 2
  fi

  if ss -ltnp 2>/dev/null | awk -v p=":${port}" '$4 ~ p { exit 0 } END { exit 1 }'; then
    echo "[deploy] ERROR: Port ${port} is still in use. Run: sudo bash scripts/free-next-host-ports.sh ${port}" >&2
    ss -ltnp 2>/dev/null | awk -v p=":${port}" '$4 ~ p { print $0 }' || true
    return 1
  fi
  echo "[deploy] OK: port ${port} is free"
}

start_pm2_app() {
  local name="$1"
  local port="$2"

  if ! command -v pm2 >/dev/null 2>&1; then
    echo "[deploy] pm2 not found — start the app manually on port ${port}." >&2
    return 0
  fi

  echo "[deploy] PM2 recycle: ${name} on port ${port} (user: $(whoami))"

  pm2 stop "$name" 2>/dev/null || true
  pm2 delete "$name" 2>/dev/null || true
  free_listen_port "$port"

  if [[ -f ecosystem.config.cjs ]]; then
    echo "[deploy] pm2 start ecosystem.config.cjs --only ${name}"
    NODE_ENV=production pm2 start ecosystem.config.cjs --only "$name"
  else
    echo "[deploy] pm2 start scripts/pm2-next-start.sh ${port}"
    NODE_ENV=production pm2 start scripts/pm2-next-start.sh --name "$name" --interpreter bash -- "$port"
  fi

  pm2 save
  echo "[deploy] PM2 saved process list"

  sleep 3
  if ! port_in_use; then
    echo "[deploy] ERROR: Nothing listening on ${port} after PM2 start." >&2
    pm2 logs "$name" --lines 40 --nostream 2>/dev/null || true
    return 1
  fi

  echo "[deploy] OK: ${name} listening on ${port}"
  ss -ltnp 2>/dev/null | awk -v p=":${port}" '$4 ~ p { print $0 }' || true
}

if [[ "${SKIP_DEPLOY_ENV_WARN:-}" != "1" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "[deploy] WARNING: ${ENV_FILE} not found in $(pwd). next build/next start expect Supabase vars there (or export them before this script)." >&2
  fi
fi

echo "[deploy] $(pwd) branch=$BRANCH PORT=$PORT pm2=$PM2_NAME user=$(whoami)"

ensure_git_safe_directory
warn_if_env_tracked
backup_env_files

if [[ "${SKIP_PM2:-}" != "1" ]] && command -v pm2 >/dev/null 2>&1; then
  pm2 stop "$PM2_NAME" 2>/dev/null || true
  sleep 2
fi

git fetch origin

if [[ "${DEPLOY_SOFT_PULL:-}" == "1" ]]; then
  git pull origin "$BRANCH"
else
  git reset --hard "origin/${BRANCH}"
  git clean -fd -e .env.production -e .env.local -e .env
fi

restore_env_files

npm ci
npm run build

test -f .next/BUILD_ID && echo "[deploy] BUILD OK"

if [[ "${SKIP_PM2:-}" != "1" ]]; then
  start_pm2_app "$PM2_NAME" "$APP_PORT"
else
  echo "[deploy] SKIP_PM2=1 — restart your app manually."
fi
