#!/bin/sh
# آزمون بازگردانی: آخرین پشتیبان در دیتابیس آزمایشی بازگردانی و تعداد ردیف‌ها با دیتابیس اصلی مقایسه می‌شود.
# پیشنهاد: ماهی یک بار از cron اجرا شود. خروجی ناصفر یعنی پشتیبان قابل اعتماد نیست.
set -eu
cd "$(dirname "$0")/../.."
set -a; [ -f .env ] && . ./.env; set +a
PGUSER="${POSTGRES_USER:-homegym}"
LIVE_DB="${POSTGRES_DB:-homegym}"
DIR="${BACKUP_HOST_DIR:-./backups}"

LATEST="$(ls -1t "$DIR"/homegym-*.dump 2>/dev/null | head -1)"
[ -n "$LATEST" ] || { echo "no backups in $DIR"; exit 1; }
echo "verifying $LATEST"
sh scripts/backup/restore.sh "$LATEST" >/dev/null

TABLES="gyms users trainers members sessions payments workout_programs exercises"
status=0
for tbl in $TABLES; do
  live="$(docker compose exec -T db psql -U "$PGUSER" -d "$LIVE_DB" -Atc "SELECT count(*) FROM $tbl")"
  restored="$(docker compose exec -T db psql -U "$PGUSER" -d homegym_restore -Atc "SELECT count(*) FROM $tbl")"
  mark="ok"
  # پشتیبان از گذشته است؛ تعداد بازگردانی‌شده نباید بیشتر از امروز باشد و جدول نباید خالی شده باشد
  if [ "$restored" -gt "$live" ] || { [ "$live" -gt 0 ] && [ "$restored" -eq 0 ]; }; then mark="MISMATCH"; status=1; fi
  printf '%-18s live=%-8s backup=%-8s %s\n' "$tbl" "$live" "$restored" "$mark"
done
docker compose exec -T db dropdb -U "$PGUSER" --if-exists homegym_restore
exit $status
