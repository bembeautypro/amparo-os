
-- Severity enum
CREATE TYPE public.clinical_severity AS ENUM ('low','medium','high','critical');

-- Expand clinical_event_type
ALTER TYPE public.clinical_event_type ADD VALUE IF NOT EXISTS 'surgery';
ALTER TYPE public.clinical_event_type ADD VALUE IF NOT EXISTS 'symptom';
ALTER TYPE public.clinical_event_type ADD VALUE IF NOT EXISTS 'fall';
ALTER TYPE public.clinical_event_type ADD VALUE IF NOT EXISTS 'medication_change';
ALTER TYPE public.clinical_event_type ADD VALUE IF NOT EXISTS 'follow_up';
ALTER TYPE public.clinical_event_type ADD VALUE IF NOT EXISTS 'crisis';
ALTER TYPE public.clinical_event_type ADD VALUE IF NOT EXISTS 'family_observation';

-- Extend clinical_events
ALTER TABLE public.clinical_events
  ADD COLUMN severity public.clinical_severity NOT NULL DEFAULT 'low',
  ADD COLUMN doctor_name text,
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}'::text[];

-- Link documents to clinical events
ALTER TABLE public.documents
  ADD COLUMN clinical_event_id uuid REFERENCES public.clinical_events(id) ON DELETE SET NULL;

CREATE INDEX idx_documents_clinical_event ON public.documents(clinical_event_id);

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone authenticated can read profiles"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "users update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "users insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing users
INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email),
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
