# استقرار Home Gym روی سرور (بدون سرویس خارجی)

برنامه یک سرور مستقل است: **Express + PostgreSQL**، داخل Docker. به Supabase، Firebase یا Cloudflare نیازی ندارد و روی هر سرور لینوکسی داخل ایران اجرا می‌شود.

```
مرورگر ──HTTPS──▶ nginx (TLS) ──▶ app:3000 (Express: /api + فرانت‌اند) ──▶ db:5432 (PostgreSQL 16)
```

## ۱. پیش‌نیاز سرور

- Docker و Docker Compose
- دامنه‌ای که به IP سرور اشاره کند (مثلاً `gymvero.el-sabor.ir`)
- nginx و گواهی TLS (مثلاً certbot)

## ۲. تنظیمات

```bash
git clone https://github.com/Zeus7f/home-gym-app.git && cd home-gym-app
cp .env.example .env
openssl rand -hex 32        # مقدار JWT_SECRET
openssl rand -hex 24        # مقدار POSTGRES_PASSWORD
```

در `.env` این‌ها را پر کنید:

| متغیر | توضیح |
| :--- | :--- |
| `POSTGRES_PASSWORD` | رمز تصادفی و بلند |
| `JWT_SECRET` | حداقل ۳۲ نویسهٔ تصادفی؛ با تغییرش همهٔ کاربران خارج می‌شوند |
| `SEED_ADMIN_PHONE` / `SEED_ADMIN_PASSWORD` | حساب مدیر کل اولیه |

`DATABASE_URL` برای سرویس app در `docker-compose.yml` خودکار ساخته می‌شود.

## ۳. اجرا

```bash
docker compose --profile app up -d --build
```

- migrationها هنگام بالا آمدن سرور خودکار اجرا می‌شوند.
- دیتابیس فقط روی `127.0.0.1` باز است و از بیرون در دسترس نیست.

**ساخت مدیر کل و کاتالوگ حرکات (یک بار؛ اجرای دوباره بی‌خطر است):**

```bash
docker compose exec app node build/seed.cjs
```

seed، متغیرهای `SEED_ADMIN_*` را از محیط سرویس app می‌خواند. یا آن‌ها را به بخش `environment` سرویس app اضافه کنید، یا یک بار مستقیم بدهید:

```bash
docker compose exec -e SEED_ADMIN_PHONE=0912xxxxxxx -e SEED_ADMIN_PASSWORD='...' app node build/seed.cjs
```

## ۴. nginx

```nginx
server {
  listen 443 ssl http2;
  server_name gymvero.el-sabor.ir;
  ssl_certificate     /etc/letsencrypt/live/gymvero.el-sabor.ir/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/gymvero.el-sabor.ir/privkey.pem;

  client_max_body_size 2m;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
server { listen 80; server_name gymvero.el-sabor.ir; return 301 https://$host$request_uri; }
```

`TRUST_PROXY=1` در `.env` باعث می‌شود محدودیت تلاش ورود IP واقعی کاربر را ببیند.

## ۵. پشتیبان‌گیری

```bash
# پشتیبان روزانه (crontab: 0 3 * * *)
docker compose exec -T db pg_dump -U homegym -Fc homegym > /backups/homegym-$(date +%F).dump
# بازگردانی
docker compose exec -T db pg_restore -U homegym -d homegym --clean < /backups/homegym-YYYY-MM-DD.dump
```

## ۶. به‌روزرسانی

```bash
git pull && docker compose --profile app up -d --build
```

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
- ورود در برابر حدس رمز محدود است: ۸ تلاش ناموفق در ۱۵ دقیقه برای هر حساب و IP. محدودیت در حافظه است؛ برای چند نمونهٔ سرور باید Redis جایگزینش شود.
- هر درخواست تغییر داده در سرور اعتبارسنجی می‌شود (نقش، مالکیت، ظرفیت، مهلت لغو) و در یک تراکنش با قفل باشگاه اجرا می‌شود.
- هدرهای امنیتی (CSP، HSTS، X-Frame-Options) در حالت تولید فعال‌اند.
