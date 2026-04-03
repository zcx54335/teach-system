-- 1. 新增字段以支持多科目、学校及独立的课时余额体系
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS subjects text[] DEFAULT '{}';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS course_balances jsonb DEFAULT '{}'::jsonb;

-- 2. 数据兼容性迁移 (可选):
-- 如果以前有 `remaining_classes`，可以将其作为默认的『理科逻辑』科目余额迁移到 jsonb 中。
-- 如果没有，可以跳过此步骤。
UPDATE public.students 
SET course_balances = jsonb_build_object('理科逻辑', remaining_classes)
WHERE remaining_classes IS NOT NULL AND course_balances = '{}'::jsonb;