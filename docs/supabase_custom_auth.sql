-- ==========================================
-- 为 profiles 表增加密码和姓名字段 (如果你还没加的话)
-- ==========================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;

-- ==========================================
-- 直接将管理员账号插入 profiles 表 (不依赖 auth.users)
-- ==========================================
DO $$
DECLARE
  v_admin_uid uuid := '00000000-0000-0000-0000-000000000000'::uuid; -- 或者你可以用 gen_random_uuid()，这里为了演示，如果你已经有确定的 ID 可以替换
  v_phone text := '+8613281250502';
  v_password text := 'yang123456';
BEGIN
  -- 如果表里没有这个手机号，就直接插入
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE phone = v_phone OR phone = '13281250502') THEN
    INSERT INTO public.profiles (id, role, phone, password, full_name)
    VALUES (gen_random_uuid(), 'admin', v_phone, v_password, '杨老师');
  ELSE
    -- 如果有，就强制更新它的密码和权限
    UPDATE public.profiles 
    SET password = v_password, role = 'admin', full_name = '杨老师'
    WHERE phone = v_phone OR phone = '13281250502';
  END IF;
END $$;
