-- Supabase Schema Update V5: Create schedules table
-- This script adds the `schedules` table to support the calendar-driven Teacher Workbench.

CREATE TABLE IF NOT EXISTS public.schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL, -- Format: YYYY-MM-DD
  start_time text NOT NULL, -- Format: HH:mm
  end_time text NOT NULL, -- Format: HH:mm
  subject text NOT NULL,
  student_ids jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of student UUIDs
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'completed'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Assuming admins and teachers can manage schedules)
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.schedules;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.schedules;
DROP POLICY IF EXISTS "Enable update for all users" ON public.schedules;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.schedules;

-- Create policies (simplified for rapid SaaS development)
CREATE POLICY "Enable read access for all users" ON public.schedules FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.schedules FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.schedules FOR DELETE USING (true);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_schedules_modtime ON public.schedules;
CREATE TRIGGER update_schedules_modtime
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
