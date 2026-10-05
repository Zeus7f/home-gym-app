import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'gym_owner', 'trainer', 'member']);
export const assignmentSpecialtyEnum = pgEnum('assignment_specialty', [
  'primary',
  'cardio',
  'functional',
  'strength',
  'rehab',
]);
export const sessionStatusEnum = pgEnum('session_status', [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
]);
export const segmentCategoryEnum = pgEnum('segment_category', [
  'cardio',
  'functional',
  'strength',
  'mobility',
  'hiit',
  'cooldown',
]);
export const segmentStatusEnum = pgEnum('segment_status', [
  'pending',
  'in_progress',
  'completed',
  'skipped',
]);

// Tables
export const gyms = pgTable('gyms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  gymId: uuid('gym_id').references(() => gyms.id, { onDelete: 'cascade' }),
  uid: text('uid').unique(), // Firebase Auth UID
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }), // Nullable as we use Firebase
  role: userRoleEnum('role').notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const memberTrainerAssignments = pgTable('member_trainer_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  gymId: uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  trainerId: uuid('trainer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  specialty: assignmentSpecialtyEnum('specialty').notNull().default('primary'),
  isActive: boolean('is_active').default(true),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow(),
});

export const memberSubscriptions = pgTable('member_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  gymId: uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  totalSessions: integer('total_sessions').notNull(),
  consumedSessions: integer('consumed_sessions').notNull().default(0),
  startDate: date('start_date').notNull(),
  expiryDate: date('expiry_date'),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  gymId: uuid('gym_id').notNull().references(() => gyms.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scheduledDate: date('scheduled_date').notNull(),
  startTime: time('start_time'),
  endTime: time('end_time'),
  status: sessionStatusEnum('status').default('scheduled'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const workoutSegments = pgTable('workout_segments', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => workoutSessions.id, { onDelete: 'cascade' }),
  trainerId: uuid('trainer_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  category: segmentCategoryEnum('category').notNull(),
  sequenceOrder: integer('sequence_order').notNull().default(1),
  targetDurationMinutes: integer('target_duration_minutes'),
  trainerNotes: text('trainer_notes'),
  status: segmentStatusEnum('status').default('pending'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const exercises = pgTable('exercises', {
  id: uuid('id').defaultRandom().primaryKey(),
  gymId: uuid('gym_id').references(() => gyms.id, { onDelete: 'cascade' }), // Null for system defaults
  name: varchar('name', { length: 255 }).notNull(),
  category: segmentCategoryEnum('category').notNull(),
  description: text('description'),
  videoUrl: text('video_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const workoutSegmentItems = pgTable('workout_segment_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  segmentId: uuid('segment_id').notNull().references(() => workoutSegments.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').references(() => exercises.id, { onDelete: 'set null' }),
  customExerciseName: varchar('custom_exercise_name', { length: 255 }),
  targetSets: integer('target_sets'),
  targetReps: varchar('target_reps', { length: 50 }),
  targetWeightKg: numeric('target_weight_kg', { precision: 6, scale: 2 }),
  targetDurationSeconds: integer('target_duration_seconds'),
  restSeconds: integer('rest_seconds'),
  actualSets: integer('actual_sets'),
  actualReps: varchar('actual_reps', { length: 50 }),
  actualWeightKg: numeric('actual_weight_kg', { precision: 6, scale: 2 }),
  isCompleted: boolean('is_completed').default(false),
  itemOrder: integer('item_order').notNull().default(1),
});

// Relations
export const gymRelations = relations(gyms, ({ many }) => ({
  users: many(users),
  workoutSessions: many(workoutSessions),
  exercises: many(exercises),
}));

export const userRelations = relations(users, ({ one, many }) => ({
  gym: one(gyms, { fields: [users.gymId], references: [gyms.id] }),
  assignmentsAsMember: many(memberTrainerAssignments, { relationName: 'memberAssignments' }),
  assignmentsAsTrainer: many(memberTrainerAssignments, { relationName: 'trainerAssignments' }),
  sessions: many(workoutSessions),
  segmentsCoached: many(workoutSegments),
}));

export const assignmentRelations = relations(memberTrainerAssignments, ({ one }) => ({
  member: one(users, { fields: [memberTrainerAssignments.memberId], references: [users.id], relationName: 'memberAssignments' }),
  trainer: one(users, { fields: [memberTrainerAssignments.trainerId], references: [users.id], relationName: 'trainerAssignments' }),
  gym: one(gyms, { fields: [memberTrainerAssignments.gymId], references: [gyms.id] }),
}));

export const sessionRelations = relations(workoutSessions, ({ one, many }) => ({
  gym: one(gyms, { fields: [workoutSessions.gymId], references: [gyms.id] }),
  member: one(users, { fields: [workoutSessions.memberId], references: [users.id] }),
  segments: many(workoutSegments),
}));

export const segmentRelations = relations(workoutSegments, ({ one, many }) => ({
  session: one(workoutSessions, { fields: [workoutSegments.sessionId], references: [workoutSessions.id] }),
  trainer: one(users, { fields: [workoutSegments.trainerId], references: [users.id] }),
  items: many(workoutSegmentItems),
}));

export const itemRelations = relations(workoutSegmentItems, ({ one }) => ({
  segment: one(workoutSegments, { fields: [workoutSegmentItems.segmentId], references: [workoutSegments.id] }),
  exercise: one(exercises, { fields: [workoutSegmentItems.exerciseId], references: [exercises.id] }),
}));
