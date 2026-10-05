-- Home Gym Multi-Tenant Platform — Comprehensive Seed Data
-- PRD V4.1 Section 26

-- Fixed deterministic UUIDs for reference
-- Super Admin: 00000000-0000-0000-0000-000000000001
-- Tenant 1 (Iron Haven): 11111111-1111-1111-1111-111111111111
-- Tenant 2 (Peak Lab): 22222222-2222-2222-2222-222222222222
-- Owner: 10000000-0000-0000-0000-000000000001
-- Trainer 1 (Michael - Cardio): 10000000-0000-0000-0000-000000000002
-- Trainer 2 (Sarah - Strength): 10000000-0000-0000-0000-000000000003
-- Member 1 (Emma - Dual Coach): 10000000-0000-0000-0000-000000000004
-- Member 2 (David - Dual Coach): 10000000-0000-0000-0000-000000000005
-- Member 3 (Chloe): 10000000-0000-0000-0000-000000000006

-- 1. Insert Tenants
INSERT INTO public.tenants (id, name, slug, timezone, phone, address, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Iron Haven Boutique Gym', 'iron-haven', 'America/New_York', '+1 (555) 234-5678', '142 S 4th St, Brooklyn, NY', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Peak Performance Lab', 'peak-performance', 'America/Los_Angeles', '+1 (555) 876-5432', '890 Colorado Blvd, Santa Monica, CA', 'active')
ON CONFLICT (id) DO NOTHING;

-- Tenant Settings
INSERT INTO public.tenant_settings (tenant_id, locale, theme, cancellation_window_hours, no_show_deduct_credit, features)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'en-US', 'dark', 12, true, '{"ai_coach": true, "web_push": true, "rpe_rir": true, "offline_workout": true, "muscle_balance": true}'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'en-US', 'light', 24, true, '{"ai_coach": true, "web_push": true, "rpe_rir": true, "offline_workout": true, "muscle_balance": true}'::jsonb)
ON CONFLICT (tenant_id) DO NOTHING;

-- 2. Insert Profiles
INSERT INTO public.profiles (id, full_name, phone, role, tenant_id, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Alex Mercer', '+1 (555) 000-0001', 'super_admin', NULL, true),
  ('10000000-0000-0000-0000-000000000001', 'Marcus Vance', '+1 (555) 100-0001', 'gym_owner', '11111111-1111-1111-1111-111111111111', true),
  ('10000000-0000-0000-0000-000000000002', 'Coach Michael Reyes', '+1 (555) 100-0002', 'trainer', '11111111-1111-1111-1111-111111111111', true),
  ('10000000-0000-0000-0000-000000000003', 'Coach Sarah Jenkins', '+1 (555) 100-0003', 'trainer', '11111111-1111-1111-1111-111111111111', true),
  ('10000000-0000-0000-0000-000000000004', 'Emma Watson', '+1 (555) 100-0004', 'member', '11111111-1111-1111-1111-111111111111', true),
  ('10000000-0000-0000-0000-000000000005', 'David Miller', '+1 (555) 100-0005', 'member', '11111111-1111-1111-1111-111111111111', true),
  ('10000000-0000-0000-0000-000000000006', 'Chloe Bennett', '+1 (555) 100-0006', 'member', '11111111-1111-1111-1111-111111111111', true)
ON CONFLICT (id) DO NOTHING;

-- Trainer Profiles
INSERT INTO public.trainer_profiles (user_id, specialties, bio, color_accent)
VALUES
  ('10000000-0000-0000-0000-000000000002', ARRAY['Cardio & Conditioning', 'HIIT', 'Endurance'], 'Specialist in metabolic conditioning and VO2 max improvement.', '#0284C7'),
  ('10000000-0000-0000-0000-000000000003', ARRAY['Strength & Hypertrophy', 'Functional Movement', 'Rehab'], 'Certified CSCS coach focused on compound strength and joint longevity.', '#059669')
ON CONFLICT (user_id) DO NOTHING;

-- Member Profiles
INSERT INTO public.member_profiles (user_id, goals, experience_level, limitations)
VALUES
  ('10000000-0000-0000-0000-000000000004', ARRAY['Fat Loss', 'Strength Building', '5k Run Prep'], 'regular', ARRAY['Minor right shoulder impingement']),
  ('10000000-0000-0000-0000-000000000005', ARRAY['Hypertrophy', 'Core Stability'], 'intermediate', ARRAY['Lower back sensitivity on heavy deadlifts']),
  ('10000000-0000-0000-0000-000000000006', ARRAY['General Fitness', 'Mobility'], 'beginner', ARRAY[]::text[])
ON CONFLICT (user_id) DO NOTHING;

-- 3. Trainer Assignments (Dual-Coach Members)
INSERT INTO public.trainer_assignments (tenant_id, member_id, trainer_id, specialty, is_primary)
VALUES
  ('11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Cardio & Conditioning', true),
  ('11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'Strength & Hypertrophy', false),
  ('11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Cardio & Conditioning', false),
  ('11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'Strength & Hypertrophy', true)
ON CONFLICT DO NOTHING;

-- 4. Subscription Packages & Member Balances
INSERT INTO public.subscription_plans (id, tenant_id, name, sessions_included, duration_days, price_cents)
VALUES
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111', '15-Session Private Tier', 15, 60, 150000),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111', '10-Session Core Tier', 10, 45, 110000)
ON CONFLICT (id) DO NOTHING;

-- Emma Watson has 12 of 15 credits remaining (3 used)
INSERT INTO public.member_subscriptions (id, tenant_id, member_id, plan_id, credits_total, credits_used, starts_at, expires_at)
VALUES
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333301', 15, 3, now() - interval '14 days', now() + interval '46 days')
ON CONFLICT (id) DO NOTHING;

-- Initial Ledger Entries for Emma
INSERT INTO public.credit_ledger (tenant_id, subscription_id, delta, reason)
VALUES
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444401', 15, 'package_purchase'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444401', -1, 'workout_completed'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444401', -1, 'workout_completed'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444401', -1, 'workout_completed')
ON CONFLICT DO NOTHING;

-- 5. Muscles & Equipment Catalog
INSERT INTO public.muscles (id, name, region) VALUES
  ('55555555-5555-5555-5555-000000000001', 'Chest (Pectorals)', 'chest'),
  ('55555555-5555-5555-5555-000000000002', 'Lats (Back)', 'back'),
  ('55555555-5555-5555-5555-000000000003', 'Quads (Quadriceps)', 'legs'),
  ('55555555-5555-5555-5555-000000000004', 'Hamstrings & Glutes', 'legs'),
  ('55555555-5555-5555-5555-000000000005', 'Shoulders (Deltoids)', 'shoulders'),
  ('55555555-5555-5555-5555-000000000006', 'Core & Abs', 'core'),
  ('55555555-5555-5555-5555-000000000007', 'Cardiovascular System', 'cardio')
ON CONFLICT (name) DO NOTHING;

-- Exercises
INSERT INTO public.exercises (id, name, category, instructions, is_compound) VALUES
  ('66666666-6666-6666-6666-000000000001', 'Rowing Ergometer Intervals', 'cardio', '500m split pace intervals with 60s active recovery.', true),
  ('66666666-6666-6666-6666-000000000002', 'Assault Bike Sprint', 'cardio', 'Max effort anaerobic power sprints.', true),
  ('66666666-6666-6666-6666-000000000003', 'Barbell Back Squat', 'strength', 'Keep chest proud, hit parallel depth, drive through midfoot.', true),
  ('66666666-6666-6666-6666-000000000004', 'Dumbbell Romanian Deadlift', 'strength', 'Hinge at the hips, neutral spine, feel tension in hamstrings.', true),
  ('66666666-6666-6666-6666-000000000005', 'Barbell Bench Press', 'strength', 'Retract scapulae, touch lower chest, drive up without flaring elbows.', true),
  ('66666666-6666-6666-6666-000000000006', 'Kettlebell Clean & Press', 'functional', 'Explosive hip drive to rack, press overhead with stacked wrist.', true),
  ('66666666-6666-6666-6666-000000000007', 'TRX Suspended Row', 'functional', 'Body diagonal, pull chest to handles, maintain tight plank.', false),
  ('66666666-6666-6666-6666-000000000008', '90/90 Hip Flow & Thoracic Rotation', 'mobility', 'Deep breathing, active mobility across hips and upper spine.', false)
ON CONFLICT (id) DO NOTHING;

-- Exercise Muscle Weights (for Effective Sets computation)
INSERT INTO public.exercise_muscles (exercise_id, muscle_id, weight) VALUES
  ('66666666-6666-6666-6666-000000000001', '55555555-5555-5555-5555-000000000007', 1.0),
  ('66666666-6666-6666-6666-000000000001', '55555555-5555-5555-5555-000000000002', 0.5),
  ('66666666-6666-6666-6666-000000000003', '55555555-5555-5555-5555-000000000003', 1.0),
  ('66666666-6666-6666-6666-000000000003', '55555555-5555-5555-5555-000000000004', 0.5),
  ('66666666-6666-6666-6666-000000000004', '55555555-5555-5555-5555-000000000004', 1.0),
  ('66666666-6666-6666-6666-000000000005', '55555555-5555-5555-5555-000000000001', 1.0),
  ('66666666-6666-6666-6666-000000000005', '55555555-5555-5555-5555-000000000005', 0.5),
  ('66666666-6666-6666-6666-000000000006', '55555555-5555-5555-5555-000000000005', 1.0),
  ('66666666-6666-6666-6666-000000000006', '55555555-5555-5555-5555-000000000006', 0.5)
ON CONFLICT DO NOTHING;

-- 6. Master Workout Session for Today (Dual Coach: Cardio + Strength)
INSERT INTO public.workout_sessions (id, tenant_id, member_id, scheduled_date, start_time, end_time, status)
VALUES
  ('77777777-7777-7777-7777-000000000001', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000004', CURRENT_DATE, '09:00:00', '10:15:00', 'scheduled')
ON CONFLICT (id) DO NOTHING;

-- Segment 1: Cardio (Coach Michael)
INSERT INTO public.workout_segments (id, tenant_id, session_id, trainer_id, category, sequence_order, status, target_duration_seconds, trainer_notes, safety_context)
VALUES
  ('88888888-8888-8888-8888-000000000001', '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-000000000001', '10000000-0000-0000-0000-000000000002', 'cardio', 1, 'pending', 1800, 'Focus on steady aerobic threshold pacing on rower.', 'Watch right shoulder during hard pulls.')
ON CONFLICT DO NOTHING;

-- Segment 2: Strength & Functional (Coach Sarah)
INSERT INTO public.workout_segments (id, tenant_id, session_id, trainer_id, category, sequence_order, status, target_duration_seconds, trainer_notes, safety_context)
VALUES
  ('88888888-8888-8888-8888-000000000002', '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-000000000001', '10000000-0000-0000-0000-000000000003', 'strength', 2, 'pending', 2400, 'Back squat working sets followed by Kettlebell presses.', 'Right shoulder mild fatigue from earlier rowing; avoid wide grip.')
ON CONFLICT DO NOTHING;

-- Segment Items for Segment 1
INSERT INTO public.segment_items (id, tenant_id, segment_id, exercise_id, item_order, target_sets, target_duration_seconds, rest_seconds)
VALUES
  ('99999999-9999-9999-9999-000000000001', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-000000000001', '66666666-6666-6666-6666-000000000001', 1, 4, 300, 60),
  ('99999999-9999-9999-9999-000000000002', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-000000000001', '66666666-6666-6666-6666-000000000002', 2, 3, 60, 90)
ON CONFLICT DO NOTHING;

-- Segment Items for Segment 2
INSERT INTO public.segment_items (id, tenant_id, segment_id, exercise_id, item_order, target_sets, target_reps_min, target_reps_max, target_load_kg, rest_seconds)
VALUES
  ('99999999-9999-9999-9999-000000000003', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-000000000002', '66666666-6666-6666-6666-000000000003', 1, 3, 6, 8, 65.0, 120),
  ('99999999-9999-9999-9999-000000000004', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-000000000002', '66666666-6666-6666-6666-000000000006', 2, 3, 8, 10, 16.0, 90)
ON CONFLICT DO NOTHING;

-- Personal Records
INSERT INTO public.personal_records (tenant_id, member_id, exercise_id, pr_type, value, achieved_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000004', '66666666-6666-6666-6666-000000000003', 'max_weight', 70.0, now() - interval '7 days'),
  ('11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000004', '66666666-6666-6666-6666-000000000003', 'est_1rm', 81.25, now() - interval '7 days'),
  ('11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000004', '66666666-6666-6666-6666-000000000005', 'max_weight', 45.0, now() - interval '12 days')
ON CONFLICT DO NOTHING;
