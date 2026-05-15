#!/usr/bin/env bash
# Used by ecosystem.config.cjs — PM2 sets cwd to the app clone; $1 = listen port.
set -euo pipefail
PORT="${1:?missing port (e.g. 3000 or 3001)}"
unset PORT 2>/dev/null || true
exec node "./node_modules/next/dist/bin/next" start -p "$PORT"
