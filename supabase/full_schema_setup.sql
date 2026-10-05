-- ============================================================================
-- HOME GYM MANAGEMENT PLATFORM — CONSOLIDATED SUPABASE SCHEMA & SEED SCRIPT
-- Run this complete script in the Supabase Dashboard -> SQL Editor
-- Project URL: https://avpjfdkuqrglrmcscaso.supabase.co
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean / Prepare Tables
CREATE TABLE IF NOT EXISTS public.gyms (
  id VARCHAR(100) PRIMARY KEY DEFAULT 'gym-main',
  name VARCHAR(255) NOT NULL,
  capacity INT NOT NULL DEFAULT 30,
  currency VARCHAR(20) NOT NULL DEFAULT 'تومان',
  no_show_deducts_session BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trainers (
  id VARCHAR(100) PRIMARY KEY,
  gym_id VARCHAR(100) NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  specialty VARCHAR(100),
  working_hours VARCHAR(100) DEFAULT '08:00 - 16:00',
  daily_capacity INT NOT NULL DEFAULT 6,
  session_rate NUMERIC(12,2) NOT NULL DEFAULT 150000,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.members (
  id VARCHAR(100) PRIMARY KEY,
  gym_id VARCHAR(100) NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  default_trainer_id VARCHAR(100) REFERENCES public.trainers(id) ON DELETE SET NULL,
  package_name VARCHAR(255) NOT NULL,
  total_sessions INT NOT NULL DEFAULT 12,
  used_sessions INT NOT NULL DEFAULT 0,
  package_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  start_date VARCHAR(50) NOT NULL,
  expiration_date VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exercises (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_fa VARCHAR(255) NOT NULL,
  body_part VARCHAR(100) NOT NULL,
  body_part_fa VARCHAR(100) NOT NULL,
  equipment VARCHAR(100) NOT NULL,
  equipment_fa VARCHAR(100) NOT NULL,
  pattern VARCHAR(100) NOT NULL,
  pattern_fa VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  position_fa VARCHAR(100) NOT NULL,
  gif_url TEXT NOT NULL,
  instructions_en TEXT,
  instructions_fa TEXT,
  default_sets INT NOT NULL DEFAULT 3,
  default_reps INT NOT NULL DEFAULT 10,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_sessions (
  id VARCHAR(100) PRIMARY KEY,
  gym_id VARCHAR(100) NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  date VARCHAR(50) NOT NULL,
  time VARCHAR(50) NOT NULL DEFAULT '10:00',
  member_id VARCHAR(100) NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  trainer_id VARCHAR(100) NOT NULL REFERENCES public.trainers(id) ON DELETE RESTRICT,
  is_daily_override BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.session_exercises (
  id VARCHAR(100) PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL REFERENCES public.daily_sessions(id) ON DELETE CASCADE,
  exercise_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  body_part VARCHAR(100),
  equipment VARCHAR(100),
  gif_url TEXT,
  sets INT NOT NULL DEFAULT 3,
  reps INT NOT NULL DEFAULT 10,
  weight_kg NUMERIC(6,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.financial_records (
  id VARCHAR(100) PRIMARY KEY,
  gym_id VARCHAR(100) NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'income_package', 'expense_trainer', etc.
  amount NUMERIC(12,2) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date VARCHAR(50) NOT NULL,
  member_id VARCHAR(100) REFERENCES public.members(id) ON DELETE SET NULL,
  trainer_id VARCHAR(100) REFERENCES public.trainers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id VARCHAR(100) PRIMARY KEY,
  gym_id VARCHAR(100) NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  actor VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_users (
  id VARCHAR(100) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'owner', 'trainer', 'member'
  entity_id VARCHAR(100),
  display_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Configure Row-Level Security (RLS) Permissive Policies for Web Access
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Gyms
  DROP POLICY IF EXISTS "Public access for gyms" ON public.gyms;
  CREATE POLICY "Public access for gyms" ON public.gyms FOR ALL USING (true) WITH CHECK (true);

  -- Trainers
  DROP POLICY IF EXISTS "Public access for trainers" ON public.trainers;
  CREATE POLICY "Public access for trainers" ON public.trainers FOR ALL USING (true) WITH CHECK (true);

  -- Members
  DROP POLICY IF EXISTS "Public access for members" ON public.members;
  CREATE POLICY "Public access for members" ON public.members FOR ALL USING (true) WITH CHECK (true);

  -- Exercises
  DROP POLICY IF EXISTS "Public access for exercises" ON public.exercises;
  CREATE POLICY "Public access for exercises" ON public.exercises FOR ALL USING (true) WITH CHECK (true);

  -- Daily Sessions
  DROP POLICY IF EXISTS "Public access for daily_sessions" ON public.daily_sessions;
  CREATE POLICY "Public access for daily_sessions" ON public.daily_sessions FOR ALL USING (true) WITH CHECK (true);

  -- Session Exercises
  DROP POLICY IF EXISTS "Public access for session_exercises" ON public.session_exercises;
  CREATE POLICY "Public access for session_exercises" ON public.session_exercises FOR ALL USING (true) WITH CHECK (true);

  -- Financial Records
  DROP POLICY IF EXISTS "Public access for financial_records" ON public.financial_records;
  CREATE POLICY "Public access for financial_records" ON public.financial_records FOR ALL USING (true) WITH CHECK (true);

  -- Audit Logs
  DROP POLICY IF EXISTS "Public access for audit_logs" ON public.audit_logs;
  CREATE POLICY "Public access for audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

  -- App Users
  DROP POLICY IF EXISTS "Public access for app_users" ON public.app_users;
  CREATE POLICY "Public access for app_users" ON public.app_users FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 4. Initial Seed Data

-- Gym
INSERT INTO public.gyms (id, name, capacity, currency, no_show_deducts_session)
VALUES ('gym-main', 'آکادمی ورزشی هوم جیم (Home Gym Club)', 30, 'تومان', false)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, capacity = EXCLUDED.capacity;

-- Trainers
INSERT INTO public.trainers (id, gym_id, name, phone, specialty, working_hours, daily_capacity, session_rate, status)
VALUES
  ('t-ali', 'gym-main', 'علی رستمی', '09121112233', 'کراس‌فیت و تمرینات فانکشنال', '08:00 - 16:00', 6, 150000, 'active'),
  ('t-sara', 'gym-main', 'سارا احمدی', '09124445566', 'پیلاتس، اصلاحی و موبیلیتی', '10:00 - 18:00', 5, 180000, 'active')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, specialty = EXCLUDED.specialty;

-- Members
INSERT INTO public.members (id, gym_id, name, phone, default_trainer_id, package_name, total_sessions, used_sessions, package_price, paid_amount, start_date, expiration_date, status)
VALUES
  ('m-reza', 'gym-main', 'رضا مرادی', '09351234567', 't-ali', 'دوره خصوصی ۱۲ جلسه‌ای', 12, 5, 2400000, 2400000, '1405/01/01', '1405/02/01', 'active'),
  ('m-maryam', 'gym-main', 'مریم طهرانی', '09198765432', 't-sara', 'دوره اصلاحی و پیلاتس', 10, 8, 2000000, 1500000, '1404/12/15', '1405/01/25', 'active'),
  ('m-kaveh', 'gym-main', 'کاوه دانش', '09365551234', 't-ali', 'پکیج قدرتی فشرده', 16, 2, 3200000, 3200000, '1405/01/10', '1405/02/20', 'active'),
  ('m-neda', 'gym-main', 'ندا علوی', '09123337788', 't-sara', 'پکیج چربی‌سوزی و فرم‌دهی', 12, 11, 2500000, 2500000, '1404/11/20', '1405/01/05', 'active')
ON CONFLICT (id) DO NOTHING;

-- App Users (Default logins)
INSERT INTO public.app_users (id, username, password_hash, role, entity_id, display_name)
VALUES
  ('u-owner', 'admin', 'admin123', 'owner', NULL, 'مدیر باشگاه'),
  ('u-trainer-ali', 'ali', 'ali123', 'trainer', 't-ali', 'علی رستمی'),
  ('u-trainer-sara', 'sara', 'sara123', 'trainer', 't-sara', 'سارا احمدی'),
  ('u-member-reza', 'reza', 'reza123', 'member', 'm-reza', 'رضا مرادی'),
  ('u-member-maryam', 'maryam', 'maryam123', 'member', 'm-maryam', 'مریم طهرانی'),
  ('u-member-kaveh', 'kaveh', 'kaveh123', 'member', 'm-kaveh', 'کاوه دانش'),
  ('u-member-neda', 'neda', 'neda123', 'member', 'm-neda', 'ندا علوی')
ON CONFLICT (id) DO NOTHING;

-- Exercises (FMS & Core Catalog)
INSERT INTO public.exercises (id, name, name_fa, body_part, body_part_fa, equipment, equipment_fa, pattern, pattern_fa, position, position_fa, gif_url, instructions_en, instructions_fa, default_sets, default_reps, is_custom)
VALUES
  ('ex-goblet-squat', 'Goblet Squat (FMS 1 Deep Squat)', 'اسکوات گابلت با کتل‌بل (الگوی اسکوات عمیق)', 'legs', 'پا و پایین‌تنه', 'kettlebell', 'کتل‌بل', 'deep_squat', 'اسکوات عمیق (FMS 1)', 'standing', 'ایستاده', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80', 'Hold kettlebell at chest. Squat down between knees, keeping chest tall and heels planted.', 'کتل‌بل را مقابل سینه نگه دارید. با حفظ قفسه سینه بالا و پاشنه‌ها روی زمین، تا موازی شدن ران‌ها بنشینید.', 3, 10, false),
  ('ex-step-over', 'Hurdle Step Over (FMS 2)', 'گام روی مانع با چوب تعادل (الگوی گام برداری)', 'mobility', 'موبیلیتی و اصلاحی', 'bodyweight', 'وزن بدن', 'hurdle_step', 'گام روی مانع (FMS 2)', 'standing', 'ایستاده', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80', 'Step over virtual barrier maintaining level hips and tall spine alignment.', 'چوب تعادل را روی شانه‌ها گذاشته و بدون چرخش لگن، زانو را بالا آورده و از روی مانع فرضی عبور دهید.', 3, 8, false),
  ('ex-inline-lunge', 'Inline Lunge with Dowel (FMS 3)', 'لانژ خطی با چوب تعادل عمودی', 'legs', 'پا و پایین‌تنه', 'bodyweight', 'وزن بدن', 'inline_lunge', 'لانژ خطی (FMS 3)', 'standing', 'ایستاده', 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=600&auto=format&fit=crop&q=80', 'Step into split stance on a line. Lower back knee to touch floor while keeping spine neutral.', 'هر دو پا در یک امتداد خطی قرار گرفته، زانوی عقب به آرامی زمین را لمس کرده و ستون فقرات کاملاً عمود می‌ماند.', 3, 10, false),
  ('ex-shoulder-clearing', 'Shoulder Clearing & Reach (FMS 4)', 'تست و تمرین موبیلیتی شانه (دسترسی دست‌ها)', 'mobility', 'موبیلیتی و اصلاحی', 'bodyweight', 'وزن بدن', 'shoulder_mobility', 'موبیلیتی شانه (FMS 4)', 'standing', 'ایستاده', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80', 'Reach one fist over shoulder and the other up from behind back toward each other.', 'یک دست از بالا و دست دیگر از پایین به سمت هم در پشت ستون فقرات حرکت کرده و موبیلیتی کمربند شانه‌ای را تقویت می‌کنند.', 3, 5, false),
  ('ex-aslr-band', 'Assisted Active Straight Leg Raise (FMS 5)', 'بالا آوردن پای صاف با کمک کش (ASLR)', 'mobility', 'موبیلیتی و اصلاحی', 'band', 'کش تمرینی', 'aslr', 'بالا آوردن پای صاف / ASLR (FMS 5)', 'supine', 'طاق‌باز (خوابیده به پشت)', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80', 'Supine position, raise straight leg while keeping opposite leg flat and neutral on ground.', 'طاق‌باز خوابیده، با کش دور پا، یک پا بدون خم شدن زانو بالا می‌آید در حالی که پای مخالف محکم روی زمین قفل است.', 3, 10, false),
  ('ex-trunk-pushup', 'Trunk Stability Push-up (FMS 6)', 'شنای سوئدی با حفظ ثبات تنه و ستون فقرات', 'core', 'شکم و مرکز بدن', 'bodyweight', 'وزن بدن', 'trunk_stability', 'پایداری تنه و شنا (FMS 6)', 'plank', 'وضعیت پلانک', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80', 'Push up as a single rigid cylinder with zero lag in lumbar spine.', 'تمام بدن مانند یک ستون یکپارچه بالا می‌آید بدون اینکه در ناحیه کمر افتادگی یا قوس اضافه رخ دهد.', 3, 8, false),
  ('ex-bird-dog', 'Bird Dog Quadruped Stability (FMS 7)', 'پرنده-سگ چهار دست و پا (پایداری چرخشی)', 'core', 'شکم و مرکز بدن', 'bodyweight', 'وزن بدن', 'rotary_stability', 'پایداری چرخشی (FMS 7)', 'quadruped', 'چهار دست و پا', 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=600&auto=format&fit=crop&q=80', 'Reach opposite arm and leg simultaneously without rotating torso.', 'دست و پای مخالف همزمان در امتداد بدن کشیده می‌شوند بدون اینکه لگن یا ستون فقرات بچرخد.', 3, 10, false),
  ('ex-plank', 'Front Plank Hold', 'پلانک شکم روی ساعد', 'core', 'شکم و مرکز بدن', 'bodyweight', 'وزن بدن', 'trunk_stability', 'پایداری تنه و شنا (FMS 6)', 'plank', 'وضعیت پلانک', 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=600&auto=format&fit=crop&q=80', 'Maintain rigid plank posture from ears through ankles.', 'عضلات شکم و باسن را منقبض کرده و ستون فقرات را در راستای خنثی نگه دارید.', 3, 30, false),
  ('ex-farmers-walk', 'Farmer Walk Carry', 'حمل کشاورز با دمبل یا کتل‌بل', 'core', 'شکم و مرکز بدن', 'dumbbell', 'دمبل', 'power_carry', 'حمل بار و انتقال نیرو', 'standing', 'ایستاده', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80', 'Walk tall with heavy weights at your sides, resisting lateral flexion.', 'وزنه‌ها را در دو طرف بدن نگه داشته و با قامتی استوار و گام‌های کنترل‌شده حرکت کنید.', 3, 20, false),
  ('ex-lat-pulldown', 'Lat Pulldown Cable', 'زیربغل سیم‌کش دست باز', 'back', 'پشت و زیربغل', 'cable', 'سیم‌کش', 'general_strength', 'قدرت عمومی و تناسب اندام', 'standing', 'ایستاده', 'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=600&auto=format&fit=crop&q=80', 'Pull bar to upper chest squeezing lats, slow controlled eccentric return.', 'میله را با انقباض عضلات پشتی بزرگ به سمت بالای سینه بکشید و کنترل شده برگردید.', 3, 12, false),
  ('ex-dumbbell-bench-press', 'Flat Dumbbell Bench Press', 'پرس سینه با دمبل روی نیمکت صاف', 'chest', 'سینه و بالاتنه', 'dumbbell', 'دمبل', 'general_strength', 'قدرت عمومی و تناسب اندام', 'supine', 'طاق‌باز (خوابیده به پشت)', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80', 'Press dumbbells up with control, keep scapula retracted and feet planted.', 'دمبل‌ها را با کنترل به سمت بالا هدایت کنید، کتف‌ها را منقبض نگه دارید.', 3, 10, false)
ON CONFLICT (id) DO NOTHING;

-- Daily Sessions (Sample records)
INSERT INTO public.daily_sessions (id, gym_id, date, time, member_id, trainer_id, status, notes)
VALUES
  ('sess-1', 'gym-main', '1405/01/01', '09:00', 'm-reza', 't-ali', 'completed', 'تمرینات اسکوات گابلت و هسته مرکزی با موفقیت اجرا شد.'),
  ('sess-2', 'gym-main', '1405/01/01', '10:30', 'm-maryam', 't-sara', 'completed', 'تمرکز بر موبیلیتی شانه و پیلاتس اصلاحی.')
ON CONFLICT (id) DO NOTHING;

-- Session Exercises (Sample details)
INSERT INTO public.session_exercises (id, session_id, exercise_id, name, body_part, equipment, sets, reps, weight_kg, notes)
VALUES
  ('se-1', 'sess-1', 'ex-goblet-squat', 'اسکوات گابلت با کتل‌بل (الگوی اسکوات عمیق)', 'پا و پایین‌تنه', 'کتل‌بل', 3, 10, 16, 'کف پاها کامل روی زمین'),
  ('se-2', 'sess-1', 'ex-trunk-pushup', 'شنای سوئدی با حفظ ثبات تنه و ستون فقرات', 'شکم و مرکز بدن', 'وزن بدن', 3, 8, 0, 'بدون افتادگی کمر'),
  ('se-3', 'sess-2', 'ex-shoulder-clearing', 'تست و تمرین موبیلیتی شانه (دسترسی دست‌ها)', 'موبیلیتی و اصلاحی', 'وزن بدن', 3, 5, 0, 'کشش عضلات سینه')
ON CONFLICT (id) DO NOTHING;

-- Financial Records (Sample history)
INSERT INTO public.financial_records (id, gym_id, type, amount, title, description, date, member_id, trainer_id)
VALUES
  ('fin-1', 'gym-main', 'income_package', 2400000, 'ثبت نام دوره خصوصی رضا مرادی', 'پرداخت کامل دوره ۱۲ جلسه‌ای', '1405/01/01', 'm-reza', 't-ali'),
  ('fin-2', 'gym-main', 'expense_trainer', 600000, 'تسویه حق‌الزحمه مربی - علی رستمی', 'تسویه ۴ جلسه تمرینی انجام شده', '1405/01/01', NULL, 't-ali')
ON CONFLICT (id) DO NOTHING;

-- Confirmation Notice
SELECT 'Home Gym schema & seed data created successfully!' AS status;
