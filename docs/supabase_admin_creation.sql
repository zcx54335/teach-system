-- 1. 确保 profiles 表存在
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid references auth.users(id) primary key,
    role text not null check (role in ('admin', 'parent')),
    phone text,
    email text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 预设你的管理员账号 (需要先在 auth.users 创建，所以这里我们通过 PL/pgSQL 进行)
DO $$
DECLARE
  v_admin_uid uuid := gen_random_uuid();
  -- ==========================================
  -- 请注意：这只是一种在 SQL 层面强制写入 Auth 的技巧。
  -- 实际上，推荐你直接用邮箱和密码去 Login 页面注册，或者通过 Supabase 仪表盘手动创建。
  -- ==========================================
  v_phone text := '13281250502'; -- 你的手机号
  v_password text := 'yang123456'; -- 你的密码
  v_email text := '13281250502@admin.yang.com'; -- 管理员专属虚拟邮箱
BEGIN
  -- 检查是否已经存在该邮箱
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    -- 插入 auth.users
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role
    ) VALUES (
      v_admin_uid, '00000000-0000-0000-0000-000000000000', v_email,
      crypt(v_password, gen_salt('bf')), -- 加密密码
      now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'
    );
    
    -- 插入 identities (Supabase Auth 需要)
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_admin_uid, v_admin_uid::text, 
      format('{"sub":"%s","email":"%s"}', v_admin_uid::text, v_email)::jsonb, 
      'email', now(), now(), now()
    );

    -- 插入 profiles
    INSERT INTO public.profiles (id, role, phone, email)
    VALUES (v_admin_uid, 'admin', v_phone, v_email)
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;
END $$;
