# استقرار Home Gym روی سرور (بدون سرویس خارجی)

برنامه یک سرور مستقل است: **Express + PostgreSQL**، داخل Docker. به Supabase، Firebase یا Cloudflare نیازی ندارد و روی هر سرور لینوکسی داخل ایران اجرا می‌شود.

```
مرورگر ──HTTPS──▶ nginx (TLS) ──▶ app:3000 (فقط 127.0.0.1) ──▶ db:5432 (فقط 127.0.0.1)
                                                    backup ──▶ ./backups (روزانه، ۱۴ روز)
```

| سرویس | نقش |
| :--- | :--- |
| `db` | PostgreSQL 16، دادهٔ ماندگار در volume `pgdata` |
| `app` | Express + فرانت‌اند ساخته‌شده. migrationها هنگام بالا آمدن خودکار اجرا می‌شوند |
| `backup` | پشتیبان روزانه با `pg_dump`، بررسی سالم بودن هر فایل، حذف فایل‌های قدیمی‌تر از ۱۴ روز |

## ۱. پیش‌نیاز سرور

- لینوکس با Docker، Docker Compose، `git` و `curl`
- دامنه‌ای که به IP سرور اشاره کند (مثلاً `gymvero.el-sabor.ir`)
- nginx و certbot روی خود سرور

## ۲. تنظیمات

```bash
git clone https://github.com/Zeus7f/home-gym-app.git && cd home-gym-app
cp .env.example .env
openssl rand -hex 32        # مقدار JWT_SECRET
openssl rand -hex 24        # مقدار POSTGRES_PASSWORD
```

| متغیر | توضیح |
| :--- | :--- |
| `POSTGRES_PASSWORD` | رمز تصادفی، حداقل ۱۶ نویسه |
| `JWT_SECRET` | حداقل ۳۲ نویسهٔ تصادفی؛ با تغییرش همهٔ کاربران خارج می‌شوند |
| `COOKIE_SECURE=true` و `TRUST_PROXY=1` | برای اجرا پشت nginx با HTTPS |
| `SEED_ADMIN_PHONE` / `SEED_ADMIN_PASSWORD` | حساب مدیر کل اولیه (فقط اگر وجود نداشته باشد ساخته می‌شود) |
| `BACKUP_TIME` (پیش‌فرض `03:00`) و `BACKUP_RETENTION_DAYS` (پیش‌فرض `14`) | زمان پشتیبان روزانه به وقت تهران و مدت نگهداری |
| `BACKUP_HOST_DIR` (پیش‌فرض `./backups`) | پوشهٔ پشتیبان‌ها روی سرور |

`DATABASE_URL` برای سرویس app در `docker-compose.yml` خودکار ساخته می‌شود.

**بررسی پیش از استقرار:** ابزارها، طول کلیدها، رمزهای پیش‌فرض و فضای دیسک را چک می‌کند.

```bash
sh scripts/preflight.sh
```

## ۳. استقرار و به‌روزرسانی

```bash
sh scripts/deploy.sh
```

این اسکریپت به ترتیب کارهای زیر را انجام می‌دهد:

1. اجرای preflight؛ اگر خطا باشد متوقف می‌شود.
2. اگر دیتابیس در حال اجراست، یک **پشتیبان فوری** می‌گیرد.
3. `git pull --ff-only` و ساخت تصویر تازه. تصویر فعلی به‌عنوان `homegym-app:previous` نگه داشته می‌شود.
4. صبر تا سالم شدن `/api/health` (شامل پاسخ دیتابیس)، حداکثر ۶۰ ثانیه.
5. اجرای seed (کاتالوگ حرکات و مدیر کل در صورت نبود).
6. **اگر نسخهٔ تازه سالم نشد، خودکار به تصویر قبلی برمی‌گردد** و لاگ خطا را نشان می‌دهد.

برنامه و دیتابیس فقط روی `127.0.0.1` باز هستند و از بیرون فقط از راه nginx دیده می‌شوند.

## ۴. nginx و HTTPS

فایل آماده [deploy/nginx/homegym.conf](deploy/nginx/homegym.conf) را کپی و دامنه را در آن جایگزین کنید:

```bash
sudo cp deploy/nginx/homegym.conf /etc/nginx/conf.d/homegym.conf
sudo certbot --nginx -d gymvero.el-sabor.ir
sudo nginx -t && sudo systemctl reload nginx
```

این فایل شامل این موارد است:

- ریدایرکت HTTP به HTTPS، و TLS 1.2 و 1.3
- gzip
- محدودیت ۱۰ درخواست در دقیقه به `/api/auth/login`، در کنار محدودیت خود سرور
- هدرهای `X-Forwarded-*`؛ با `TRUST_PROXY=1` سرور IP واقعی کاربر را می‌بیند

## ۵. پشتیبان‌گیری و بازگردانی

**خودکار:** سرویس `backup` هر روز در `BACKUP_TIME` فایل `backups/homegym-YYYY-MM-DD_HHMM.dump` می‌سازد.

- هر فایل پس از ساخت با `pg_restore --list` بررسی می‌شود.
- فایل‌های قدیمی‌تر از ۱۴ روز حذف می‌شوند.
- اگر در ۲۶ ساعت گذشته پشتیبان موفقی نباشد، `docker compose ps` این سرویس را `unhealthy` نشان می‌دهد.

**پشتیبان فوری:**

```bash
docker compose --profile app run --rm backup once
```

**آزمون بازگردانی** (پیشنهاد: ماهی یک بار در cron): آخرین پشتیبان در دیتابیس آزمایشی بازگردانی و تعداد ردیف‌ها با دیتابیس اصلی مقایسه می‌شود. خروجی ناصفر یعنی پشتیبان قابل اعتماد نیست.

```bash
sh scripts/backup/verify.sh
```

**بازگردانی در دیتابیس آزمایشی `homegym_restore`** (دادهٔ اصلی دست نمی‌خورد):

```bash
sh scripts/backup/restore.sh backups/homegym-2026-10-23_0300.dump
```

**بازگردانی روی دیتابیس اصلی:** اول تأیید نام دیتابیس را می‌خواهد، بعد از وضعیت فعلی پشتیبان می‌گیرد، برنامه را متوقف و پشتیبان را جایگزین می‌کند و برنامه را دوباره روشن می‌کند.

```bash
sh scripts/backup/restore.sh backups/homegym-2026-10-23_0300.dump --live
```

**نسخهٔ خارج از سرور (توصیه‌شده):** پوشهٔ `backups/` را روزانه به یک سرور یا فضای ذخیره‌سازی دیگر کپی کنید. پشتیبانی که فقط روی همان دیسک است، با خرابی دیسک از بین می‌رود.

```bash
# crontab -e
30 3 * * * rsync -a --delete /path/to/home-gym-app/backups/ backup@other-server:/srv/homegym-backups/
0 4 1 * * cd /path/to/home-gym-app && sh scripts/backup/verify.sh >> /var/log/homegym-verify.log 2>&1
```

## ۶. پایش

- `docker compose --profile app ps`: هر سه سرویس باید `healthy` باشند.
- `docker compose --profile app logs -f app`: هر درخواست API یک خط JSON است، شامل زمان، مسیر، وضعیت، مدت و کاربر. خطاهای ۵xx در stderr می‌آیند.
- `curl -s https://gymvero.el-sabor.ir/api/health` باید `{"status":"ok","db":"ok"}` برگرداند. این آدرس را به یک سرویس uptime بدهید.
- حجم لاگ کانتینر محدود است: ۵ فایل ۱۰ مگابایتی.

## ۷. CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) روی هر push و pull request به `main` اجرا می‌شود:

| کار | محتوا |
| :--- | :--- |
| `checks` | TypeScript، تست‌های دامنه، build فرانت‌اند، bundle سرور و seed، بررسی اسکریپت‌های شل و فایل compose |
| `api` | تست یکپارچهٔ API روی PostgreSQL 16 واقعی |
| `docker` | ساخت تصویر تولیدی، اجرای آن کنار PostgreSQL، و بررسی `/api/health`، seed و ورود مدیر کل |

پیش از اجرای `deploy.sh` روی سرور، سبز بودن CI را در تب **Actions** گیت‌هاب ببینید.

## توسعهٔ محلی

```bash
docker compose up -d db                          # فقط PostgreSQL
bun install
SEED_ADMIN_PHONE=0912... SEED_ADMIN_PASSWORD=... SEED_DEMO=true SEED_DEMO_PASSWORD=demo-pass-123 bun run db:seed
bun run dev                                      # http://localhost:3000
bun run test                                     # تست‌های دامنه (بدون دیتابیس)
bun run test:api                                 # تست یکپارچهٔ API روی دیتابیس جدای homegym_test
```

تغییر طرح دیتابیس: `src/db/schema.ts` را ویرایش کنید و `bun run db:generate` بزنید. migration تازه در `drizzle/` ساخته می‌شود و با بالا آمدن سرور اجرا می‌شود.

## امنیت

- رمزها با scrypt و salt جداگانه hash می‌شوند. توکن نشست در کوکی HttpOnly با `SameSite=Lax` و `Secure` نگه داشته می‌شود.
- با تغییر رمز یا غیرفعال‌سازی حساب، همهٔ نشست‌های قبلی آن حساب باطل می‌شوند.
- حساب‌هایی که مدیر یا مدیر کل می‌سازد، در اولین ورود باید رمز را عوض کنند.
- ورود در برابر حدس رمز محدود است:
  - در nginx: ۱۰ درخواست در دقیقه برای هر IP.
  - در خود سرور: ۸ تلاش ناموفق در ۱۵ دقیقه برای هر حساب و IP. این محدودیت در حافظه است؛ برای چند نمونهٔ سرور باید Redis جایگزینش شود.
- هر درخواست تغییر داده در سرور اعتبارسنجی می‌شود (نقش، مالکیت، ظرفیت، مهلت لغو) و در یک تراکنش با قفل باشگاه اجرا می‌شود.
- هدرهای امنیتی (CSP، HSTS، X-Frame-Options) در حالت تولید فعال‌اند.
- سرور در حالت تولید بدون `JWT_SECRET` امن بالا نمی‌آید و برای تنظیمات ناامن (رمز پیش‌فرض دیتابیس، کوکی غیر Secure، نبود `TRUST_PROXY`) هشدار می‌دهد.
