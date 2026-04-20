alter table "public"."lessons" add column "start_time" text;
alter table "public"."lessons" add column "end_time" text;
drop table if exists "public"."schedules";
