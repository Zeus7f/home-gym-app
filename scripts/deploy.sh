#!/bin/sh
# استقرار یا به‌روزرسانی روی سرور:
#   ۱. بررسی پیش از استقرار (preflight)
#   ۲. پشتیبان فوری از دیتابیس
#   ۳. دریافت آخرین کد و ساخت تصویر تازه (تصویر فعلی به‌عنوان previous نگه داشته می‌شود)
#   ۴. بالا آوردن و صبر تا سالم شدن /api/health
#   ۵. اگر سالم نشد: بازگشت خودکار به تصویر قبلی
set -eu
cd "$(dirname "$0")/.."
ENV_FILE="${ENV_FILE:-.env}"
IMAGE="homegym-app"
compose() { docker compose --env-file "$ENV_FILE" --profile app "$@"; }
set -a; . "./$ENV_FILE"; set +a

ENV_FILE="$ENV_FILE" sh scripts/preflight.sh

echo "→ backup before deploy"
if compose ps --status running --services 2>/dev/null | grep -qx db; then
  compose run --rm backup once || { echo "backup failed — aborting deploy"; exit 1; }
fi

echo "→ update code"
[ "${SKIP_PULL:-}" = "1" ] || git pull --ff-only

if docker image inspect "$IMAGE:latest" >/dev/null 2>&1; then
  docker tag "$IMAGE:latest" "$IMAGE:previous"
fi

echo "→ build and start"
compose up -d --build

echo "→ wait for health"
port="${APP_PORT:-3000}"
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:$port/api/health" >/dev/null 2>&1; then
    echo "✓ healthy after $((i * 2))s"
    # کاتالوگ حرکات و (فقط اگر وجود ندارد) مدیر کل؛ رمز فقط به همین اجرای یک‌باره داده می‌شود
    compose run --rm --no-deps -e SEED_ADMIN_PHONE -e SEED_ADMIN_PASSWORD --entrypoint node app build/seed.cjs || echo "! seed failed (app is running; check the output above)"
    docker image prune -f >/dev/null 2>&1 || true
    compose ps
    exit 0
  fi
  sleep 2
done

echo "✗ the new version did not become healthy — rolling back"
compose logs --tail 50 app || true
if docker image inspect "$IMAGE:previous" >/dev/null 2>&1; then
  docker tag "$IMAGE:previous" "$IMAGE:latest"
  compose up -d --no-build app
  echo "rolled back to the previous image"
fi
exit 1
