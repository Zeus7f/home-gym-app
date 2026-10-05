-- Home Gym Multi-Tenant Platform — Supabase Native Core Schema DDL
-- PRD V4.1 Section 8 & Section 47

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Enums
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'archived');
CREATE TYPE app_role AS ENUM ('super_admin', 'gym_owner', 'trainer', 'member');
CREATE TYPE session_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE segment_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
CREATE TYPE segment_category AS ENUM ('cardio', 'functional', 'strength', 'mobility', 'hiit', 'cooldown', 'rehab');
CREATE TYPE proposal_status AS ENUM ('draft', 'generated', 'user_review', 'approved', 'applied', 'discarded', 'reverted');

-- 1. Tenants (Facilities)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  phone VARCHAR(50),
  address TEXT,
  status tenant_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tenant Settings
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL DEFAULT 'en-US',
  theme VARCHAR(20) NOT NULL DEFAULT 'system',
  cancellation_window_hours INT NOT NULL DEFAULT 12,
  no_show_deduct_credit BOOLEAN NOT NULL DEFAULT true,
  features JSONB NOT NULL DEFAULT '{"ai_coach": true, "web_push": true, "rpe_rir": true, "offline_workout": true, "muscle_balance": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Profiles (Maps auth.users.id to tenant_id & role)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_path TEXT,
  role app_role NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profile_tenant_rule CHECK (
    (role = 'super_admin' AND tenant_id IS NULL)
    OR
    (role <> 'super_admin' AND tenant_id IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS profiles_tenant_role_idx ON public.profiles(tenant_id, role);

-- 4. Trainer Profiles
CREATE TABLE IF NOT EXISTS public.trainer_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT,
  color_accent VARCHAR(20) DEFAULT '#0D9488',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Member Profiles
CREATE TABLE IF NOT EXISTS public.member_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  goals TEXT[] NOT NULL DEFAULT '{}',
  experience_level VARCHAR(50) DEFAULT 'regular',
  limitations TEXT[] NOT NULL DEFAULT '{}',
  emergency_contact TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Trainer Assignments (Supports 1-2 coaches per member with specialties)
CREATE TABLE IF NOT EXISTS public.trainer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialty VARCHAR(100) NOT NULL, -- e.g. 'Cardio & Conditioning', 'Strength & Hypertrophy'
  is_primary BOOLEAN NOT NULL DEFAULT false,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, trainer_id, specialty)
);
CREATE INDEX IF NOT EXISTS idx_trainer_assignments_member ON public.trainer_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_trainer_assignments_trainer ON public.trainer_assignments(trainer_id);

-- 7. Subscription Plans (Package template)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sessions_included INT NOT NULL,
  duration_days INT NOT NULL,
  price_cents INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Member Subscriptions (Package instance)
CREATE TABLE IF NOT EXISTS public.member_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  credits_total INT NOT NULL,
  credits_used INT NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT credits_non_negative CHECK (credits_used <= credits_total)
);
CREATE INDEX IF NOT EXISTS idx_member_subscriptions_member ON public.member_subscriptions(member_id, is_active);

-- 9. Workout Sessions (Master Session: 1 visit per member)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  scheduled_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  status session_status NOT NULL DEFAULT 'scheduled',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_date ON public.workout_sessions(tenant_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sessions_member ON public.workout_sessions(member_id, scheduled_date);

-- 10. Credit Ledger (Immutable source of truth for all credit movements)
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.member_subscriptions(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  delta INT NOT NULL, -- -1 for session completed, +N for package renewal/adjustment
  reason VARCHAR(100) NOT NULL, -- 'workout_completed', 'package_purchase', 'admin_adjustment', 'refund'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_sub ON public.credit_ledger(subscription_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_session ON public.credit_ledger(session_id);

-- 11. Workout Segments (Segments inside a master session)
CREATE TABLE IF NOT EXISTS public.workout_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  category segment_category NOT NULL,
  sequence_order INT NOT NULL,
  status segment_status NOT NULL DEFAULT 'pending',
  target_duration_seconds INT,
  trainer_notes TEXT,
  safety_context TEXT, -- Context for the subsequent coach
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, sequence_order)
);
CREATE INDEX IF NOT EXISTS idx_segments_session ON public.workout_segments(session_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_segments_trainer ON public.workout_segments(trainer_id);

-- 12. Muscles & Taxonomy
CREATE TABLE IF NOT EXISTS public.muscles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  region VARCHAR(50) NOT NULL, -- 'chest', 'back', 'legs', 'shoulders', 'arms', 'core'
  description TEXT
);

-- 13. Equipment Taxonomy
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL -- 'barbell', 'dumbbell', 'kettlebell', 'cable', 'machine', 'bodyweight', 'cardio'
);

-- 14. Exercise Catalog
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL for global system exercises
  name VARCHAR(255) NOT NULL,
  category segment_category NOT NULL,
  instructions TEXT,
  media_url TEXT,
  is_compound BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON public.exercises(category);

-- 15. Exercise Muscle Contributions (for effective sets calculation)
CREATE TABLE IF NOT EXISTS public.exercise_muscles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  muscle_id UUID NOT NULL REFERENCES public.muscles(id) ON DELETE CASCADE,
  weight NUMERIC(3,2) NOT NULL DEFAULT 1.00, -- 1.0 = primary, 0.5 = secondary/stabilizer
  UNIQUE(exercise_id, muscle_id)
);

-- 16. Segment Items (Prescribed exercises within a segment)
CREATE TABLE IF NOT EXISTS public.segment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES public.workout_segments(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  custom_exercise_name VARCHAR(255),
  item_order INT NOT NULL,
  target_sets INT NOT NULL DEFAULT 3,
  target_reps_min INT,
  target_reps_max INT,
  target_load_kg NUMERIC(8,2),
  target_duration_seconds INT,
  rest_seconds INT DEFAULT 90,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(segment_id, item_order)
);
CREATE INDEX IF NOT EXISTS idx_segment_items_segment ON public.segment_items(segment_id, item_order);

-- 17. Set Logs (Actual performed sets normalized)
CREATE TABLE IF NOT EXISTS public.set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  segment_item_id UUID NOT NULL REFERENCES public.segment_items(id) ON DELETE CASCADE,
  set_number INT NOT NULL,
  reps INT,
  load_kg NUMERIC(8,2),
  duration_seconds INT,
  rpe NUMERIC(3,1), -- 0-10 Rate of Perceived Exertion
  rir NUMERIC(3,1), -- Reps in Reserve
  is_warmup BOOLEAN NOT NULL DEFAULT false,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(segment_item_id, set_number)
);
CREATE INDEX IF NOT EXISTS idx_setlogs_item ON public.set_logs(segment_item_id, set_number);

-- 18. Personal Records (PR Facts)
CREATE TABLE IF NOT EXISTS public.personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  pr_type VARCHAR(50) NOT NULL, -- 'max_weight', 'max_reps', 'est_1rm', 'max_volume'
  value NUMERIC(10,2) NOT NULL,
  set_log_id UUID REFERENCES public.set_logs(id) ON DELETE SET NULL,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, exercise_id, pr_type)
);
CREATE INDEX IF NOT EXISTS idx_pr_member_exercise ON public.personal_records(member_id, exercise_id);

-- 19. Routines & Templates
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  goal VARCHAR(100),
  progression_policy JSONB DEFAULT '{"type": "linear", "load_increment_kg": 2.5}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. AI Coach Proposals & Snapshots
CREATE TABLE IF NOT EXISTS public.ai_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status proposal_status NOT NULL DEFAULT 'draft',
  summary TEXT NOT NULL,
  rationale TEXT[] NOT NULL DEFAULT '{}',
  changes JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings TEXT[] NOT NULL DEFAULT '{}',
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES public.ai_proposals(id) ON DELETE SET NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'ai_coach_apply',
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. Audit Events (Immutable compliance trail)
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_action ON public.audit_events(tenant_id, action, created_at);
