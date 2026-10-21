# راه‌اندازی احراز هویت (B-01) — Supabase Auth

از این نسخه، اگر `VITE_SUPABASE_URL` و کلید anon تنظیم شده باشند، ورود **فقط** از Supabase Auth انجام می‌شود:

- حساب‌های دمو (`admin` / `123` و …) دیگر پذیرفته نمی‌شوند.
- نقش و باشگاه کاربر از جدول `profiles` خوانده می‌شود و RLS از آن محافظت می‌کند.
- هیچ رمزی در مرورگر ذخیره نمی‌شود.

بدون Supabase، برنامه مثل قبل دموی محلی است. در build توسعه می‌توانید با `VITE_AUTH_MODE=demo` موقتاً به دمو برگردید. build تولیدی این تنظیم را نادیده می‌گیرد.

## ۱. اجرای migrationها

به ترتیب در SQL Editor (یا با `supabase db push`):

1. `migrations/20260921000000_core_schema.sql`
2. `migrations/20260921000001_rls_policies.sql`
3. `migrations/20260921000002_complete_workout_rpc.sql`
4. `migrations/20260921000003_gym_management_refactor.sql`
5. `migrations/20261021000000_revoke_public_access.sql`
6. `migrations/20261022000000_supabase_auth.sql`

## ۲. تنظیمات Auth در داشبورد

- **Authentication → Sign In / Providers → Email:** گزینهٔ **Allow new users to sign up** را خاموش کنید. حساب‌ها فقط توسط مدیر ساخته می‌شوند.
- **Confirm email** را می‌توانید روشن بگذارید، چون Edge Function حساب‌ها را تأییدشده می‌سازد.

## ۳. ساخت اولین مدیر باشگاه

1. **Authentication → Users → Add user:**
   - ایمیل: `<username>@<VITE_AUTH_EMAIL_DOMAIN>`، مثلاً `admin@accounts.homegym.app`
   - یک رمز قوی
   - تیک **Auto Confirm User** را بزنید.
2. شناسهٔ (UUID) کاربر را کپی کنید و در SQL Editor اجرا کنید:

```sql
WITH t AS (
  INSERT INTO public.tenants (name, slug, timezone)
  VALUES ('Iron Haven', 'iron-haven', 'Asia/Tehran')
  RETURNING id
), s AS (
  INSERT INTO public.tenant_settings (tenant_id, locale) SELECT id, 'fa-IR' FROM t
)
INSERT INTO public.profiles (id, full_name, role, tenant_id, username)
SELECT '<USER-UUID>', 'مدیر باشگاه', 'gym_owner', id, 'admin' FROM t;
```

اکنون با نام کاربری `admin` و همان رمز وارد شوید. وارد کردن ایمیل کامل هم کار می‌کند.

## ۴. حساب مربی و عضو (Edge Function)

ساخت حساب و تغییر رمز به service role نیاز دارد و از مرورگر انجام نمی‌شود:

```bash
supabase functions deploy manage-account
supabase secrets set AUTH_EMAIL_DOMAIN=accounts.homegym.app
```

- `addTrainer` و `addMember` در `src/api` وقتی رمز داده شود، این تابع را صدا می‌زنند.
- نام کاربری همان شمارهٔ تلفن است.
- رمز باید حداقل ۸ نویسه باشد.
- تابع فقط به مدیر فعال یک باشگاه، و فقط برای حساب‌های همان باشگاه، پاسخ می‌دهد.

### پیوند حساب‌های موجود

تا وقتی B-03 (ذخیره‌سازی ابری) انجام نشده، داده‌های مربی/عضو هنوز در مرورگر هستند. ستون `profiles.app_entity_id` حساب را به همان رکورد محلی وصل می‌کند (مثل `t-ali` یا `m-reza`). برای حسابی که دستی ساخته‌اید:

```sql
UPDATE public.profiles SET app_entity_id = 't-ali' WHERE username = '09121112233';
```

حساب مربی/عضو بدون `app_entity_id` اجازهٔ ورود ندارد.

## محدودیت‌های فعلی

- **داده‌ها هنوز محلی‌اند (B-03).** هویت و نقش سمت سرور تأیید می‌شوند، اما جلسات، پرداخت‌ها و برنامه‌ها همچنان در `localStorage` همان مرورگر هستند. تا B-03، کاربری که به مرورگر دسترسی دارد می‌تواند دادهٔ محلی را دست‌کاری کند. فقط دادهٔ ابری با RLS محافظت می‌شود.
- **`server.ts` با Firebase Admin کار می‌کند** و در استقرار Cloudflare Workers اجرا نمی‌شود. در این تغییر به آن دست نخورده است.
- **رابط کاربری «افزودن مربی/عضو» و «تغییر رمز» هنوز ساخته نشده است.** API آن (`addTrainer`، `addMember`، `createLoginAccount`) آماده است.
