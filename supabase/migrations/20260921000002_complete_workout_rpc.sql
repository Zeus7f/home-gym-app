-- Home Gym Multi-Tenant Platform — Atomic Idempotent Workout Completion RPC
-- PRD V4.1 Section 9 & Section 49.1

CREATE OR REPLACE FUNCTION public.complete_workout(
  p_session_id UUID,
  p_subscription_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_tenant UUID;
  v_session_status public.session_status;
  v_member_id UUID;
  v_sub_member_id UUID;
  v_credits_total INT;
  v_credits_used INT;
  v_actor_id UUID;
BEGIN
  v_actor_id := (SELECT auth.uid());
  v_tenant := (SELECT private.current_tenant_id());

  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED_NO_TENANT_CONTEXT';
  END IF;

  -- 1. Lock the session row to prevent race conditions and concurrent deductions
  SELECT status, member_id
  INTO v_session_status, v_member_id
  FROM public.workout_sessions
  WHERE id = p_session_id
    AND tenant_id = v_tenant
  FOR UPDATE;

  IF v_session_status IS NULL THEN
    RAISE EXCEPTION 'SESSION_NOT_FOUND';
  END IF;

  -- 2. Idempotency Guard: If already completed, do NOT deduct credits again
  IF v_session_status = 'completed' THEN
    RETURN jsonb_build_object(
      'idempotent', true,
      'status', 'already_completed',
      'session_id', p_session_id,
      'message', 'Session was previously completed. No additional credits deducted.'
    );
  END IF;

  -- 3. Lock and validate the subscription
  SELECT member_id, credits_total, credits_used
  INTO v_sub_member_id, v_credits_total, v_credits_used
  FROM public.member_subscriptions
  WHERE id = p_subscription_id
    AND tenant_id = v_tenant
    AND is_active = true
  FOR UPDATE;

  IF v_sub_member_id IS NULL THEN
    RAISE EXCEPTION 'ACTIVE_SUBSCRIPTION_NOT_FOUND';
  END IF;

  IF v_sub_member_id <> v_member_id THEN
    RAISE EXCEPTION 'SUBSCRIPTION_MEMBER_MISMATCH';
  END IF;

  IF v_credits_used >= v_credits_total THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  -- 4. Insert exactly one immutable credit ledger record (-1 billable session)
  INSERT INTO public.credit_ledger (
    id,
    tenant_id,
    subscription_id,
    session_id,
    delta,
    reason,
    metadata
  ) VALUES (
    gen_random_uuid(),
    v_tenant,
    p_subscription_id,
    p_session_id,
    -1,
    'workout_completed',
    jsonb_build_object(
      'completed_by', v_actor_id,
      'completed_at', now(),
      'notes', p_notes
    )
  );

  -- 5. Increment cached aggregate credits_used
  UPDATE public.member_subscriptions
  SET credits_used = credits_used + 1,
      updated_at = now()
  WHERE id = p_subscription_id;

  -- 6. Mark all pending/in_progress segments as completed
  UPDATE public.workout_segments
  SET status = 'completed',
      completed_at = COALESCE(completed_at, now()),
      updated_at = now()
  WHERE session_id = p_session_id
    AND status IN ('pending', 'in_progress');

  -- 7. Mark session completed
  UPDATE public.workout_sessions
  SET status = 'completed',
      completed_at = now(),
      notes = COALESCE(p_notes, notes),
      updated_at = now()
  WHERE id = p_session_id;

  -- 8. Write audit event
  INSERT INTO public.audit_events (
    tenant_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    v_tenant,
    v_actor_id,
    'workout_completed',
    'workout_session',
    p_session_id,
    jsonb_build_object(
      'subscription_id', p_subscription_id,
      'credits_remaining', v_credits_total - (v_credits_used + 1)
    )
  );

  RETURN jsonb_build_object(
    'idempotent', false,
    'status', 'completed',
    'session_id', p_session_id,
    'credits_deducted', 1,
    'credits_remaining', v_credits_total - (v_credits_used + 1)
  );
END;
$$;
