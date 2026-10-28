#!/bin/sh
# Project-local Postgres for development and tests (port 54329, trust auth, data in .pgdata/).
set -e
export LC_ALL="${LC_ALL:-en_US.UTF-8}"
PG_BIN="${PG_BIN:-$(dirname "$(command -v initdb)")}"
if [ -x /opt/homebrew/opt/postgresql@16/bin/initdb ]; then PG_BIN=/opt/homebrew/opt/postgresql@16/bin; fi
DATA="$(cd "$(dirname "$0")/.." && pwd)/.pgdata"
PORT=54329
case "$1" in
  start)
    if [ ! -d "$DATA" ]; then
      "$PG_BIN/initdb" -D "$DATA" -U baton --auth=trust >/dev/null
    fi
    "$PG_BIN/pg_ctl" -D "$DATA" -o "-p $PORT -k /tmp" -l "$DATA/server.log" -w status >/dev/null 2>&1 || \
      "$PG_BIN/pg_ctl" -D "$DATA" -o "-p $PORT -k /tmp" -l "$DATA/server.log" -w start
    for db in baton baton_test; do
      "$PG_BIN/psql" -h /tmp -p $PORT -U baton -d postgres -tAc "select 1 from pg_database where datname='$db'" | grep -q 1 || \
        "$PG_BIN/createdb" -h /tmp -p $PORT -U baton "$db"
    done
    echo "Postgres ready: postgres://baton@localhost:$PORT/baton"
    ;;
  stop) "$PG_BIN/pg_ctl" -D "$DATA" -w stop ;;
  *) echo "usage: $0 start|stop"; exit 1 ;;
esac
