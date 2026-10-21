-- ============================================================================
-- B-03: دادهٔ ابری چندباشگاهی
--
-- پیش‌نیاز: 20261022000000_supabase_auth.sql
--
-- مدل:
--   * app_gyms     — یک باشگاه برای هر tenant (نام، فعال بودن، تنظیمات).
--   * app_records  — رکوردهای دامنهٔ برنامه به‌صورت سند JSONB، با ستون‌های
--                    member_id و trainer_id برای RLS. انواع: trainer، member، session،
--                    payment، payout، adjustment، program، capacity، exercise، audit.
--
-- شکل داده همان مدل `src/lib/domain/gymManagement.ts` است، بنابراین تاریخ جلالی،
-- ست‌های ثبت‌شده و برنامه‌های تمرینی بدون تبدیل ذخیره می‌شوند.
-- نام جداول با پیشوند app_ است تا با جداول قدیمی full_schema_setup.sql
-- (gyms، members، …) که ممکن است روی پروژه اجرا شده باشد برخورد نکند.
--
-- profiles.app_entity_id شناسهٔ رکورد مربی/عضو (و برای مدیر، شناسهٔ باشگاه) است.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.app_gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- capacity، hourlyCapacity، currency، noShowDeductsSession
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_records (
  gym_id UUID NOT NULL REFERENCES public.app_gyms(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN (
    'trainer', 'member', 'session', 'payment', 'payout',
    'adjustment', 'program', 'capacity', 'exercise', 'audit'
  )),
  id TEXT NOT NULL,
  member_id TEXT,
  trainer_id TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID DEFAULT auth.uid(),
  PRIMARY KEY (gym_id, kind, id)
);
CREATE INDEX IF NOT EXISTS app_records_member_idx ON public.app_records(gym_id, member_id);
CREATE INDEX IF NOT EXISTS app_records_trainer_idx ON public.app_records(gym_id, trainer_id);

-- ── توابع کمکی ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION private.current_gym_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT g.id FROM public.app_gyms g
  WHERE g.tenant_id = (SELECT private.current_tenant_id()) AND g.is_active = true
$$;

CREATE OR REPLACE FUNCTION private.current_entity_id()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT app_entity_id FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_active = true
$$;

REVOKE EXECUTE ON FUNCTION private.current_gym_id() FROM public;
REVOKE EXECUTE ON FUNCTION private.current_entity_id() FROM public;
GRANT EXECUTE ON FUNCTION private.current_gym_id() TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_entity_id() TO authenticated;

-- ── app_gyms ────────────────────────────────────────────────────────────────
ALTER TABLE public.app_gyms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_gyms_read" ON public.app_gyms;
CREATE POLICY "app_gyms_read" ON public.app_gyms FOR SELECT TO authenticated
USING (
  tenant_id = (SELECT private.current_tenant_id())
  OR (SELECT private.has_role('super_admin'))
);

-- مدیر فقط تنظیمات باشگاه خودش را تغییر می‌دهد؛ فعال/غیرفعال کردن با مدیر کل است.
DROP POLICY IF EXISTS "app_gyms_owner_update" ON public.app_gyms;
CREATE POLICY "app_gyms_owner_update" ON public.app_gyms FOR UPDATE TO authenticated
USING (id = (SELECT private.current_gym_id()) AND (SELECT private.has_role('gym_owner')))
WITH CHECK (id = (SELECT private.current_gym_id()) AND (SELECT private.has_role('gym_owner')));

DROP POLICY IF EXISTS "app_gyms_super_admin" ON public.app_gyms;
CREATE POLICY "app_gyms_super_admin" ON public.app_gyms FOR ALL TO authenticated
USING ((SELECT private.has_role('super_admin')))
WITH CHECK ((SELECT private.has_role('super_admin')));

CREATE OR REPLACE FUNCTION private.guard_gym_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT private.has_role('super_admin') AND (NEW.is_active IS DISTINCT FROM OLD.is_active
     OR NEW.tenant_id IS DISTINCT FROM OLD.tenant_id) THEN
    RAISE EXCEPTION 'only the platform administrator can change gym status';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS app_gyms_guard ON public.app_gyms;
CREATE TRIGGER app_gyms_guard BEFORE UPDATE ON public.app_gyms
FOR EACH ROW EXECUTE FUNCTION private.guard_gym_update();

-- ── app_records: خواندن ─────────────────────────────────────────────────────
ALTER TABLE public.app_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "records_read" ON public.app_records;
CREATE POLICY "records_read" ON public.app_records FOR SELECT TO authenticated
USING (
  (SELECT private.has_role('super_admin'))
  OR (
    gym_id = (SELECT private.current_gym_id())
    AND (
      (SELECT private.has_role('gym_owner'))
      -- مربی: همه‌چیز به جز امور مالی و ممیزی
      OR ((SELECT private.has_role('trainer')) AND kind NOT IN ('payment', 'payout', 'audit'))
      -- ورزشکار: دادهٔ خودش، و فهرست مربیان، حرکات و ظرفیت‌ها
      OR (
        (SELECT private.has_role('member'))
        AND (
          (kind = 'member' AND id = (SELECT private.current_entity_id()))
          OR (kind IN ('session', 'program', 'adjustment', 'payment')
              AND member_id = (SELECT private.current_entity_id()))
          OR kind IN ('trainer', 'exercise', 'capacity')
        )
      )
    )
  )
);

-- ── app_records: نوشتن ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "records_owner_write" ON public.app_records;
CREATE POLICY "records_owner_write" ON public.app_records FOR ALL TO authenticated
USING (
  (SELECT private.has_role('super_admin'))
  OR (gym_id = (SELECT private.current_gym_id()) AND (SELECT private.has_role('gym_owner')))
)
WITH CHECK (
  (SELECT private.has_role('super_admin'))
  OR (gym_id = (SELECT private.current_gym_id()) AND (SELECT private.has_role('gym_owner')))
);

-- مربی: جلسه و برنامهٔ خودش، حرکات سفارشی، ممیزی، و ورزشکارِ تازه با بستهٔ معلق
DROP POLICY IF EXISTS "records_trainer_insert" ON public.app_records;
CREATE POLICY "records_trainer_insert" ON public.app_records FOR INSERT TO authenticated
WITH CHECK (
  gym_id = (SELECT private.current_gym_id())
  AND (SELECT private.has_role('trainer'))
  AND (
    (kind IN ('session', 'program') AND trainer_id = (SELECT private.current_entity_id()))
    OR kind IN ('exercise', 'audit')
    OR (
      kind = 'member'
      AND trainer_id = (SELECT private.current_entity_id())
      AND (data->>'packagePending')::boolean IS TRUE
      AND COALESCE((data->>'packagePrice')::numeric, 0) = 0
      AND COALESCE((data->>'paidAmount')::numeric, 0) = 0
      AND COALESCE((data->>'totalSessions')::numeric, 0) = 0
    )
  )
);

DROP POLICY IF EXISTS "records_trainer_update" ON public.app_records;
CREATE POLICY "records_trainer_update" ON public.app_records FOR UPDATE TO authenticated
USING (
  gym_id = (SELECT private.current_gym_id())
  AND (SELECT private.has_role('trainer'))
  AND (
    (kind IN ('session', 'program') AND trainer_id = (SELECT private.current_entity_id()))
    OR kind = 'exercise'
    -- تکمیل جلسه شمارندهٔ جلسات ورزشکار و کارکرد مربی را تغییر می‌دهد (محدود با trigger).
    -- مربی جانشین (انتقال روزانه) هم جلسهٔ ورزشکارِ مربی دیگر را تکمیل می‌کند.
    OR kind = 'member'
    OR (kind = 'trainer' AND id = (SELECT private.current_entity_id()))
  )
)
WITH CHECK (
  gym_id = (SELECT private.current_gym_id())
  AND (SELECT private.has_role('trainer'))
);

DROP POLICY IF EXISTS "records_trainer_delete" ON public.app_records;
CREATE POLICY "records_trainer_delete" ON public.app_records FOR DELETE TO authenticated
USING (
  gym_id = (SELECT private.current_gym_id())
  AND (SELECT private.has_role('trainer'))
  AND (
    (kind = 'program' AND trainer_id = (SELECT private.current_entity_id()))
    OR (kind = 'exercise' AND (data->>'isCustom')::boolean IS TRUE)
  )
);

-- ورزشکار: جابه‌جایی و لغو نوبت‌های خودش (نوبت تازه را مدیر یا مربی ثبت می‌کند)
DROP POLICY IF EXISTS "records_member_sessions" ON public.app_records;
CREATE POLICY "records_member_sessions" ON public.app_records FOR INSERT TO authenticated
WITH CHECK (
  gym_id = (SELECT private.current_gym_id())
  AND (SELECT private.has_role('member'))
  AND kind = 'audit'
);

DROP POLICY IF EXISTS "records_member_sessions_update" ON public.app_records;
CREATE POLICY "records_member_sessions_update" ON public.app_records FOR UPDATE TO authenticated
USING (
  gym_id = (SELECT private.current_gym_id())
  AND (SELECT private.has_role('member'))
  AND kind = 'session' AND member_id = (SELECT private.current_entity_id())
)
WITH CHECK (
  gym_id = (SELECT private.current_gym_id())
  AND (SELECT private.has_role('member'))
  AND kind = 'session' AND member_id = (SELECT private.current_entity_id())
);

-- ── محافظ فیلدها: مربی و ورزشکار فقط فیلدهای مجاز را تغییر می‌دهند ─────────
CREATE OR REPLACE FUNCTION private.guard_record_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  allowed TEXT[];
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();

  IF private.has_role('super_admin') OR private.has_role('gym_owner') THEN
    RETURN NEW;
  END IF;

  IF NEW.gym_id IS DISTINCT FROM OLD.gym_id OR NEW.kind IS DISTINCT FROM OLD.kind
     OR NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'record identity cannot change';
  END IF;

  IF NEW.kind = 'member' THEN
    -- مربی هنگام تکمیل جلسه فقط شمارنده‌ها را جابه‌جا می‌کند؛ بسته، قیمت و مربی دست‌نخورده می‌مانند.
    allowed := ARRAY['usedSessions', 'remainingSessions', 'status'];
  ELSIF NEW.kind = 'trainer' THEN
    allowed := ARRAY['completedSessions', 'outstandingCompensation'];
  ELSIF NEW.kind = 'session' AND private.has_role('member') THEN
    -- ورزشکار فقط زمان و وضعیت نوبت را تغییر می‌دهد، نه مربی یا حرکات ثبت‌شده را
    allowed := ARRAY['date', 'time', 'status', '_bucket'];
  ELSE
    RETURN NEW;
  END IF;

  IF (NEW.data - allowed) IS DISTINCT FROM (OLD.data - allowed)
     OR NEW.member_id IS DISTINCT FROM OLD.member_id
     OR NEW.trainer_id IS DISTINCT FROM OLD.trainer_id THEN
    RAISE EXCEPTION 'not allowed to change these fields';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS app_records_guard ON public.app_records;
CREATE TRIGGER app_records_guard BEFORE UPDATE ON public.app_records
FOR EACH ROW EXECUTE FUNCTION private.guard_record_update();

-- ── profiles: مربی ورزشکاران خودش را در فهرست حساب‌ها می‌بیند ─────────────
-- (policy موجود profiles_read_own_tenant خواندن پروفایل‌های همان باشگاه را می‌دهد.)
