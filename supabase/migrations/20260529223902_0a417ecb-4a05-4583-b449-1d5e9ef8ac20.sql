-- Status para condições médicas
DO $$ BEGIN
  CREATE TYPE public.condition_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.patient_conditions
  ADD COLUMN IF NOT EXISTS status public.condition_status NOT NULL DEFAULT 'active';

-- Prioridade para contatos de emergência
ALTER TABLE public.emergency_contacts
  ADD COLUMN IF NOT EXISTS priority smallint NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS emergency_contacts_patient_priority_idx
  ON public.emergency_contacts (patient_id, priority);
