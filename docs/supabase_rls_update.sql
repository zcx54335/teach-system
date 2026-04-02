-- 1. 添加 auth_id 字段以关联 Supabase Auth
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS auth_id uuid REFERENCES auth.users(id);

-- 2. 启用 Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 3. 移除之前可能存在的开放策略
DROP POLICY IF EXISTS "Enable all access for all users" ON public.students;

-- ==========================================
-- 策略 1：保持学情报告页免登录访问 (公开读取)
-- ==========================================
-- 家长可以通过 URL 上的 student_id 直接读取自己孩子的信息
CREATE POLICY "Public Read Access" 
ON public.students 
FOR SELECT 
USING (true);

-- ==========================================
-- 策略 2：老师 (Admin) 拥有全部权限
-- ==========================================
-- 我们通过邮箱后缀识别老师：只要登录邮箱不是 '@student.aalon.com' 结尾，就是老师。
CREATE POLICY "Admin Full Access" 
ON public.students 
FOR ALL 
USING (
    auth.uid() IS NOT NULL 
    AND auth.email() NOT LIKE '%@student.aalon.com'
);

-- ==========================================
-- 策略 3：家长登录后只能修改自己的信息
-- ==========================================
-- 确保只能 UPDATE 自己绑定的 auth_id 记录
CREATE POLICY "Parent Update Own" 
ON public.students 
FOR UPDATE 
USING (
    auth.uid() = auth_id
) 
WITH CHECK (
    auth.uid() = auth_id
);

-- 注意：家长不能 INSERT（新增学生）或 DELETE（删除学生）
