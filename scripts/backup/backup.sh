#!/bin/sh
# پشتیبان‌گیری خودکار PostgreSQL — داخل سرویس backup در docker-compose اجرا می‌شود.
#
#   backup.sh          حلقه: هر روز در ساعت BACKUP_TIME (به وقت تهران) یک پشتیبان
#   backup.sh once     یک پشتیبان فوری و خروج
#
# هر فایل پس از ساخت با pg_restore --list بررسی می‌شود؛ فایل خراب جایگزین پشتیبان سالم نمی‌شود.
# پشتیبان‌های قدیمی‌تر از BACKUP_RETENTION_DAYS روز حذف می‌شوند.
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_TIME="${BACKUP_TIME:-03:00}"
RETENTION="${BACKUP_RETENTION_DAYS:-14}"
STATUS_FILE="$BACKUP_DIR/last-status"

log() { echo "[backup] $(date '+%Y-%m-%d %H:%M:%S %Z') $*"; }

run_backup() {
  ts="$(date +%Y-%m-%d_%H%M)"
  tmp="$BACKUP_DIR/.homegym-$ts.dump.partial"
  out="$BACKUP_DIR/homegym-$ts.dump"
  mkdir -p "$BACKUP_DIR"
  if pg_dump --format=custom --no-owner --file="$tmp" && pg_restore --list "$tmp" >/dev/null; then
    mv "$tmp" "$out"
    find "$BACKUP_DIR" -maxdepth 1 -name 'homegym-*.dump' -mtime +"$RETENTION" -delete
    size="$(du -h "$out" | cut -f1)"
    echo "ok $ts $size" > "$STATUS_FILE"
    log "ok: $out ($size)"
  else
    rm -f "$tmp"
    echo "failed $ts" > "$STATUS_FILE"
    log "FAILED"
    return 1
  fi
}

seconds_until() {
  # ثانیه تا ساعت HH:MM بعدی
  target_h="${1%%:*}"; target_m="${1##*:}"
  now="$(date +%s)"
  today="$(date +%Y-%m-%d)"
  next="$(date -d "$today $target_h:$target_m:00" +%s 2>/dev/null || echo 0)"
  [ "$next" -le "$now" ] && next=$((next + 86400))
  echo $((next - now))
}

if [ "${1:-}" = "once" ]; then
  run_backup
  exit $?
fi

log "started; daily at $BACKUP_TIME, keeping $RETENTION days in $BACKUP_DIR"
# اگر در ۲۴ ساعت گذشته پشتیبانی نیست، همین حالا یکی گرفته شود
if [ -z "$(find "$BACKUP_DIR" -maxdepth 1 -name 'homegym-*.dump' -mmin -1440 2>/dev/null)" ]; then
  run_backup || true
fi
while true; do
  wait_s="$(seconds_until "$BACKUP_TIME")"
  log "next backup in $((wait_s / 60)) minutes"
  sleep "$wait_s"
  run_backup || true
done
