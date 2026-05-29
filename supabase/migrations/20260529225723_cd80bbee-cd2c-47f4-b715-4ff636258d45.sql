
-- 1. Extend medication_status enum
ALTER TYPE public.medication_status ADD VALUE IF NOT EXISTS 'ended';

-- 2. Add columns to medications
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS generic_name text,
  ADD COLUMN IF NOT EXISTS form text,
  ADD COLUMN IF NOT EXISTS start_date date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS prescriber text,
  ADD COLUMN IF NOT EXISTS photo_path text;

-- 3. Extend medication_logs
ALTER TABLE public.medication_logs
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'taken',
  ADD COLUMN IF NOT EXISTS logged_by uuid;

ALTER TABLE public.medication_logs
  DROP CONSTRAINT IF EXISTS medication_logs_status_check;
ALTER TABLE public.medication_logs
  ADD CONSTRAINT medication_logs_status_check
  CHECK (status IN ('taken', 'missed', 'skipped'));

CREATE UNIQUE INDEX IF NOT EXISTS medication_logs_med_sched_uniq
  ON public.medication_logs (medication_id, scheduled_for);

-- 4. medication_change_history
CREATE TABLE IF NOT EXISTS public.medication_change_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  field_changed text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.medication_change_history TO authenticated;
GRANT ALL ON public.medication_change_history TO service_role;

ALTER TABLE public.medication_change_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view change history"
ON public.medication_change_history
FOR SELECT
TO authenticated
USING (
  app_private.is_family_member(
    app_private.patient_family((SELECT patient_id FROM public.medications WHERE id = medication_id)),
    auth.uid()
  )
);

CREATE POLICY "admins can insert change history"
ON public.medication_change_history
FOR INSERT
TO authenticated
WITH CHECK (
  changed_by = auth.uid()
  AND app_private.is_family_admin(
    app_private.patient_family((SELECT patient_id FROM public.medications WHERE id = medication_id)),
    auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS medication_change_history_med_idx
  ON public.medication_change_history (medication_id, changed_at DESC);

-- 5. Bucket medication-photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('medication-photos', 'medication-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "medication photos: family members read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'medication-photos'
  AND app_private.is_family_member(
    app_private.patient_family(((storage.foldername(name))[1])::uuid),
    auth.uid()
  )
);

CREATE POLICY "medication photos: admins write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'medication-photos'
  AND app_private.is_family_admin(
    app_private.patient_family(((storage.foldername(name))[1])::uuid),
    auth.uid()
  )
);

CREATE POLICY "medication photos: admins update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'medication-photos'
  AND app_private.is_family_admin(
    app_private.patient_family(((storage.foldername(name))[1])::uuid),
    auth.uid()
  )
);

CREATE POLICY "medication photos: admins delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'medication-photos'
  AND app_private.is_family_admin(
    app_private.patient_family(((storage.foldername(name))[1])::uuid),
    auth.uid()
  )
);
