CREATE TABLE "user_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"gym_id" uuid,
	"role" "user_role" NOT NULL,
	"entity_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_roles_user_gym_role_key" ON "user_roles" USING btree ("user_id","gym_id","role");--> statement-breakpoint
CREATE INDEX "user_roles_user_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_gym_idx" ON "user_roles" USING btree ("gym_id","role");--> statement-breakpoint
-- هر حساب موجود دقیقاً یک عضویت می‌گیرد: همان نقشی که امروز دارد
INSERT INTO "user_roles" ("id", "user_id", "gym_id", "role", "entity_id", "is_active", "last_used_at", "created_at")
SELECT gen_random_uuid()::text, "id", "gym_id", "role", "entity_id", "is_active", "last_login_at", "created_at"
FROM "users";
