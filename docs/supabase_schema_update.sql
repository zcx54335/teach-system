-- 1. 增加剩余课时与手机号字段 (已包含在先前的结构中，这里做 IF NOT EXISTS 保护)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS remaining_classes integer not null default 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS password_hash text;

-- 2. 增加理化成绩字段
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS physics_score integer default 3 check (physics_score between 1 and 5);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS chemistry_score integer default 3 check (chemistry_score between 1 and 5);

-- 3. （可选）重命名原有的 `calc_score`, `logic_score` 等描述（如果你需要直接在前端映射这些字段，数据库无需改名，前端渲染时替换 Label 即可。如果你想连库一起改，可以使用 RENAME COLUMN）
-- 此处为了兼容已有逻辑，建议直接复用 `calc_score` 代表计算力，`logic_score` 代表逻辑推理，前端新增两项即可。