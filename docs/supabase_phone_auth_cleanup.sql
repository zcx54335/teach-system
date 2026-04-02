-- ==========================================
-- 1. 清理假邮箱数据 (以 @admin.yang.com 和 @student.yang.com 结尾的测试数据)
-- ==========================================
-- 首先删除 public.profiles 中对应的假数据
DELETE FROM public.profiles 
WHERE email LIKE '%@admin.yang.com' OR email LIKE '%@student.yang.com';

-- 删除 auth.users 中对应的假数据 (这会自动级联删除 auth.identities)
DELETE FROM auth.users 
WHERE email LIKE '%@admin.yang.com' OR email LIKE '%@student.yang.com';


-- ==========================================
-- 2. 修改 profiles 表，确保 phone 字段的唯一性
-- ==========================================
-- 如果表里已经有重复的 phone 导致建约束失败，建议手动清理
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_key UNIQUE (phone);


-- ==========================================
-- 3. 重新建立基于纯手机号 (Phone Auth) 的管理员账号
-- ==========================================
DO $$
DECLARE
  v_admin_uid uuid := gen_random_uuid();
  v_phone text := '13281250502'; -- 管理员手机号
  v_password text := 'yang123456'; -- 管理员密码
BEGIN
  -- 检查是否已经存在该手机号的账号
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE phone = v_phone) THEN
    
    -- 插入 auth.users (以 phone 模式)
    INSERT INTO auth.users (
      id, instance_id, phone, encrypted_password, phone_confirmed_at, 
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role
    ) VALUES (
      v_admin_uid, '00000000-0000-0000-0000-000000000000', v_phone,
      crypt(v_password, gen_salt('bf')), -- 加密密码
      now(), now(), now(), '{"provider":"phone","providers":["phone"]}', '{}', false, 'authenticated'
    );
    
    -- 插入 identities (Supabase Auth 手机号模式需要)
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_admin_uid, v_admin_uid::text, 
      format('{"sub":"%s","phone":"%s"}', v_admin_uid::text, v_phone)::jsonb, 
      'phone', now(), now(), now()
    );

    -- 插入 public.profiles 并设置角色为 admin
    INSERT INTO public.profiles (id, role, phone)
    VALUES (v_admin_uid, 'admin', v_phone)
    ON CONFLICT (id) DO UPDATE SET role = 'admin', phone = v_phone;
    
  END IF;
END $$;


-- ==========================================
-- 4. 修正自动触发器逻辑 (只依靠 phone)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 默认逻辑：新创建的手机号账号如果是 13281250502 则是 admin，否则是 parent
  INSERT INTO public.profiles (id, role, phone)
  VALUES (
    new.id,
    CASE WHEN new.phone = '13281250502' THEN 'admin' ELSE 'parent' END,
    new.phone
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
