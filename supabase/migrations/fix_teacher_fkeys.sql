-- Drop old constraints
alter table "public"."students" drop constraint if exists "students_teacher_id_fkey";
alter table "public"."schedules" drop constraint if exists "schedules_teacher_id_fkey";

-- Add new constraints pointing to users table
alter table "public"."students" add constraint "students_teacher_id_fkey" foreign key ("teacher_id") references "public"."users"("id");
alter table "public"."schedules" add constraint "schedules_teacher_id_fkey" foreign key ("teacher_id") references "public"."users"("id");