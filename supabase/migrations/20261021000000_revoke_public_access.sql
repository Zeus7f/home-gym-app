-- ============================================================================
-- B-02 hotfix: revoke anonymous read/write access created by full_schema_setup.sql
--
-- نسخهٔ قبلی supabase/full_schema_setup.sql روی همهٔ جداول policy
-- «FOR ALL USING (true) WITH CHECK (true)» می‌ساخت. اگر آن اسکریپت روی پروژهٔ Supabase
-- اجرا شده است، این migration را یک بار در SQL Editor اجرا کنید.
--
-- نتیجه:
--   * anon دیگر هیچ دسترسی نوشتنی ندارد.
--   * فقط exercises و gyms برای anon/authenticated «فقط خواندنی» هستند.
--   * members، trainers، daily_sessions، session_exercises، financial_records،
--     audit_logs و app_users تا پیاده‌سازی Supabase Auth بسته می‌مانند
--     (فقط service role).
--
-- این اسکریپت idempotent است و اگر جدولی وجود نداشته باشد، از آن رد می‌شود.
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'gyms', 'trainers', 'members', 'exercises', 'daily_sessions',
    'session_exercises', 'financial_records', 'audit_logs', 'app_users'
  ]
  LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Public access for ' || tbl, tbl);
    END IF;
  END LOOP;

  IF to_regclass('public.exercises') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Read-only catalog for exercises" ON public.exercises;
    CREATE POLICY "Read-only catalog for exercises" ON public.exercises
      FOR SELECT TO anon, authenticated USING (true);
  END IF;

  IF to_regclass('public.gyms') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Read-only profile for gyms" ON public.gyms;
    CREATE POLICY "Read-only profile for gyms" ON public.gyms
      FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;
