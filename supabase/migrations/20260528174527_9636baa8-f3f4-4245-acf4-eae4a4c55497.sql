
-- ===== APPOINTMENTS =====
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'done', 'cancelled');

CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  title TEXT NOT NULL,
  specialty TEXT,
  doctor_name TEXT,
  location TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view appointments"
ON public.appointments FOR SELECT TO authenticated
USING (public.is_family_member(public.patient_family(patient_id), auth.uid()));

CREATE POLICY "admins can manage appointments"
ON public.appointments FOR ALL TO authenticated
USING (public.is_family_admin(public.patient_family(patient_id), auth.uid()))
WITH CHECK (public.is_family_admin(public.patient_family(patient_id), auth.uid()));

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_appointments_patient_scheduled ON public.appointments(patient_id, scheduled_at);

-- ===== DOCUMENTS =====
CREATE TYPE public.document_type AS ENUM ('prescription', 'exam', 'report', 'other');

CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  title TEXT NOT NULL,
  doc_type public.document_type NOT NULL DEFAULT 'other',
  file_path TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER,
  exam_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view documents"
ON public.documents FOR SELECT TO authenticated
USING (public.is_family_member(public.patient_family(patient_id), auth.uid()));

CREATE POLICY "admins can manage documents"
ON public.documents FOR ALL TO authenticated
USING (public.is_family_admin(public.patient_family(patient_id), auth.uid()))
WITH CHECK (public.is_family_admin(public.patient_family(patient_id), auth.uid()));

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_documents_patient ON public.documents(patient_id, created_at DESC);

-- ===== STORAGE BUCKET (private) =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Path convention: <patient_id>/<filename>
CREATE POLICY "members can read patient documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND public.is_family_member(
    public.patient_family(((storage.foldername(name))[1])::uuid),
    auth.uid()
  )
);

CREATE POLICY "admins can upload patient documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'patient-documents'
  AND public.is_family_admin(
    public.patient_family(((storage.foldername(name))[1])::uuid),
    auth.uid()
  )
);

CREATE POLICY "admins can update patient documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND public.is_family_admin(
    public.patient_family(((storage.foldername(name))[1])::uuid),
    auth.uid()
  )
);

CREATE POLICY "admins can delete patient documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND public.is_family_admin(
    public.patient_family(((storage.foldername(name))[1])::uuid),
    auth.uid()
  )
);
