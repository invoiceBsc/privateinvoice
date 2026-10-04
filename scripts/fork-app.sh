#!/usr/bin/env bash
# Runs a second app instance in real RAILGUN mode against a local BNB Chain fork (anvil on :8545).
# Usage: bash scripts/fork-app.sh start|stop
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$PWD/node_modules/node/bin:$PWD/node_modules/.bin:$PATH" NEXT_TELEMETRY_DISABLED=1
PORT=3101
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
    export PRIVACY_PROVIDER=railgun BNB_RPC_URL=http://127.0.0.1:8545 APP_ORIGIN=http://127.0.0.1:$PORT
    # Fork transactions are not in RAILGUN's mainnet indexer: discover from chain logs.
    export RAILGUN_DISCOVERY=logs
    # Isolated, freshly migrated schema so fork runs never see each other's (or dev) rows.
    export DATABASE_URL="${DATABASE_URL%%\?*}?schema=fork"
    prisma migrate reset --force --skip-generate --skip-seed >/dev/null
    nohup next start -H 127.0.0.1 -p "$PORT" > logs/fork-app.log 2>&1 &
    for _ in $(seq 1 40); do
      curl -fsS "http://127.0.0.1:$PORT/api/merchant" >/dev/null 2>&1 && { echo "fork app ready on :$PORT"; exit 0; }
      sleep 0.5
    done
    echo "fork app did not start; see logs/fork-app.log"; exit 1 ;;
esac
