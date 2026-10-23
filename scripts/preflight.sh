#!/bin/sh
# بررسی پیش از استقرار روی سرور: ابزارها، فایل .env و مقادیر امن.
# خروجی ناصفر یعنی استقرار انجام نشود.
set -u
cd "$(dirname "$0")/.."
fail=0
ok()   { echo "  ✓ $*"; }
bad()  { echo "  ✗ $*"; fail=1; }
warn() { echo "  ! $*"; }

echo "Tools"
command -v docker >/dev/null 2>&1 && ok "docker $(docker --version | cut -d' ' -f3 | tr -d ,)" || bad "docker is not installed"
docker compose version >/dev/null 2>&1 && ok "docker compose" || bad "docker compose plugin is missing"

echo ".env"
ENV_FILE="${ENV_FILE:-.env}"
if [ ! -f "$ENV_FILE" ]; then
  bad "$ENV_FILE not found (cp .env.example .env)"
else
  set -a; . "./$ENV_FILE"; set +a
  [ "${#JWT_SECRET}" -ge 32 ] 2>/dev/null && ok "JWT_SECRET length ${#JWT_SECRET}" || bad "JWT_SECRET must be at least 32 characters (openssl rand -hex 32)"
  case "${POSTGRES_PASSWORD:-}" in
    ""|homegym_dev_password|change-me*) bad "POSTGRES_PASSWORD is empty or a placeholder" ;;
    *) [ "${#POSTGRES_PASSWORD}" -ge 16 ] && ok "POSTGRES_PASSWORD set" || bad "POSTGRES_PASSWORD should be at least 16 characters" ;;
  esac
  [ "${COOKIE_SECURE:-true}" = "true" ] && ok "COOKIE_SECURE=true" || warn "COOKIE_SECURE is not true — only acceptable without HTTPS for a short test"
  [ -n "${TRUST_PROXY:-}" ] && ok "TRUST_PROXY=${TRUST_PROXY}" || warn "TRUST_PROXY not set (needed behind nginx)"
fi

echo "System"
free_kb="$(df -Pk . | awk 'NR==2{print $4}')"
[ "$free_kb" -gt 2097152 ] && ok "disk free $((free_kb / 1024)) MB" || bad "less than 2 GB free disk"
mkdir -p "${BACKUP_HOST_DIR:-./backups}" && ok "backup dir ${BACKUP_HOST_DIR:-./backups}"

[ "$fail" -eq 0 ] && echo "Preflight passed" || echo "Preflight FAILED"
exit "$fail"
