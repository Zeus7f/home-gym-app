#!/bin/sh
# بازگردانی پشتیبان PostgreSQL (روی میزبان، کنار docker-compose.yml اجرا شود)
#
#   scripts/backup/restore.sh backups/homegym-2026-10-23_0300.dump
#       → در دیتابیس آزمایشی homegym_restore بازگردانی می‌کند (دادهٔ اصلی دست نمی‌خورد)
#
#   scripts/backup/restore.sh backups/homegym-2026-10-23_0300.dump --live
#       → برنامه را متوقف، دیتابیس اصلی را با پشتیبان جایگزین و برنامه را دوباره روشن می‌کند
#         (پیش از آن یک پشتیبان فوری از وضعیت فعلی گرفته می‌شود)
set -eu

FILE="${1:-}"
MODE="${2:-}"
[ -f "$FILE" ] || { echo "usage: $0 <backup.dump> [--live]"; exit 1; }

set -a; [ -f .env ] && . ./.env; set +a
PGUSER="${POSTGRES_USER:-homegym}"
LIVE_DB="${POSTGRES_DB:-homegym}"

if [ "$MODE" = "--live" ]; then
  printf 'This replaces ALL data in database "%s" with %s. Type the database name to confirm: ' "$LIVE_DB" "$FILE"
  read -r answer
  [ "$answer" = "$LIVE_DB" ] || { echo "aborted"; exit 1; }
  docker compose --profile app run --rm backup /scripts/backup.sh once
  docker compose --profile app stop app
  docker compose exec -T db pg_restore -U "$PGUSER" -d "$LIVE_DB" --clean --if-exists --no-owner < "$FILE"
  docker compose --profile app start app
  echo "restored into $LIVE_DB"
else
  TARGET="homegym_restore"
  docker compose exec -T db dropdb -U "$PGUSER" --if-exists "$TARGET"
  docker compose exec -T db createdb -U "$PGUSER" "$TARGET"
  docker compose exec -T db pg_restore -U "$PGUSER" -d "$TARGET" --no-owner < "$FILE"
  echo "restored into test database $TARGET"
fi
