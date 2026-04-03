-- Supabase Schema Update V7: Financial Orders Table
-- This script adds the `orders` table to manage course purchases and financial tracking.

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  subject text NOT NULL,
  total_classes integer NOT NULL,
  total_price numeric(10, 2) NOT NULL,
  unit_price numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'active', -- 'active' | 'depleted'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (sysadmin/admin only in practice)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Enable all access for all users" ON public.orders;

-- Create policies (simplified for rapid SaaS development)
CREATE POLICY "Enable all access for all users" ON public.orders FOR ALL USING (true) WITH CHECK (true);
