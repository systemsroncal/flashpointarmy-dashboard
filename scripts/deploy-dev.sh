#!/usr/bin/env bash
# Dev deploy (dev.fparmychapters.com). Run as root from the dev clone:
#   cd /home/admin/web/dev.fparmychapters.com/public_html
#   bash scripts/deploy-dev.sh
#
# Override any default:
#   GIT_BRANCH=dev APP_PORT=3001 PM2_APP_NAME=dev-fparmychapters bash scripts/deploy-dev.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export GIT_BRANCH="${GIT_BRANCH:-dev}"
export PM2_APP_NAME="${PM2_APP_NAME:-dev-fparmychapters}"
export APP_PORT="${APP_PORT:-3001}"

exec bash scripts/deploy-from-github.sh
