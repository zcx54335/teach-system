alter table "public"."students" add column "teacher_id" uuid;
alter table "public"."students" add constraint "students_teacher_id_fkey" foreign key ("teacher_id") references "public"."profiles"("id");