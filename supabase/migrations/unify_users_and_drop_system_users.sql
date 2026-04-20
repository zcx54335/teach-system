-- 1. Extend the role check constraint in users table to include 'admin'
ALTER TABLE "public"."users" DROP CONSTRAINT IF EXISTS "users_role_check";
ALTER TABLE "public"."users" ADD CONSTRAINT "users_role_check" CHECK (role = ANY (ARRAY['teacher'::text, 'parent'::text, 'admin'::text, 'sysadmin'::text, 'super_admin'::text]));

-- 2. Insert super admin account
INSERT INTO "public"."users" (phone, password, role, name)
VALUES ('admin', '123', 'admin', '超级管理员')
ON CONFLICT (phone) DO NOTHING;

-- 3. Drop system_users table
DROP TABLE IF EXISTS "public"."system_users";
