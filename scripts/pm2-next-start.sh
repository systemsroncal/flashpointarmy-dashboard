#!/usr/bin/env bash
# PM2 wrapper: always start Next from the repo root with production env loaded.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LISTEN_PORT="${1:?missing port (e.g. 3000 or 3001)}"
export NODE_ENV=production
# Some VPS hosts fail Node fetch over IPv6 while curl succeeds on IPv4.
export NODE_OPTIONS="${NODE_OPTIONS:---dns-result-order=ipv4first}"
# Drop inherited PORT so Next + .env do not fight `-p`.
unset PORT 2>/dev/null || true
exec node "./node_modules/next/dist/bin/next" start -p "$LISTEN_PORT"
