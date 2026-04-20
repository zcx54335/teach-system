ALTER TABLE "public"."users" ADD COLUMN "username" text UNIQUE;
ALTER TABLE "public"."users" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "public"."users" ADD CONSTRAINT "users_phone_or_username_check" CHECK (phone IS NOT NULL OR username IS NOT NULL);

ALTER TABLE "public"."students" ADD COLUMN "parent_username" text;
