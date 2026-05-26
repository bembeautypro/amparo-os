
-- ============ ENUMS ============
CREATE TYPE public.family_role AS ENUM ('admin', 'member', 'caregiver');
CREATE TYPE public.member_relation AS ENUM ('child', 'spouse', 'caregiver', 'other');
CREATE TYPE public.member_status AS ENUM ('active', 'invited');
CREATE TYPE public.blood_type AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown');
CREATE TYPE public.severity_level AS ENUM ('low','medium','high');

-- ============ TIMESTAMP TRIGGER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ TABLES ============
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.family_role NOT NULL DEFAULT 'member',
  relation public.member_relation NOT NULL DEFAULT 'other',
  status public.member_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (family_id, user_id)
);
CREATE INDEX idx_family_members_user ON public.family_members(user_id);
CREATE INDEX idx_family_members_family ON public.family_members(family_id);

CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  birth_date DATE,
  relation TEXT,
  photo_url TEXT,
  blood_type public.blood_type,
  insurance_name TEXT,
  insurance_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_patients_family ON public.patients(family_id);

CREATE TABLE public.patient_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_conditions_patient ON public.patient_conditions(patient_id);

CREATE TABLE public.patient_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  severity public.severity_level NOT NULL DEFAULT 'high',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_allergies_patient ON public.patient_allergies(patient_id);

CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_emergency_patient ON public.emergency_contacts(patient_id);

CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_medications_patient ON public.medications(patient_id);

-- ============ UPDATED_AT TRIGGERS ============
CREATE TRIGGER trg_families_updated BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_medications_updated BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SECURITY DEFINER HELPERS ============
CREATE OR REPLACE FUNCTION public.is_family_member(_family_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = _family_id AND user_id = _user_id AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_family_admin(_family_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = _family_id AND user_id = _user_id
      AND status = 'active' AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.patient_family(_patient_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT family_id FROM public.patients WHERE id = _patient_id;
$$;

-- ============ RLS ============
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- families
CREATE POLICY "members can view their families" ON public.families
  FOR SELECT TO authenticated USING (public.is_family_member(id, auth.uid()));
CREATE POLICY "authenticated can create families" ON public.families
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "admins can update their families" ON public.families
  FOR UPDATE TO authenticated USING (public.is_family_admin(id, auth.uid()));
CREATE POLICY "admins can delete their families" ON public.families
  FOR DELETE TO authenticated USING (public.is_family_admin(id, auth.uid()));

-- family_members
CREATE POLICY "users can view memberships of their families" ON public.family_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_family_member(family_id, auth.uid()));
CREATE POLICY "users can add themselves as members" ON public.family_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins can add other members" ON public.family_members
  FOR INSERT TO authenticated WITH CHECK (public.is_family_admin(family_id, auth.uid()));
CREATE POLICY "admins can update members" ON public.family_members
  FOR UPDATE TO authenticated USING (public.is_family_admin(family_id, auth.uid()));
CREATE POLICY "admins can remove members" ON public.family_members
  FOR DELETE TO authenticated USING (public.is_family_admin(family_id, auth.uid()));

-- patients
CREATE POLICY "members can view patients" ON public.patients
  FOR SELECT TO authenticated USING (public.is_family_member(family_id, auth.uid()));
CREATE POLICY "admins can create patients" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (public.is_family_admin(family_id, auth.uid()));
CREATE POLICY "admins can update patients" ON public.patients
  FOR UPDATE TO authenticated USING (public.is_family_admin(family_id, auth.uid()));
CREATE POLICY "admins can delete patients" ON public.patients
  FOR DELETE TO authenticated USING (public.is_family_admin(family_id, auth.uid()));

-- helper macro: child tables tied to patient_id
CREATE POLICY "members can view conditions" ON public.patient_conditions
  FOR SELECT TO authenticated
  USING (public.is_family_member(public.patient_family(patient_id), auth.uid()));
CREATE POLICY "admins can manage conditions" ON public.patient_conditions
  FOR ALL TO authenticated
  USING (public.is_family_admin(public.patient_family(patient_id), auth.uid()))
  WITH CHECK (public.is_family_admin(public.patient_family(patient_id), auth.uid()));

CREATE POLICY "members can view allergies" ON public.patient_allergies
  FOR SELECT TO authenticated
  USING (public.is_family_member(public.patient_family(patient_id), auth.uid()));
CREATE POLICY "admins can manage allergies" ON public.patient_allergies
  FOR ALL TO authenticated
  USING (public.is_family_admin(public.patient_family(patient_id), auth.uid()))
  WITH CHECK (public.is_family_admin(public.patient_family(patient_id), auth.uid()));

CREATE POLICY "members can view emergency contacts" ON public.emergency_contacts
  FOR SELECT TO authenticated
  USING (public.is_family_member(public.patient_family(patient_id), auth.uid()));
CREATE POLICY "admins can manage emergency contacts" ON public.emergency_contacts
  FOR ALL TO authenticated
  USING (public.is_family_admin(public.patient_family(patient_id), auth.uid()))
  WITH CHECK (public.is_family_admin(public.patient_family(patient_id), auth.uid()));

CREATE POLICY "members can view medications" ON public.medications
  FOR SELECT TO authenticated
  USING (public.is_family_member(public.patient_family(patient_id), auth.uid()));
CREATE POLICY "admins can manage medications" ON public.medications
  FOR ALL TO authenticated
  USING (public.is_family_admin(public.patient_family(patient_id), auth.uid()))
  WITH CHECK (public.is_family_admin(public.patient_family(patient_id), auth.uid()));

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-photos', 'patient-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Patient photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'patient-photos');

CREATE POLICY "Authenticated users can upload patient photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patient-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own patient photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'patient-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own patient photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'patient-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
