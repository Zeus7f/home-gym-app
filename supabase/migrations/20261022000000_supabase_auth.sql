-- ============================================================================
-- B-01: احراز هویت سمت سرور با Supabase Auth روی schema چندمستأجری
--
-- پیش‌نیاز: migrationهای 20260921000000 و 20260921000001 (profiles و RLS).
--
-- تغییرات:
--   * profiles.username — ورود با نام کاربری. ایمیل Auth از روی آن ساخته می‌شود
--     (username@<VITE_AUTH_EMAIL_DOMAIN>)، بنابراین RPC عمومی برای پیدا کردن ایمیل
--     لازم نیست و امکان شمارش کاربران از بیرون وجود ندارد.
--   * profiles.app_entity_id — پیوند موقت به شناسهٔ مربی/عضو در دادهٔ محلی برنامه
--     (مثل t-ali یا m-reza) تا وقتی B-03 داده‌ها را به جداول ابری منتقل نکرده است.
--   * policy نوشتن profiles با WITH CHECK صریح: مدیر فقط می‌تواند پروفایل مربی/عضو
--     در باشگاه خودش بسازد یا تغییر دهد و نمی‌تواند نقش کسی را به مدیر ارتقا دهد.
--   * خواندن tenant و tenant_settings برای اعضای همان باشگاه.
--
-- ساخت حساب برای مربی/عضو با service role و از طریق Edge Function
-- supabase/functions/manage-account انجام می‌شود، نه از مرورگر.
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username CITEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS app_entity_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key
  ON public.profiles(username) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_tenant_entity_key
  ON public.profiles(tenant_id, app_entity_id) WHERE app_entity_id IS NOT NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_format;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format
  CHECK (username IS NULL OR username ~ '^[a-z0-9][a-z0-9._-]{2,62}$');

-- ── profiles: نوشتن فقط برای مدیر همان باشگاه، بدون ارتقای نقش ──────────────
DROP POLICY IF EXISTS "profiles_owner_write" ON public.profiles;

CREATE POLICY "profiles_owner_write"
ON public.profiles FOR ALL TO authenticated
USING (
  (
    tenant_id = (SELECT private.current_tenant_id())
    AND (SELECT private.has_role('gym_owner'))
    AND (role IN ('trainer', 'member') OR id = (SELECT auth.uid()))
  )
  OR (SELECT private.has_role('super_admin'))
)
WITH CHECK (
  (
    tenant_id = (SELECT private.current_tenant_id())
    AND (SELECT private.has_role('gym_owner'))
    AND (
      role IN ('trainer', 'member')
      -- مدیر می‌تواند نام و تلفن خودش را ویرایش کند، اما نقش خودش را نه
      OR (id = (SELECT auth.uid()) AND role = 'gym_owner')
    )
  )
  OR (SELECT private.has_role('super_admin'))
);

-- ── tenants و tenant_settings: خواندن برای کاربران همان باشگاه ─────────────
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenants_read_own" ON public.tenants;
CREATE POLICY "tenants_read_own"
ON public.tenants FOR SELECT TO authenticated
USING (
  id = (SELECT private.current_tenant_id())
  OR (SELECT private.has_role('super_admin'))
);

DROP POLICY IF EXISTS "tenant_settings_read_own" ON public.tenant_settings;
CREATE POLICY "tenant_settings_read_own"
ON public.tenant_settings FOR SELECT TO authenticated
USING (
  tenant_id = (SELECT private.current_tenant_id())
  OR (SELECT private.has_role('super_admin'))
);

DROP POLICY IF EXISTS "tenant_settings_owner_write" ON public.tenant_settings;
CREATE POLICY "tenant_settings_owner_write"
ON public.tenant_settings FOR UPDATE TO authenticated
USING (
  tenant_id = (SELECT private.current_tenant_id())
  AND (SELECT private.has_role('gym_owner'))
)
WITH CHECK (
  tenant_id = (SELECT private.current_tenant_id())
  AND (SELECT private.has_role('gym_owner'))
);

-- ── ثبت نام عمومی بسته است ─────────────────────────────────────────────────
-- در داشبورد Supabase: Authentication → Providers → Email → «Allow new users to sign up» را خاموش کنید.
-- حتی اگر روشن بماند، کاربر بدون ردیف profiles هیچ نقشی نمی‌گیرد و برنامه ورودش را رد می‌کند.
