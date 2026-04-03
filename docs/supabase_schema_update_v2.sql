-- 1. 为 students 表新增 parent_phone 字段
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_phone text;

-- 将现有的 phone 值默认拷贝给 parent_phone 作为过渡兼容
UPDATE public.students SET parent_phone = phone WHERE parent_phone IS NULL;

-- 2. profiles 表的 role 字段说明：
-- 当前系统中 role 主要有：'sysadmin', 'teacher', 'parent'
-- 若有 'admin' 则兼容为 'sysadmin'，确保后续新建立账号时遵循这三个值。

-- 更新现有的 'admin' 角色为 'sysadmin' 以配合新的架构
UPDATE public.profiles SET role = 'sysadmin' WHERE role = 'admin';