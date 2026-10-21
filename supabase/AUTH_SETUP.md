# راه‌اندازی Supabase — احراز هویت (B-01) و دادهٔ چندباشگاهی (B-03)

وقتی `VITE_SUPABASE_URL` و کلید anon تنظیم شده باشند:

- ورود **فقط** از Supabase Auth انجام می‌شود، با شمارهٔ موبایل و رمز. حساب‌های دمو پذیرفته نمی‌شوند.
- نقش و باشگاه کاربر از جدول `profiles` خوانده می‌شود.
- دادهٔ هر باشگاه در `app_gyms` و `app_records` ذخیره می‌شود و RLS آن را جدا نگه می‌دارد.
- هیچ رمز یا دادهٔ باشگاهی روی دستگاه کاربر نمی‌ماند.

بدون Supabase، برنامه دموی محلی است. در build توسعه، `VITE_AUTH_MODE=demo` دمو را حتی با Supabase برمی‌گرداند. build تولیدی این تنظیم را نادیده می‌گیرد.

## نقش‌ها

| نقش | می‌سازد |
| :--- | :--- |
| مدیر کل (`super_admin`) | باشگاه + مدیر باشگاه (در پنل `/admin`) |
| مدیر باشگاه (`gym_owner`) | مربی، ورزشکار با بسته؛ تغییر رمز و غیرفعال‌سازی آن‌ها |
| مربی (`trainer`) | ورزشکار فقط با پروفایل. ورزشکار به همان مربی وصل می‌شود و تا وقتی مدیر بسته را تعیین نکند رزرو ندارد |
| ورزشکار (`member`) | — |

## ۱. migrationها

به ترتیب در SQL Editor اجرا کنید (یا با `supabase db push`):

1. `migrations/20260921000000_core_schema.sql`
2. `migrations/20260921000001_rls_policies.sql`
3. `migrations/20260921000002_complete_workout_rpc.sql`
4. `migrations/20260921000003_gym_management_refactor.sql`
5. `migrations/20261021000000_revoke_public_access.sql`
6. `migrations/20261022000000_supabase_auth.sql`
7. `migrations/20261023000000_gym_tenant_data.sql`

## ۲. تنظیمات Auth در داشبورد

- **Authentication → Sign In / Providers → Email:** گزینهٔ **Allow new users to sign up** را خاموش کنید. حساب‌ها فقط با Edge Function ساخته می‌شوند.

## ۳. Edge Function

```bash
supabase functions deploy manage-account
supabase secrets set AUTH_EMAIL_DOMAIN=accounts.homegym.app
```

مقدار `AUTH_EMAIL_DOMAIN` باید با `VITE_AUTH_EMAIL_DOMAIN` در Cloudflare یکی باشد. ایمیل Auth هر کاربر `<موبایل>@<دامنه>` است، مثلاً `09121234567@accounts.homegym.app`.

## ۴. ساخت مدیر کل (یک بار)

1. **Authentication → Users → Add user:**
   - ایمیل: `<موبایل شما>@accounts.homegym.app`
   - یک رمز قوی
   - تیک **Auto Confirm User** را بزنید.
2. شناسهٔ (UUID) کاربر را کپی کنید و در SQL Editor اجرا کنید:

```sql
INSERT INTO public.profiles (id, full_name, phone, role, tenant_id, username)
VALUES ('<USER-UUID>', 'مدیر کل', '<موبایل شما>', 'super_admin', NULL, '<موبایل شما>');
```

3. با موبایل و رمز وارد شوید. در پنل **باشگاه‌ها**، دکمهٔ **باشگاه جدید** باشگاه و حساب مدیر آن را با هم می‌سازد.

بعد از آن، مدیر هر باشگاه مربیان و ورزشکاران را از داخل برنامه می‌سازد. دیگر به SQL نیازی نیست.

## ۵. Cloudflare

در **Settings → Build → Variables and secrets** این سه متغیر را اضافه کنید و یک build تازه بگیرید:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_AUTH_EMAIL_DOMAIN=accounts.homegym.app`

## محدودیت‌های فعلی

- **رزرو توسط ورزشکار:** ورزشکار نوبت‌های دیگران را نمی‌بیند (حریم خصوصی). به همین دلیل وقتی خودش نوبتی را جابه‌جا می‌کند، کنترل ظرفیت سمت مرورگر کامل نیست. ثبت نوبت تازه فقط با مدیر یا مربی است.
- **همگام‌سازی:** همگام‌سازی «آخرین نوشتن برنده است». اگر دو نفر هم‌زمان یک رکورد را ویرایش کنند، تغییر دومی می‌ماند.
- **`server.ts`:** با Firebase کار می‌کند و در استقرار Cloudflare اجرا نمی‌شود.
- **دادهٔ قدیمی:** جداول قدیمی `full_schema_setup.sql` (`gyms`، `members`، …) دیگر خوانده نمی‌شوند. اگر روی پروژه دادهٔ واقعی دارید، انتقال آن به `app_records` جداگانه لازم است.
