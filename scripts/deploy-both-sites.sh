#!/usr/bin/env bash
# Hestia VPS: deploy prod + dev. Run as root from prod clone:
#   cd /home/admin/web/app.fparmychapters.com/public_html
#   bash scripts/deploy-both-sites.sh
#
# Same as running deploy-from-github.sh on each clone (prod with no env; dev with GIT_BRANCH/PM2/PORT).

set -euo pipefail

DEPLOY_OWNER="${DEPLOY_OWNER:-admin}"
APP_ROOT="${APP_ROOT:-/home/admin/web/app.fparmychapters.com/public_html}"
DEV_ROOT="${DEV_ROOT:-/home/admin/web/dev.fparmychapters.com/public_html}"

CURRENT_USER="$(id -un)"

if [[ "$CURRENT_USER" != "root" ]]; then
  echo "[both] ERROR: run as root:" >&2
  echo "  cd ${APP_ROOT} && bash scripts/deploy-both-sites.sh" >&2
  exit 1
fi

if ! id "$DEPLOY_OWNER" >/dev/null 2>&1; then
  echo "[both] ERROR: deploy user '${DEPLOY_OWNER}' does not exist." >&2
  exit 1
fi

prepare_clone() {
  local root="$1"
  local label="$2"

  if [[ ! -d "$root" ]]; then
    echo "[both] ERROR: ${label} clone missing: ${root}" >&2
    exit 1
  fi
  if [[ ! -f "${root}/scripts/deploy-from-github.sh" ]]; then
    echo "[both] ERROR: ${label} is not a dashboard clone: ${root}" >&2
    exit 1
  fi

  echo "[both] ${label}: chown ${DEPLOY_OWNER} → ${root}"
  chown -R "${DEPLOY_OWNER}:${DEPLOY_OWNER}" "$root"
  git config --global --add safe.directory "$root" 2>/dev/null || true
}

free_both_ports() {
  if [[ -f "${APP_ROOT}/scripts/free-next-host-ports.sh" ]]; then
    bash "${APP_ROOT}/scripts/free-next-host-ports.sh" 3000 3001
  else
    for port in 3000 3001; do
      fuser -k "${port}/tcp" 2>/dev/null || true
      pkill -9 -f "next start -p ${port}" 2>/dev/null || true
    done
    sleep 2
  fi
}

deploy_clone() {
  local root="$1"
  local branch="$2"
  local pm2_name="$3"
  local port="$4"
  local label="$5"

  echo ""
  echo "[both] ========== ${label} branch=${branch} port=${port} pm2=${pm2_name} =========="
  prepare_clone "$root" "$label"

  local -a env_args=()
  if [[ "$branch" != "main" || "$pm2_name" != "app-fparmychapters" || "$port" != "3000" ]]; then
    env_args+=("GIT_BRANCH=${branch}" "PM2_APP_NAME=${pm2_name}" "APP_PORT=${port}")
  fi
  if [[ -n "${SKIP_PM2:-}" ]]; then
    env_args+=("SKIP_PM2=${SKIP_PM2}")
  fi
  if [[ -n "${DEPLOY_SOFT_PULL:-}" ]]; then
    env_args+=("DEPLOY_SOFT_PULL=${DEPLOY_SOFT_PULL}")
  fi

  if [[ ${#env_args[@]} -gt 0 ]]; then
    env "${env_args[@]}" bash -lc "cd '${root}' && bash scripts/deploy-from-github.sh"
  else
    bash -lc "cd '${root}' && bash scripts/deploy-from-github.sh"
  fi
}

verify_site() {
  local label="$1"
  local port="$2"
  local pm2_name="$3"

  if ss -ltnp "sport = :${port}" 2>/dev/null | grep -q LISTEN; then
    echo "[both] OK: ${label} listening on ${port}"
  else
    echo "[both] ERROR: ${label} not listening on ${port} (pm2: ${pm2_name})" >&2
    pm2 logs "$pm2_name" --lines 30 --nostream 2>/dev/null || true
    return 1
  fi
}

echo "[both] FlashPoint deploy — prod + dev"
echo "[both] APP_ROOT=${APP_ROOT}"
echo "[both] DEV_ROOT=${DEV_ROOT}"

deploy_clone "$APP_ROOT" "main" "app-fparmychapters" "3000" "PROD app.fparmychapters.com"
deploy_clone "$DEV_ROOT" "dev" "dev-fparmychapters" "3001" "DEV dev.fparmychapters.com"

echo ""
echo "[both] ========== Verification =========="
if [[ "${SKIP_PM2:-}" != "1" ]]; then
  verify_site "PROD" "3000" "app-fparmychapters"
  verify_site "DEV" "3001" "dev-fparmychapters"
  pm2 list
fi

echo ""
echo "[both] Done."
