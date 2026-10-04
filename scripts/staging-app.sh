#!/usr/bin/env bash
# Real-money acceptance instance: PRIVACY_PROVIDER=railgun on BNB Chain mainnet, isolated `staging`
# DB schema (kept between runs), loopback only. The public site is unaffected.
# Usage: bash scripts/staging-app.sh start|stop
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$PWD/node_modules/node/bin:$PWD/node_modules/.bin:$PATH" NEXT_TELEMETRY_DISABLED=1
PORT=3102
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
    export PRIVACY_PROVIDER=railgun APP_ORIGIN=http://127.0.0.1:$PORT
    export BNB_RPC_URL="${BNB_RPC_URL:-https://bsc-dataseed.bnbchain.org}"
    export DATABASE_URL="${DATABASE_URL%%\?*}?schema=staging"
    prisma migrate deploy >/dev/null
    nohup next start -H 127.0.0.1 -p "$PORT" > logs/staging-app.log 2>&1 &
    for _ in $(seq 1 40); do
      curl -fsS "http://127.0.0.1:$PORT/api/merchant" >/dev/null 2>&1 && { echo "staging app ready on :$PORT"; exit 0; }
      sleep 0.5
    done
    echo "staging app did not start; see logs/staging-app.log"; exit 1 ;;
esac
