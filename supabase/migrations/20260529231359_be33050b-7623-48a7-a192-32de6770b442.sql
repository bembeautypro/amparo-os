ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS document_date date,
  ADD COLUMN IF NOT EXISTS doctor_name text,
  ADD COLUMN IF NOT EXISTS institution text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expiry_date date,
  ADD COLUMN IF NOT EXISTS clinical_event_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_documents_patient_active
  ON public.documents (patient_id, created_at DESC)
  WHERE deleted_at IS NULL;