#!/usr/bin/env bash
# Free Next default ports before `pm2 start ecosystem.config.cjs` (kills orphaned next-server).
set -euo pipefail
for p in 3000 3001; do
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${p}/tcp" 2>/dev/null || true
  fi
done
sleep 2
echo "[free-ports] done (3000, 3001)"
