ALTER TABLE "public"."students" DROP CONSTRAINT IF EXISTS "students_auth_id_fkey";
ALTER TABLE "public"."students" ADD CONSTRAINT "students_auth_id_fkey" FOREIGN KEY (auth_id) REFERENCES "public"."users"(id) ON DELETE SET NULL;

ALTER TABLE "public"."notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_fkey";
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "public"."users"(id) ON DELETE CASCADE;

DROP TABLE IF EXISTS "public"."profiles";
