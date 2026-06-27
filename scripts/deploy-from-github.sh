#!/usr/bin/env bash
# Run on the VPS from the repo root (or any cwd; script cd's to project root).
#
# ROUTINE DEPLOY (Hestia VPS, as root):
#
#   Production (main, no env vars):
#     cd /home/admin/web/app.fparmychapters.com/public_html
#     bash scripts/deploy-from-github.sh
#
#   Dev (set branch, PM2 name, and port):
#     cd /home/admin/web/dev.fparmychapters.com/public_html
#     GIT_BRANCH=dev PM2_APP_NAME=dev-fparmychapters APP_PORT=3001 bash scripts/deploy-from-github.sh
#
# Optional env:
#   SKIP_PM2=1           — pull + build only (no PM2 restart)
#   DEPLOY_SOFT_PULL=1   — git pull instead of reset --hard
#   SKIP_DEPLOY_ENV_WARN=1
#
# .env.production is never deleted (gitignored + backed up before sync).
# Run as root: npm ci/build as admin, PM2 as root (do not use `sudo -u admin pm2`).
# Both sites: bash scripts/deploy-both-sites.sh (from prod clone).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CURRENT_USER="$(id -un)"
DEPLOY_OWNER="${DEPLOY_OWNER:-admin}"

PROD_CLONE_MARKER="app.fparmychapters.com"
DEV_CLONE_MARKER="dev.fparmychapters.com"

is_prod_clone=0
is_dev_clone=0
[[ "$ROOT" == *"${PROD_CLONE_MARKER}"* ]] && is_prod_clone=1
[[ "$ROOT" == *"${DEV_CLONE_MARKER}"* ]] && is_dev_clone=1

if [[ "$is_prod_clone" -eq 1 && "$is_dev_clone" -eq 1 ]]; then
  echo "[deploy] ERROR: clone path matches prod and dev markers: ${ROOT}" >&2
  exit 1
fi

if [[ "$is_prod_clone" -eq 1 ]]; then
  BRANCH="${GIT_BRANCH:-main}"
  PM2_NAME="${PM2_APP_NAME:-app-fparmychapters}"
  APP_PORT="${APP_PORT:-3000}"
elif [[ "$is_dev_clone" -eq 1 ]]; then
  missing=()
  [[ -z "${GIT_BRANCH:-}" ]] && missing+=("GIT_BRANCH")
  [[ -z "${PM2_APP_NAME:-}" ]] && missing+=("PM2_APP_NAME")
  [[ -z "${APP_PORT:-}" ]] && missing+=("APP_PORT")
  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "[deploy] ERROR: dev clone requires GIT_BRANCH, PM2_APP_NAME, and APP_PORT." >&2
    echo "[deploy] Run:" >&2
    echo "  GIT_BRANCH=dev PM2_APP_NAME=dev-fparmychapters APP_PORT=3001 bash scripts/deploy-from-github.sh" >&2
    exit 1
  fi
  BRANCH="$GIT_BRANCH"
  PM2_NAME="$PM2_APP_NAME"
  APP_PORT="$APP_PORT"
else
  BRANCH="${GIT_BRANCH:-main}"
  PM2_NAME="${PM2_APP_NAME:-app-fparmychapters}"
  APP_PORT="${APP_PORT:-3000}"
fi

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

# Non-interactive sudo only — never prompt for a password during deploy.
maybe_sudo() {
  if [[ "$CURRENT_USER" == "root" ]]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo -n "$@" 2>/dev/null || true
  fi
}

run_as_deploy_owner() {
  if [[ "$CURRENT_USER" == "root" ]] && id "$DEPLOY_OWNER" >/dev/null 2>&1; then
    sudo -n -u "$DEPLOY_OWNER" "$@"
  else
    "$@"
  fi
}

# PM2 must stay under one user on the host (here: root). npm/build still run as admin.
run_pm2() {
  "$@"
}

ensure_repo_owned_by_deploy_owner() {
  if [[ "$CURRENT_USER" == "root" ]] && id "$DEPLOY_OWNER" >/dev/null 2>&1; then
    chown -R "$DEPLOY_OWNER:$DEPLOY_OWNER" "$ROOT"
    echo "[deploy] OK: repo owned by ${DEPLOY_OWNER} (npm/build as ${DEPLOY_OWNER}, pm2 as ${CURRENT_USER})"
  fi
}

# Root-owned node_modules/.next break npm ci + next build when npm runs as admin (EACCES / TAR_ENTRY_ERROR).
prepare_build_workspace() {
  local needs_clean=0
  local reason=""

  if [[ -d node_modules ]] && ! run_as_deploy_owner test -w node_modules 2>/dev/null; then
    needs_clean=1
    reason="node_modules not writable by ${DEPLOY_OWNER}"
  fi
  if [[ -d .next ]] && ! run_as_deploy_owner test -w .next 2>/dev/null; then
    needs_clean=1
    reason="${reason:+$reason; }.next not writable by ${DEPLOY_OWNER}"
  fi

  if [[ "$needs_clean" -eq 0 ]]; then
    return 0
  fi

  if [[ "$CURRENT_USER" != "root" ]]; then
    echo "[deploy] ERROR: ${reason} (often root-owned from an earlier deploy)." >&2
    echo "[deploy] Run as root:" >&2
    echo "  chown -R ${DEPLOY_OWNER}:${DEPLOY_OWNER} ${ROOT} && rm -rf ${ROOT}/node_modules ${ROOT}/.next" >&2
    exit 1
  fi

  echo "[deploy] Removing root-owned node_modules + .next for clean install (${reason})"
  rm -rf node_modules .next
  chown -R "$DEPLOY_OWNER:$DEPLOY_OWNER" "$ROOT"
}

port_holders() {
  ss -ltnp "sport = :${APP_PORT}" 2>/dev/null || true
}

port_in_use() {
  ss -ltnp "sport = :${APP_PORT}" 2>/dev/null | grep -q LISTEN
}

# Portable PID list from `ss` (avoid gawk-only match(..., arr) in free_listen_port).
pids_listening_on_port() {
  local port="$1"
  ss -ltnp "sport = :${port}" 2>/dev/null \
    | grep -oE 'pid=[0-9]+' \
    | cut -d= -f2 \
    | sort -u
}

kill_pids_on_port() {
  local port="$1"
  local pid
  local ppid
  local killed=0
  while read -r pid; do
    [[ -n "$pid" ]] || continue
    ppid="$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ' || true)"
    pkill -9 -P "$pid" 2>/dev/null || maybe_sudo pkill -9 -P "$pid"
    kill -9 "$pid" 2>/dev/null || maybe_sudo kill -9 "$pid"
    if [[ -n "${ppid:-}" && "$ppid" != "1" ]]; then
      kill -9 "$ppid" 2>/dev/null || maybe_sudo kill -9 "$ppid"
    fi
    killed=1
  done < <(pids_listening_on_port "$port")
  [[ "$killed" -eq 1 ]]
}

kill_next_on_port() {
  local port="$1"
  pkill -9 -f "next start -p ${port}" 2>/dev/null || maybe_sudo pkill -9 -f "next start -p ${port}"
}

# Hestia hosts often have PM2 under root AND admin — stop both or the other user respawns the port.
stop_pm2_app_everywhere() {
  local name="$1"
  pm2 stop "$name" 2>/dev/null || true
  pm2 delete "$name" 2>/dev/null || true
  if [[ "$CURRENT_USER" == "root" ]] && id "$DEPLOY_OWNER" >/dev/null 2>&1; then
    sudo -n -u "$DEPLOY_OWNER" pm2 stop "$name" 2>/dev/null || true
    sudo -n -u "$DEPLOY_OWNER" pm2 delete "$name" 2>/dev/null || true
  elif [[ "$CURRENT_USER" == "$DEPLOY_OWNER" ]]; then
    maybe_sudo pm2 stop "$name"
    maybe_sudo pm2 delete "$name"
  fi
}

free_listen_port() {
  local port="$1"
  local attempt
  echo "[deploy] Freeing port ${port} only (listeners before):"
  ss -ltnp "sport = :${port}" 2>/dev/null || true

  for attempt in 1 2 3 4 5; do
    if ! ss -ltnp "sport = :${port}" 2>/dev/null | grep -q LISTEN; then
      echo "[deploy] OK: port ${port} is free (attempt ${attempt})"
      return 0
    fi

    echo "[deploy] Port ${port} busy — attempt ${attempt}/5"
    if command -v fuser >/dev/null 2>&1; then
      fuser -k "${port}/tcp" 2>/dev/null || maybe_sudo fuser -k "${port}/tcp"
    fi
    kill_next_on_port "$port"
    kill_pids_on_port "$port" || true
    sleep 2
  done

  if ss -ltnp "sport = :${port}" 2>/dev/null | grep -q LISTEN; then
    echo "[deploy] ERROR: Port ${port} is still in use after 5 attempts." >&2
    echo "[deploy] Run manually:" >&2
    echo "  sudo -u admin pm2 delete ${PM2_NAME} 2>/dev/null; pm2 delete ${PM2_NAME} 2>/dev/null" >&2
    echo "  sudo fuser -k ${port}/tcp; sudo pkill -9 -f 'next start -p ${port}'" >&2
    ss -ltnp "sport = :${port}" 2>/dev/null || true
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

  echo "[deploy] PM2 recycle: ${name} on port ${port} (pm2 user: $(whoami))"

  stop_pm2_app_everywhere "$name"
  sleep 1
  free_listen_port "$port"

  if run_pm2 pm2 describe "$name" >/dev/null 2>&1; then
    echo "[deploy] pm2 restart ${name}"
    run_pm2 env NODE_ENV=production pm2 restart "$name" --update-env
  else
    echo "[deploy] pm2 start scripts/pm2-next-start.sh ${port} (name: ${name}, cwd: ${ROOT})"
    run_pm2 env NODE_ENV=production pm2 start scripts/pm2-next-start.sh --name "$name" --interpreter bash --cwd "$ROOT" --update-env -- "$port"
  fi

  run_pm2 pm2 save
  echo "[deploy] PM2 saved process list (other PM2 apps on this host were not touched)"

  sleep 3
  if ! port_in_use; then
    echo "[deploy] ERROR: Nothing listening on ${port} after PM2 start." >&2
    pm2 logs "$name" --lines 40 --nostream 2>/dev/null || true
    return 1
  fi

  echo "[deploy] OK: ${name} listening on ${port}"
  ss -ltnp "sport = :${port}" 2>/dev/null || true
}

if [[ "${SKIP_DEPLOY_ENV_WARN:-}" != "1" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "[deploy] WARNING: ${ENV_FILE} not found in $(pwd). next build/next start expect Supabase vars there (or export them before this script)." >&2
  fi
fi

echo "[deploy] $(pwd) branch=$BRANCH PORT=$PORT pm2=$PM2_NAME user=$(whoami) owner=$DEPLOY_OWNER"

ensure_git_safe_directory
ensure_repo_owned_by_deploy_owner
warn_if_env_tracked
backup_env_files

if [[ "${SKIP_PM2:-}" != "1" ]] && command -v pm2 >/dev/null 2>&1; then
  stop_pm2_app_everywhere "$PM2_NAME"
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
prepare_build_workspace

echo "[deploy] npm ci + build as ${DEPLOY_OWNER}"
run_as_deploy_owner npm ci
run_as_deploy_owner npm run build

test -f .next/BUILD_ID && echo "[deploy] BUILD OK"

if [[ "${SKIP_PM2:-}" != "1" ]]; then
  start_pm2_app "$PM2_NAME" "$APP_PORT"
else
  echo "[deploy] SKIP_PM2=1 — restart your app manually."
fi
