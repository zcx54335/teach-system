-- 启用 UUID 扩展
create extension if not exists "uuid-ossp";

-- 1. 创建 students 表
create table public.students (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    grade text not null,
    total_classes integer not null default 0,
    remaining_classes integer not null default 0,
    phone text,
    time text, -- 模拟的上课时间段
    status text default 'enrolled' check (status in ('enrolled', 'intent', 'completed')), -- 状态: 报名(enrolled)/意向(intent)/结课(completed)
    price_per_lesson numeric(10, 2) default 0, -- 单价
    total_amount numeric(10, 2) default 0, -- 总学费
    enrollment_date date, -- 报名日期
    last_deducted_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 创建 class_records 表
create table public.class_records (
    id uuid default uuid_generate_v4() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    date date not null,
    topic text not null,
    comment text,
    homework_content text,
    homework_task text, -- 老师布置的作业文字描述
    homework_ref_image text, -- 老师上传的参考题目图片URL
    status text default 'pending' check (status in ('pending', 'submitted', 'reviewed')),
    homework_images text[] default '{}', -- 存储上传的作业图片URL数组
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 创建 homework_assets 表
create table public.homework_assets (
    id uuid default uuid_generate_v4() primary key,
    record_id uuid references public.class_records(id) on delete cascade not null,
    image_url text not null,
    uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 设置 Row Level Security (RLS) 策略为允许所有操作（由于是个人项目，初期可以开放，后续再配置权限）
alter table public.students enable row level security;
alter table public.class_records enable row level security;
alter table public.homework_assets enable row level security;

create policy "Enable all access for all users" on public.students for all using (true);
create policy "Enable all access for all users" on public.class_records for all using (true);
create policy "Enable all access for all users" on public.homework_assets for all using (true);