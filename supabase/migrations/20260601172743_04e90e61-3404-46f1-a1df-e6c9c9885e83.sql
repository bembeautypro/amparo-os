
-- ============ PROFILES ============
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_step int NOT NULL DEFAULT 0;

-- ============ PATIENTS ============
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;
CREATE INDEX IF NOT EXISTS idx_patients_deleted_at ON public.patients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_patients_family_id ON public.patients(family_id);

-- ============ MEDICATIONS ============
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;
CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON public.medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_status ON public.medications(status);
CREATE INDEX IF NOT EXISTS idx_medications_deleted_at ON public.medications(deleted_at);

-- Validate schedule format {"times":[...]}
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'medications_schedule_format_chk'
  ) THEN
    ALTER TABLE public.medications
      ADD CONSTRAINT medications_schedule_format_chk
      CHECK (
        schedule IS NULL
        OR (jsonb_typeof(schedule->'times') = 'array')
      );
  END IF;
END $$;

-- ============ APPOINTMENTS ============
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_deleted_at ON public.appointments(deleted_at);

-- ============ CLINICAL_EVENTS ============
ALTER TABLE public.clinical_events
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;
CREATE INDEX IF NOT EXISTS idx_clinical_events_patient_id ON public.clinical_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_events_event_date ON public.clinical_events(event_date);
CREATE INDEX IF NOT EXISTS idx_clinical_events_deleted_at ON public.clinical_events(deleted_at);

-- ============ DOCUMENTS ============
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS uploaded_by uuid,
  ADD COLUMN IF NOT EXISTS ocr_text text,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

-- search_vector (generated column)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='documents' AND column_name='search_vector'
  ) THEN
    ALTER TABLE public.documents
      ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('portuguese',
          coalesce(title,'') || ' ' ||
          coalesce(doctor_name,'') || ' ' ||
          coalesce(institution,'') || ' ' ||
          coalesce(ocr_text,'')
        )
      ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_documents_patient_id ON public.documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON public.documents(deleted_at);
CREATE INDEX IF NOT EXISTS idx_documents_fts ON public.documents USING GIN(search_vector);

-- ============ PATIENT_CONDITIONS ============
ALTER TABLE public.patient_conditions
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;
CREATE INDEX IF NOT EXISTS idx_patient_conditions_patient_id ON public.patient_conditions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_conditions_deleted_at ON public.patient_conditions(deleted_at);

-- ============ PATIENT_ALLERGIES ============
ALTER TABLE public.patient_allergies
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;
CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient_id ON public.patient_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_deleted_at ON public.patient_allergies(deleted_at);

-- ============ EMERGENCY_CONTACTS ============
ALTER TABLE public.emergency_contacts
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_patient_id ON public.emergency_contacts(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_deleted_at ON public.emergency_contacts(deleted_at);

-- ============ ACCESS_LOGS ============
ALTER TABLE public.access_logs
  ADD COLUMN IF NOT EXISTS resource_type text,
  ADD COLUMN IF NOT EXISTS resource_id uuid,
  ADD COLUMN IF NOT EXISTS ip_address text;
CREATE INDEX IF NOT EXISTS idx_access_logs_patient_id ON public.access_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_accessed_at ON public.access_logs(accessed_at);

-- ============ TRIGGERS updated_at ============
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='patient_conditions_updated_at') THEN
    CREATE TRIGGER patient_conditions_updated_at BEFORE UPDATE ON public.patient_conditions
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============ HANDLE_NEW_USER (set onboarding_step=0) ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, onboarding_step)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on auth.users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ============ RLS: respect soft delete on SELECT/UPDATE (model stays OPEN to family members) ============

-- patients
DROP POLICY IF EXISTS "members can view patients" ON public.patients;
CREATE POLICY "members can view patients" ON public.patients FOR SELECT TO authenticated
  USING (app_private.is_family_member(family_id, auth.uid()) AND deleted_at IS NULL);

DROP POLICY IF EXISTS "members can update patients" ON public.patients;
CREATE POLICY "members can update patients" ON public.patients FOR UPDATE TO authenticated
  USING (app_private.is_family_member(family_id, auth.uid()) AND deleted_at IS NULL)
  WITH CHECK (app_private.is_family_member(family_id, auth.uid()));

-- medications
DROP POLICY IF EXISTS "members can view medications" ON public.medications;
CREATE POLICY "members can view medications" ON public.medications FOR SELECT TO authenticated
  USING (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()) AND deleted_at IS NULL);

DROP POLICY IF EXISTS "members can manage medications" ON public.medications;
CREATE POLICY "members can manage medications" ON public.medications FOR ALL TO authenticated
  USING (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()))
  WITH CHECK (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()));

-- appointments
DROP POLICY IF EXISTS "members can view appointments" ON public.appointments;
CREATE POLICY "members can view appointments" ON public.appointments FOR SELECT TO authenticated
  USING (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()) AND deleted_at IS NULL);

-- clinical_events
DROP POLICY IF EXISTS "members can view clinical events" ON public.clinical_events;
CREATE POLICY "members can view clinical events" ON public.clinical_events FOR SELECT TO authenticated
  USING (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()) AND deleted_at IS NULL);

-- documents (already filters deleted_at via app code; enforce in RLS too)
DROP POLICY IF EXISTS "members can view documents" ON public.documents;
CREATE POLICY "members can view documents" ON public.documents FOR SELECT TO authenticated
  USING (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()) AND deleted_at IS NULL);

-- patient_conditions
DROP POLICY IF EXISTS "members can view conditions" ON public.patient_conditions;
CREATE POLICY "members can view conditions" ON public.patient_conditions FOR SELECT TO authenticated
  USING (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()) AND deleted_at IS NULL);

-- patient_allergies
DROP POLICY IF EXISTS "members can view allergies" ON public.patient_allergies;
CREATE POLICY "members can view allergies" ON public.patient_allergies FOR SELECT TO authenticated
  USING (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()) AND deleted_at IS NULL);

-- emergency_contacts
DROP POLICY IF EXISTS "members can view emergency contacts" ON public.emergency_contacts;
CREATE POLICY "members can view emergency contacts" ON public.emergency_contacts FOR SELECT TO authenticated
  USING (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()) AND deleted_at IS NULL);
