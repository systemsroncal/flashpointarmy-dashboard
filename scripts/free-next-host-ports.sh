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

kill_port() {
  local p="$1"
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${p}/tcp" 2>/dev/null || sudo fuser -k "${p}/tcp" 2>/dev/null || true
  fi
  local pid
  while read -r pid; do
    [[ -n "$pid" ]] || continue
    kill -9 "$pid" 2>/dev/null || sudo kill -9 "$pid" 2>/dev/null || true
  done < <(
    ss -ltnp "sport = :${p}" 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u
  )
}

for p in "${PORTS[@]}"; do
  echo "[free-ports] freeing ${p}..."
  kill_port "$p"
done
sleep 2
echo "[free-ports] done (${PORTS[*]})"
