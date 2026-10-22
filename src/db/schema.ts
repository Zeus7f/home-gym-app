/**
 * src/db/schema.ts
 * طرح‌وارهٔ PostgreSQL (Drizzle) — هم‌شکل مدل دامنهٔ `src/lib/domain/gymManagement.ts`.
 *
 * همهٔ جداول دامنه gym_id دارند و روی آن ایندکس شده‌اند (چندمستأجری).
 * شناسهٔ رکوردهای دامنه متنی است (UUID برای رکوردهای تازه؛ شناسه‌های نمونه مثل t-ali در seed).
 * تاریخ‌های دامنه جلالی و به شکل YYYY/MM/DD ذخیره می‌شوند، همان قالبی که منطق رزرو با آن کار می‌کند.
 */

import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

const money = (name: string) => bigint(name, { mode: 'number' }).notNull().default(0);
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

export const userRoleEnum = pgEnum('user_role', ['super_admin', 'gym_owner', 'trainer', 'member']);
export const sessionStatusEnum = pgEnum('session_status', ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']);
export const paymentMethodEnum = pgEnum('payment_method', ['card', 'cash', 'transfer']);
export const programStatusEnum = pgEnum('program_status', ['draft', 'published']);

// ── باشگاه ────────────────────────────────────────────────────────────────────
export const gyms = pgTable('gyms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  phone: varchar('phone', { length: 30 }),
  address: text('address'),
  isActive: boolean('is_active').notNull().default(true),
  capacity: integer('capacity').notNull().default(30),
  hourlyCapacity: integer('hourly_capacity'),
  currency: varchar('currency', { length: 20 }).notNull().default('تومان'),
  noShowDeductsSession: boolean('no_show_deducts_session').notNull().default(false),
  workingHours: varchar('working_hours', { length: 60 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ── حساب‌های کاربری ──────────────────────────────────────────────────────────
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    gymId: uuid('gym_id').references(() => gyms.id, { onDelete: 'cascade' }),
    role: userRoleEnum('role').notNull(),
    /** شناسهٔ ورود: موبایل نرمال‌شده یا نام کاربری با حروف کوچک */
    username: varchar('username', { length: 64 }).notNull().unique(),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    mustChangePassword: boolean('must_change_password').notNull().default(false),
    /** رکورد دامنهٔ متناظر: شناسهٔ مربی/ورزشکار؛ برای مدیر، شناسهٔ باشگاه */
    entityId: text('entity_id'),
    isActive: boolean('is_active').notNull().default(true),
    /** با تغییر رمز یا غیرفعال‌سازی افزایش می‌یابد تا نشست‌های قبلی باطل شوند */
    sessionVersion: integer('session_version').notNull().default(1),
    createdAt: createdAt(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  },
  t => [index('users_gym_idx').on(t.gymId, t.role)]
);

// ── مربیان ───────────────────────────────────────────────────────────────────
export const trainers = pgTable(
  'trainers',
  {
    id: text('id').primaryKey(),
    gymId: uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    avatarUrl: text('avatar_url'),
    specialty: text('specialty').notNull().default(''),
    bio: text('bio'),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    workingDays: jsonb('working_days').$type<string[]>().notNull().default([]),
    workingHours: varchar('working_hours', { length: 60 }).notNull().default(''),
    dailyCapacity: integer('daily_capacity').notNull().default(6),
    sessionRate: money('session_rate'),
    completedSessions: integer('completed_sessions').notNull().default(0),
    paidCompensation: money('paid_compensation'),
    outstandingCompensation: money('outstanding_compensation'),
  },
  t => [index('trainers_gym_idx').on(t.gymId)]
);

// ── ورزشکاران و بسته‌ها ─────────────────────────────────────────────────────
export const members = pgTable(
  'members',
  {
    id: text('id').primaryKey(),
    gymId: uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    avatarUrl: text('avatar_url'),
    defaultTrainerId: text('default_trainer_id').notNull().default(''),
    defaultTrainerName: varchar('default_trainer_name', { length: 255 }).notNull().default(''),
    packageName: varchar('package_name', { length: 255 }).notNull().default(''),
    totalSessions: integer('total_sessions').notNull().default(0),
    usedSessions: integer('used_sessions').notNull().default(0),
    remainingSessions: integer('remaining_sessions').notNull().default(0),
    packagePrice: money('package_price'),
    paidAmount: money('paid_amount'),
    outstandingBalance: money('outstanding_balance'),
    startDate: varchar('start_date', { length: 10 }).notNull().default(''),
    expirationDate: varchar('expiration_date', { length: 10 }).notNull().default(''),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    registrationDate: varchar('registration_date', { length: 10 }).notNull().default(''),
    packagePending: boolean('package_pending').notNull().default(false),
    createdByTrainerId: text('created_by_trainer_id'),
    goals: text('goals'),
    notes: text('notes'),
  },
  t => [index('members_gym_idx').on(t.gymId), index('members_trainer_idx').on(t.gymId, t.defaultTrainerId)]
);

// ── جلسات (نوبت + تمرین ثبت‌شده) ─────────────────────────────────────────────
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    gymId: uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
    date: varchar('date', { length: 10 }).notNull(),
    time: varchar('time', { length: 5 }).notNull(),
    memberId: text('member_id').notNull(),
    memberName: varchar('member_name', { length: 255 }).notNull(),
    memberPhone: varchar('member_phone', { length: 20 }),
    trainerId: text('trainer_id').notNull(),
    trainerName: varchar('trainer_name', { length: 255 }).notNull(),
    isDailyOverride: boolean('is_daily_override').notNull().default(false),
    status: sessionStatusEnum('status').notNull().default('scheduled'),
    completedAt: varchar('completed_at', { length: 40 }),
    /** today: نوبت‌های جاری و آینده؛ past: سوابق قدیمی (هم‌شکل استور) */
    bucket: varchar('bucket', { length: 8 }).notNull().default('today'),
  },
  t => [
    index('sessions_gym_date_idx').on(t.gymId, t.date),
    index('sessions_member_idx').on(t.gymId, t.memberId),
    index('sessions_trainer_idx').on(t.gymId, t.trainerId),
  ]
);

export const sessionExercises = pgTable(
  'session_exercises',
  {
    id: text('id').primaryKey(),
    gymId: uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
    sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    exerciseId: text('exercise_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    gifUrl: text('gif_url'),
    imageUrl: text('image_url'),
    bodyPart: varchar('body_part', { length: 120 }).notNull().default(''),
    equipment: varchar('equipment', { length: 120 }).notNull().default(''),
    sets: integer('sets').notNull().default(0),
    reps: integer('reps').notNull().default(0),
    weightKg: numeric('weight_kg', { precision: 7, scale: 2, mode: 'number' }),
    durationSeconds: integer('duration_seconds'),
    notes: text('notes'),
  },
  t => [index('session_exercises_session_idx').on(t.sessionId, t.position)]
);

/** ست‌های واقعاً اجراشده (تکرار، وزنه، انجام‌شده) */
export const sessionSetLogs = pgTable(
  'session_set_logs',
  {
    id: text('id').primaryKey(),
    gymId: uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
    sessionExerciseId: text('session_exercise_id').notNull().references(() => sessionExercises.id, { onDelete: 'cascade' }),
    setNumber: integer('set_number').notNull(),
    reps: integer('reps').notNull().default(0),
    weightKg: numeric('weight_kg', { precision: 7, scale: 2, mode: 'number' }).notNull().default(0),
    done: boolean('done').notNull().default(false),
  },
  t => [index('session_set_logs_exercise_idx').on(t.sessionExerciseId, t.setNumber)]
);

// ── امور مالی ────────────────────────────────────────────────────────────────
export const payments = pgTable(
  'payments',
  {
    id: text('id').primaryKey(),
    gymId: uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull(),
    memberName: varchar('member_name', { length: 255 }).notNull(),
    amount: money('amount'),
    date: varchar('date', { length: 10 }).notNull(),
    method: paymentMethodEnum('method').notNull(),
    description: text('description').notNull().default(''),
    recordedBy: varchar('recorded_by', { length: 255 }).notNull().default(''),
    createdAt: createdAt(),
  },
  t => [index('payments_gym_idx').on(t.gymId, t.memberId)]
);

export const trainerPayouts = pgTable(
  'trainer_payouts',
  {
    id: text('id').primaryKey(),
    gymId: uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
    trainerId: text('trainer_id').notNull(),
    trainerName: varchar('trainer_name', { length: 255 }).notNull(),
    amount: money('amount'),
    date: varchar('date', { length: 10 }).notNull(),
    method: paymentMethodEnum('method').notNull(),
    description: text('description').notNull().default(''),
    createdAt: createdAt(),
  },
  t => [index('trainer_payouts_gym_idx').on(t.gymId, t.trainerId)]
);

export const sessionAdjustments = pgTable(
  'session_adjustments',
  {
    id: text('id').primaryKey(),
    gymId: uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull(),
    memberName: varchar('member_name', { length: 255 }).notNull(),
    delta: integer('delta').notNull(),
    reason: text('reason').notNull().default(''),
    date: varchar('date', { length: 10 }).notNull(),
    performedBy: varchar('performed_by', { length: 255 }).notNull().default(''),
    createdAt: createdAt(),
  },
  t => [index('session_adjustments_gym_idx').on(t.gymId, t.memberId)]
);

// ── برنامه‌های تمرینی ───────────────────────────────────────────────────────
export const workoutPrograms = pgTable(
  'workout_programs',
  {
    id: text('id').primaryKey(),
    gymId: uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull(),
    memberName: varchar('member_name', { length: 255 }).notNull(),
    trainerId: text('trainer_id').notNull(),
    trainerName: varchar('trainer_name', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    status: programStatusEnum('status').notNull().default('draft'),
    createdAtJalali: varchar('created_at_jalali', { length: 40 }).notNull(),
    updatedAtJalali: varchar('updated_at_jalali', { length: 40 }).notNull(),
    publishedAt: varchar('published_at', { length: 40 }),
  },
  t => [index('workout_programs_gym_idx').on(t.gymId, t.memberId), index('workout_programs_trainer_idx').on(t.gymId, t.trainerId)]
);

export const programDays = pgTable(
  'program_days',
  {
    id: text('id').primaryKey(),
    gymId: uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
    programId: text('program_id').notNull().references(() => workoutPrograms.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
  },
  t => [index('program_days_program_idx').on(t.programId, t.position)]
);

export const programItems = pgTable(
  'program_items',
  {
    id: text('id').primaryKey(),
    gymId: uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
    dayId: text('day_id').notNull().references(() => programDays.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    exerciseId: text('exercise_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    bodyPart: varchar('body_part', { length: 120 }).notNull().default(''),
    equipment: varchar('equipment', { length: 120 }).notNull().default(''),
    sets: integer('sets').notNull().default(3),
    repsMin: integer('reps_min').notNull().default(8),
    repsMax: integer('reps_max').notNull().default(12),
    loadKg: numeric('load_kg', { precision: 7, scale: 2, mode: 'number' }),
    notes: text('notes'),
  },
  t => [index('program_items_day_idx').on(t.dayId, t.position)]
);

// ── کاتالوگ حرکات ───────────────────────────────────────────────────────────
/**
 * کاتالوگ سراسری (gym_id = NULL) + حرکات سفارشی یا ویرایش‌شدهٔ هر باشگاه.
 * ردیف باشگاه با همان exercise_id، ردیف سراسری را برای آن باشگاه جایگزین می‌کند.
 */
export const exercises = pgTable(
  'exercises',
  {
    id: text('id').primaryKey(),
    gymId: uuid('gym_id').references(() => gyms.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    nameFa: varchar('name_fa', { length: 255 }).notNull(),
    bodyPart: varchar('body_part', { length: 40 }).notNull(),
    bodyPartFa: varchar('body_part_fa', { length: 120 }).notNull(),
    equipment: varchar('equipment', { length: 40 }).notNull(),
    equipmentName: varchar('equipment_name', { length: 120 }),
    equipmentFa: varchar('equipment_fa', { length: 120 }).notNull(),
    pattern: varchar('pattern', { length: 40 }).notNull(),
    patternFa: varchar('pattern_fa', { length: 120 }).notNull(),
    position: varchar('position', { length: 40 }).notNull(),
    positionFa: varchar('position_fa', { length: 120 }).notNull(),
    primaryMuscle: varchar('primary_muscle', { length: 120 }),
    primaryMuscleFa: varchar('primary_muscle_fa', { length: 120 }),
    secondaryMuscles: jsonb('secondary_muscles').$type<string[]>(),
    secondaryMusclesFa: jsonb('secondary_muscles_fa').$type<string[]>(),
    gifUrl: text('gif_url').notNull().default(''),
    videoUrl: text('video_url'),
    source: text('source'),
    sourceType: varchar('source_type', { length: 10 }),
    instructionsEn: text('instructions_en').notNull().default(''),
    instructionsFa: text('instructions_fa').notNull().default(''),
    defaultSets: integer('default_sets'),
    defaultReps: integer('default_reps'),
    isCustom: boolean('is_custom').notNull().default(false),
  },
  t => [uniqueIndex('exercises_gym_exercise_key').on(t.gymId, t.exerciseId), index('exercises_gym_idx').on(t.gymId)]
);

// ── ظرفیت روزانهٔ سفارشی ────────────────────────────────────────────────────
export const capacityOverrides = pgTable(
  'capacity_overrides',
  {
    /** `${gymId}:${date}` */
    id: text('id').primaryKey(),
    gymId: uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
    date: varchar('date', { length: 10 }).notNull(),
    gymCapacity: integer('gym_capacity'),
    trainerCapacities: jsonb('trainer_capacities').$type<Record<string, number>>(),
  },
  t => [uniqueIndex('capacity_overrides_gym_date_key').on(t.gymId, t.date)]
);

// ── ممیزی ───────────────────────────────────────────────────────────────────
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    gymId: uuid('gym_id').references(() => gyms.id, { onDelete: 'cascade' }),
    action: varchar('action', { length: 60 }).notNull(),
    entityType: varchar('entity_type', { length: 60 }).notNull(),
    entityId: text('entity_id').notNull(),
    details: text('details').notNull().default(''),
    timestamp: varchar('timestamp', { length: 40 }).notNull(),
    userName: varchar('user_name', { length: 255 }).notNull().default(''),
    createdAt: createdAt(),
  },
  t => [index('audit_logs_gym_idx').on(t.gymId, t.createdAt)]
);
