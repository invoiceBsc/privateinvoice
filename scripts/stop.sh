#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f data/app.pid ]; then
 pid="$(cat data/app.pid)"
 if [ -r "/proc/$pid/cmdline" ] && tr '\0' ' ' < "/proc/$pid/cmdline" | grep -q 'npm run start'; then
  children="$(pgrep -P "$pid" || true)"
  for child in $children; do pkill -TERM -P "$child" || true; kill -TERM "$child" || true; done
  kill -TERM "$pid" || true
 fi
 rm -f data/app.pid
fi
if [ -f data/db-root/data/postgres/postmaster.pid ]; then chroot --userspec=65534:65534 data/db-root /pgsql/bin/pg_ctl -D /data/postgres -m fast -w stop; fi
