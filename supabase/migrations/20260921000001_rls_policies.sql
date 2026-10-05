-- Home Gym Multi-Tenant Platform — Row Level Security (RLS) Policies
-- PRD V4.1 Section 47.4 & Section 48

CREATE SCHEMA IF NOT EXISTS private;

-- 1. Tenant Authorization Helper
CREATE OR REPLACE FUNCTION private.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT tenant_id
  FROM public.profiles
  WHERE id = (SELECT auth.uid())
    AND is_active = true
$$;

REVOKE EXECUTE ON FUNCTION private.current_tenant_id() FROM public;
GRANT EXECUTE ON FUNCTION private.current_tenant_id() TO authenticated;

-- 2. Role Authorization Helper
CREATE OR REPLACE FUNCTION private.has_role(requested_role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = requested_role
      AND p.is_active = true
  )
$$;

REVOKE EXECUTE ON FUNCTION private.has_role(public.app_role) FROM public;
GRANT EXECUTE ON FUNCTION private.has_role(public.app_role) TO authenticated;

-- 3. Enable RLS on all Tenant-Scoped Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Profiles
CREATE POLICY "profiles_read_own_tenant"
ON public.profiles FOR SELECT TO authenticated
USING (
  tenant_id = (SELECT private.current_tenant_id())
  OR (SELECT private.has_role('super_admin'))
  OR id = (SELECT auth.uid())
);

CREATE POLICY "profiles_owner_write"
ON public.profiles FOR ALL TO authenticated
USING (
  (tenant_id = (SELECT private.current_tenant_id()) AND (SELECT private.has_role('gym_owner')))
  OR (SELECT private.has_role('super_admin'))
);

-- 5. RLS Policies: Workout Sessions
CREATE POLICY "sessions_tenant_isolation"
ON public.workout_sessions FOR SELECT TO authenticated
USING (
  tenant_id = (SELECT private.current_tenant_id())
  OR (SELECT private.has_role('super_admin'))
);

CREATE POLICY "sessions_write_authorized"
ON public.workout_sessions FOR ALL TO authenticated
USING (
  tenant_id = (SELECT private.current_tenant_id())
  AND (
    (SELECT private.has_role('gym_owner'))
    OR (SELECT private.has_role('trainer'))
    OR member_id = (SELECT auth.uid())
  )
);

-- 6. RLS Policies: Workout Segments
CREATE POLICY "segments_tenant_isolation"
ON public.workout_segments FOR SELECT TO authenticated
USING (
  tenant_id = (SELECT private.current_tenant_id())
  OR (SELECT private.has_role('super_admin'))
);

CREATE POLICY "segments_write_authorized"
ON public.workout_segments FOR ALL TO authenticated
USING (
  tenant_id = (SELECT private.current_tenant_id())
  AND (
    (SELECT private.has_role('gym_owner'))
    OR trainer_id = (SELECT auth.uid())
  )
);

-- 7. RLS Policies: Set Logs
CREATE POLICY "set_logs_tenant_isolation"
ON public.set_logs FOR SELECT TO authenticated
USING (
  tenant_id = (SELECT private.current_tenant_id())
  OR (SELECT private.has_role('super_admin'))
);

CREATE POLICY "set_logs_write"
ON public.set_logs FOR ALL TO authenticated
USING (
  tenant_id = (SELECT private.current_tenant_id())
);

-- 8. RLS Policies: Member Subscriptions & Credit Ledger
CREATE POLICY "subscriptions_read"
ON public.member_subscriptions FOR SELECT TO authenticated
USING (
  tenant_id = (SELECT private.current_tenant_id())
  AND (
    (SELECT private.has_role('gym_owner'))
    OR member_id = (SELECT auth.uid())
  )
);

CREATE POLICY "credit_ledger_read"
ON public.credit_ledger FOR SELECT TO authenticated
USING (
  tenant_id = (SELECT private.current_tenant_id())
  AND (
    (SELECT private.has_role('gym_owner'))
    OR EXISTS (
      SELECT 1 FROM public.member_subscriptions ms
      WHERE ms.id = credit_ledger.subscription_id
        AND ms.member_id = (SELECT auth.uid())
    )
  )
);

-- Note: Direct INSERT/UPDATE on credit_ledger from client is restricted; mutations occur via complete_workout RPC.
