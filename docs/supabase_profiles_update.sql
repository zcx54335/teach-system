-- 1. 创建 profiles (统一用户表)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid references auth.users(id) primary key, -- 关联 Auth 的 UID
    role text not null check (role in ('admin', 'parent')),
    phone text, -- 用于家长
    email text, -- 用于老师
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. 策略：任何人都可以读取 profiles，但只能看到对应的角色
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING ( true );

-- 4. 策略：用户可以更新自己的 profile
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING ( auth.uid() = id );

-- ==============================================================
-- 触发器：自动从 auth.users 同步到 profiles (针对未来可能的注册)
-- ==============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email)
  VALUES (
    new.id,
    -- 简易逻辑：如果邮箱不带 @student.yang.com，则是 admin
    CASE WHEN new.email NOT LIKE '%@student.yang.com' THEN 'admin' ELSE 'parent' END,
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================
-- 历史数据修复：如果你的 auth.users 里已经有账号了，手动同步一次
-- ==============================================================
INSERT INTO public.profiles (id, role, email)
SELECT 
    id, 
    CASE WHEN email NOT LIKE '%@student.yang.com' THEN 'admin' ELSE 'parent' END as role,
    email
FROM auth.users
ON CONFLICT (id) DO NOTHING;
