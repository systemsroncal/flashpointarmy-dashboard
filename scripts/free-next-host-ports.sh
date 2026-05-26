#!/usr/bin/env bash
# Free Next listen ports (kills orphaned next-server not managed by PM2).
# Usage:
#   bash scripts/free-next-host-ports.sh           # 3000 + 3001
#   bash scripts/free-next-host-ports.sh 3001      # one port
#   sudo bash scripts/free-next-host-ports.sh 3001 # when listener is another user
set -euo pipefail

PORTS=("$@")
if [[ ${#PORTS[@]} -eq 0 ]]; then
  PORTS=(3000 3001)
fi

for p in "${PORTS[@]}"; do
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${p}/tcp" 2>/dev/null || true
  fi
done
sleep 2
echo "[free-ports] done (${PORTS[*]})"
