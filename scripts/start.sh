#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$PWD/node_modules/node/bin:$PWD/node_modules/.bin:$PATH"
export NEXT_TELEMETRY_DISABLED=1
mkdir -p logs
if [ ! -f .next/BUILD_ID ]; then echo 'Build the app before starting it.'; exit 1; fi
if [ -f data/app.pid ] && kill -0 "$(cat data/app.pid)" 2>/dev/null; then echo 'Invoice already running'; exit 0; fi
nohup npm run start > logs/app.log 2>&1 &
echo $! > data/app.pid
for attempt in $(seq 1 40); do
 if curl -fsS http://localhost:3100/api/merchant >/dev/null 2>&1; then
  echo 'Invoice ready: https://privateinvoice.space'
  exit 0
 fi
 sleep 0.25
done
echo 'Invoice did not become ready. Check logs/app.log.'
exit 1
