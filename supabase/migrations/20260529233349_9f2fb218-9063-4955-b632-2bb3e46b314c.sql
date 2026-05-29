-- Add 'critical' severity to enum (placed before 'high' would be ideal but ADD VALUE only supports BEFORE/AFTER existing labels)
ALTER TYPE severity_level ADD VALUE IF NOT EXISTS 'critical' AFTER 'high';

-- Extend patients with clinical/contextual fields
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS height_cm integer,
  ADD COLUMN IF NOT EXISTS weight_kg numeric(5,2),
  ADD COLUMN IF NOT EXISTS critical_notes text,
  ADD COLUMN IF NOT EXISTS preferred_hospital text,
  ADD COLUMN IF NOT EXISTS primary_doctor text;

-- Diagnosis date for conditions
ALTER TABLE public.patient_conditions
  ADD COLUMN IF NOT EXISTS diagnosed_at date;
