-- 添加 teacher_id 到 students 表，以便实现不同角色的数据隔离
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 允许在 students 表上进行基于 teacher_id 的 RLS 策略（如果开启了 RLS）
-- 这里仅为结构扩充，方便后续的 API 查询过滤。