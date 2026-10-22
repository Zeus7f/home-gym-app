CREATE TYPE "public"."payment_method" AS ENUM('card', 'cash', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."program_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'gym_owner', 'trainer', 'member');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" uuid,
	"action" varchar(60) NOT NULL,
	"entity_type" varchar(60) NOT NULL,
	"entity_id" text NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"timestamp" varchar(40) NOT NULL,
	"user_name" varchar(255) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capacity_overrides" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" uuid NOT NULL,
	"date" varchar(10) NOT NULL,
	"gym_capacity" integer,
	"trainer_capacities" jsonb
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" uuid,
	"exercise_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_fa" varchar(255) NOT NULL,
	"body_part" varchar(40) NOT NULL,
	"body_part_fa" varchar(120) NOT NULL,
	"equipment" varchar(40) NOT NULL,
	"equipment_name" varchar(120),
	"equipment_fa" varchar(120) NOT NULL,
	"pattern" varchar(40) NOT NULL,
	"pattern_fa" varchar(120) NOT NULL,
	"position" varchar(40) NOT NULL,
	"position_fa" varchar(120) NOT NULL,
	"primary_muscle" varchar(120),
	"primary_muscle_fa" varchar(120),
	"secondary_muscles" jsonb,
	"secondary_muscles_fa" jsonb,
	"gif_url" text DEFAULT '' NOT NULL,
	"video_url" text,
	"source" text,
	"source_type" varchar(10),
	"instructions_en" text DEFAULT '' NOT NULL,
	"instructions_fa" text DEFAULT '' NOT NULL,
	"default_sets" integer,
	"default_reps" integer,
	"is_custom" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gyms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"phone" varchar(30),
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"capacity" integer DEFAULT 30 NOT NULL,
	"hourly_capacity" integer,
	"currency" varchar(20) DEFAULT 'تومان' NOT NULL,
	"no_show_deducts_session" boolean DEFAULT false NOT NULL,
	"working_hours" varchar(60),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gyms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"avatar_url" text,
	"default_trainer_id" text DEFAULT '' NOT NULL,
	"default_trainer_name" varchar(255) DEFAULT '' NOT NULL,
	"package_name" varchar(255) DEFAULT '' NOT NULL,
	"total_sessions" integer DEFAULT 0 NOT NULL,
	"used_sessions" integer DEFAULT 0 NOT NULL,
	"remaining_sessions" integer DEFAULT 0 NOT NULL,
	"package_price" bigint DEFAULT 0 NOT NULL,
	"paid_amount" bigint DEFAULT 0 NOT NULL,
	"outstanding_balance" bigint DEFAULT 0 NOT NULL,
	"start_date" varchar(10) DEFAULT '' NOT NULL,
	"expiration_date" varchar(10) DEFAULT '' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"registration_date" varchar(10) DEFAULT '' NOT NULL,
	"package_pending" boolean DEFAULT false NOT NULL,
	"created_by_trainer_id" text,
	"goals" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" uuid NOT NULL,
	"member_id" text NOT NULL,
	"member_name" varchar(255) NOT NULL,
	"amount" bigint DEFAULT 0 NOT NULL,
	"date" varchar(10) NOT NULL,
	"method" "payment_method" NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"recorded_by" varchar(255) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_days" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" uuid NOT NULL,
	"program_id" text NOT NULL,
	"position" integer NOT NULL,
	"title" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_items" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" uuid NOT NULL,
	"day_id" text NOT NULL,
	"position" integer NOT NULL,
	"exercise_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"body_part" varchar(120) DEFAULT '' NOT NULL,
	"equipment" varchar(120) DEFAULT '' NOT NULL,
	"sets" integer DEFAULT 3 NOT NULL,
	"reps_min" integer DEFAULT 8 NOT NULL,
	"reps_max" integer DEFAULT 12 NOT NULL,
	"load_kg" numeric(7, 2),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "session_adjustments" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" uuid NOT NULL,
	"member_id" text NOT NULL,
	"member_name" varchar(255) NOT NULL,
	"delta" integer NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"date" varchar(10) NOT NULL,
	"performed_by" varchar(255) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_exercises" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"position" integer NOT NULL,
	"exercise_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"gif_url" text,
	"image_url" text,
	"body_part" varchar(120) DEFAULT '' NOT NULL,
	"equipment" varchar(120) DEFAULT '' NOT NULL,
	"sets" integer DEFAULT 0 NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"weight_kg" numeric(7, 2),
	"duration_seconds" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "session_set_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" uuid NOT NULL,
	"session_exercise_id" text NOT NULL,
	"set_number" integer NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"weight_kg" numeric(7, 2) DEFAULT 0 NOT NULL,
	"done" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" uuid NOT NULL,
	"date" varchar(10) NOT NULL,
	"time" varchar(5) NOT NULL,
	"member_id" text NOT NULL,
	"member_name" varchar(255) NOT NULL,
	"member_phone" varchar(20),
	"trainer_id" text NOT NULL,
	"trainer_name" varchar(255) NOT NULL,
	"is_daily_override" boolean DEFAULT false NOT NULL,
	"status" "session_status" DEFAULT 'scheduled' NOT NULL,
	"completed_at" varchar(40),
	"bucket" varchar(8) DEFAULT 'today' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainer_payouts" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" uuid NOT NULL,
	"trainer_id" text NOT NULL,
	"trainer_name" varchar(255) NOT NULL,
	"amount" bigint DEFAULT 0 NOT NULL,
	"date" varchar(10) NOT NULL,
	"method" "payment_method" NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainers" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"avatar_url" text,
	"specialty" text DEFAULT '' NOT NULL,
	"bio" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"working_days" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"working_hours" varchar(60) DEFAULT '' NOT NULL,
	"daily_capacity" integer DEFAULT 6 NOT NULL,
	"session_rate" bigint DEFAULT 0 NOT NULL,
	"completed_sessions" integer DEFAULT 0 NOT NULL,
	"paid_compensation" bigint DEFAULT 0 NOT NULL,
	"outstanding_compensation" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" uuid,
	"role" "user_role" NOT NULL,
	"username" varchar(64) NOT NULL,
	"phone" varchar(20),
	"email" varchar(255),
	"display_name" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"entity_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"session_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "workout_programs" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" uuid NOT NULL,
	"member_id" text NOT NULL,
	"member_name" varchar(255) NOT NULL,
	"trainer_id" text NOT NULL,
	"trainer_name" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "program_status" DEFAULT 'draft' NOT NULL,
	"created_at_jalali" varchar(40) NOT NULL,
	"updated_at_jalali" varchar(40) NOT NULL,
	"published_at" varchar(40)
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacity_overrides" ADD CONSTRAINT "capacity_overrides_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_days" ADD CONSTRAINT "program_days_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_days" ADD CONSTRAINT "program_days_program_id_workout_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."workout_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_items" ADD CONSTRAINT "program_items_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_items" ADD CONSTRAINT "program_items_day_id_program_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."program_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_adjustments" ADD CONSTRAINT "session_adjustments_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_set_logs" ADD CONSTRAINT "session_set_logs_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_set_logs" ADD CONSTRAINT "session_set_logs_session_exercise_id_session_exercises_id_fk" FOREIGN KEY ("session_exercise_id") REFERENCES "public"."session_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_payouts" ADD CONSTRAINT "trainer_payouts_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_programs" ADD CONSTRAINT "workout_programs_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_gym_idx" ON "audit_logs" USING btree ("gym_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "capacity_overrides_gym_date_key" ON "capacity_overrides" USING btree ("gym_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "exercises_gym_exercise_key" ON "exercises" USING btree ("gym_id","exercise_id");--> statement-breakpoint
CREATE INDEX "exercises_gym_idx" ON "exercises" USING btree ("gym_id");--> statement-breakpoint
CREATE INDEX "members_gym_idx" ON "members" USING btree ("gym_id");--> statement-breakpoint
CREATE INDEX "members_trainer_idx" ON "members" USING btree ("gym_id","default_trainer_id");--> statement-breakpoint
CREATE INDEX "payments_gym_idx" ON "payments" USING btree ("gym_id","member_id");--> statement-breakpoint
CREATE INDEX "program_days_program_idx" ON "program_days" USING btree ("program_id","position");--> statement-breakpoint
CREATE INDEX "program_items_day_idx" ON "program_items" USING btree ("day_id","position");--> statement-breakpoint
CREATE INDEX "session_adjustments_gym_idx" ON "session_adjustments" USING btree ("gym_id","member_id");--> statement-breakpoint
CREATE INDEX "session_exercises_session_idx" ON "session_exercises" USING btree ("session_id","position");--> statement-breakpoint
CREATE INDEX "session_set_logs_exercise_idx" ON "session_set_logs" USING btree ("session_exercise_id","set_number");--> statement-breakpoint
CREATE INDEX "sessions_gym_date_idx" ON "sessions" USING btree ("gym_id","date");--> statement-breakpoint
CREATE INDEX "sessions_member_idx" ON "sessions" USING btree ("gym_id","member_id");--> statement-breakpoint
CREATE INDEX "sessions_trainer_idx" ON "sessions" USING btree ("gym_id","trainer_id");--> statement-breakpoint
CREATE INDEX "trainer_payouts_gym_idx" ON "trainer_payouts" USING btree ("gym_id","trainer_id");--> statement-breakpoint
CREATE INDEX "trainers_gym_idx" ON "trainers" USING btree ("gym_id");--> statement-breakpoint
CREATE INDEX "users_gym_idx" ON "users" USING btree ("gym_id","role");--> statement-breakpoint
CREATE INDEX "workout_programs_gym_idx" ON "workout_programs" USING btree ("gym_id","member_id");--> statement-breakpoint
CREATE INDEX "workout_programs_trainer_idx" ON "workout_programs" USING btree ("gym_id","trainer_id");