-- ==========================================
-- 重建管理员账号（带有正确的 +86 前缀）
-- ==========================================
DO $$
DECLARE
  v_admin_uid uuid := gen_random_uuid();
  v_phone text := '+8613281250502'; -- 带有国家代码前缀的手机号
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
    -- 注意：为了保持业务逻辑中查询手机号的便利性，profiles 中的 phone 可以只存 '13281250502' 或完整保存。
    -- 这里我们完整保存 '+8613281250502'
    INSERT INTO public.profiles (id, role, phone)
    VALUES (v_admin_uid, 'admin', v_phone)
    ON CONFLICT (id) DO UPDATE SET role = 'admin', phone = v_phone;
    
  END IF;
END $$;

-- 修正自动触发器逻辑
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, phone)
  VALUES (
    new.id,
    -- 只要包含 13281250502 就是 admin
    CASE WHEN new.phone LIKE '%13281250502' THEN 'admin' ELSE 'parent' END,
    new.phone
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
