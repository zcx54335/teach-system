create table "public"."recharge_records" (
    "id" uuid not null default gen_random_uuid(),
    "student_id" uuid not null references "public"."students"("id") on delete cascade,
    "subject" text not null,
    "amount" integer not null,
    "notes" text,
    "created_at" timestamp with time zone default now()
);

alter table "public"."recharge_records" add constraint "recharge_records_pkey" primary key ("id");