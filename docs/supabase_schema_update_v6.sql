-- Supabase Schema Update V6: Storage for Class Media and Schedule JSONB

-- 1. Create a Storage Bucket for Class Media (Images/Whiteboard photos)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('class_media', 'class_media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'class_media' );

-- Allow authenticated users (teachers/admins) to upload
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'class_media' );

-- 2. Add 'report_data' column to schedules table to store the rich media form data
-- This allows the public report page to fetch all info using just the schedule ID
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS report_data jsonb DEFAULT '{}'::jsonb;
