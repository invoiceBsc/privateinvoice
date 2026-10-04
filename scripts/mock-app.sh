#!/usr/bin/env bash
# Internal mock-mode instance for the UI regression suite (the public site runs real payments).
# Usage: bash scripts/mock-app.sh start|stop
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$PWD/node_modules/node/bin:$PWD/node_modules/.bin:$PATH" NEXT_TELEMETRY_DISABLED=1
PORT=3103
stop() {
  local pid
  pid="$(ss -ltnpH "sport = :$PORT" | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2 || true)"
  [ -n "$pid" ] && kill "$pid" && sleep 1 || true
}
case "${1:-start}" in
  stop) stop ;;
  start)
    stop
    set -a; . ./.env; set +a
    # Pre-launch data (mock merchants and invoices) lives in the default `public` schema.
    export PRIVACY_PROVIDER=mock APP_ORIGIN=http://127.0.0.1:$PORT
    export DATABASE_URL="${DATABASE_URL%%\?*}"
    nohup next start -H 127.0.0.1 -p "$PORT" > logs/mock-app.log 2>&1 &
    for _ in $(seq 1 40); do
      curl -fsS "http://127.0.0.1:$PORT/api/merchant" >/dev/null 2>&1 && { echo "mock app ready on :$PORT"; exit 0; }
      sleep 0.5
    done
    echo "mock app did not start; see logs/mock-app.log"; exit 1 ;;
esac
