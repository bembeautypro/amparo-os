-- medications
DO $$ BEGIN
  CREATE TYPE public.medication_status AS ENUM ('active','paused','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS status public.medication_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS schedule jsonb;

-- appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS responsible_user_id uuid;
CREATE INDEX IF NOT EXISTS appointments_responsible_idx
  ON public.appointments(responsible_user_id);

-- medication_logs
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  scheduled_for timestamptz NOT NULL,
  taken_at timestamptz,
  taken_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS medication_logs_patient_day_idx
  ON public.medication_logs(patient_id, scheduled_for);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medication_logs TO authenticated;
GRANT ALL ON public.medication_logs TO service_role;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members can view medication logs" ON public.medication_logs;
CREATE POLICY "members can view medication logs"
  ON public.medication_logs FOR SELECT TO authenticated
  USING (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()));

DROP POLICY IF EXISTS "admins can manage medication logs" ON public.medication_logs;
CREATE POLICY "admins can manage medication logs"
  ON public.medication_logs FOR ALL TO authenticated
  USING (app_private.is_family_admin(app_private.patient_family(patient_id), auth.uid()))
  WITH CHECK (app_private.is_family_admin(app_private.patient_family(patient_id), auth.uid()));
