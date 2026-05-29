-- Add phone column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Create profile-photos bucket for user avatar uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies on storage.objects scoped to profile-photos
CREATE POLICY "Users can view own profile photo"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own profile photo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own profile photo"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own profile photo"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);