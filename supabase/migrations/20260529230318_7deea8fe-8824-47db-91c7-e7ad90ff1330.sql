
-- Appointment type enum
CREATE TYPE public.appointment_type AS ENUM (
  'consulta','exame','retorno','procedimento','fisioterapia','vacina','outro'
);

-- Clinical event type enum
CREATE TYPE public.clinical_event_type AS ENUM (
  'consultation','exam_result','procedure','hospitalization','diagnosis','vaccination','other'
);

-- Extend appointments
ALTER TABLE public.appointments
  ADD COLUMN type public.appointment_type NOT NULL DEFAULT 'consulta',
  ADD COLUMN parent_appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN address text,
  ADD COLUMN map_url text;

CREATE INDEX idx_appointments_parent ON public.appointments(parent_appointment_id);
CREATE INDEX idx_appointments_patient_date ON public.appointments(patient_id, scheduled_at);

-- Extend documents
ALTER TABLE public.documents
  ADD COLUMN appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;

CREATE INDEX idx_documents_appointment ON public.documents(appointment_id);

-- Clinical events
CREATE TABLE public.clinical_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  type public.clinical_event_type NOT NULL DEFAULT 'consultation',
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinical_events TO authenticated;
GRANT ALL ON public.clinical_events TO service_role;

ALTER TABLE public.clinical_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view clinical events"
ON public.clinical_events FOR SELECT TO authenticated
USING (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()));

CREATE POLICY "admins can manage clinical events"
ON public.clinical_events FOR ALL TO authenticated
USING (app_private.is_family_admin(app_private.patient_family(patient_id), auth.uid()))
WITH CHECK (app_private.is_family_admin(app_private.patient_family(patient_id), auth.uid()));

CREATE INDEX idx_clinical_events_patient ON public.clinical_events(patient_id, event_date DESC);
CREATE INDEX idx_clinical_events_appointment ON public.clinical_events(appointment_id);

CREATE TRIGGER update_clinical_events_updated_at
BEFORE UPDATE ON public.clinical_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
