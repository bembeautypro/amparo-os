-- =====================================================
-- emergency_links
-- =====================================================
CREATE TABLE IF NOT EXISTS public.emergency_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'base64'),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  access_count integer NOT NULL DEFAULT 0,
  last_accessed_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emergency_links_patient ON public.emergency_links(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_links_token ON public.emergency_links(token);

GRANT SELECT ON public.emergency_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_links TO authenticated;
GRANT ALL ON public.emergency_links TO service_role;

ALTER TABLE public.emergency_links ENABLE ROW LEVEL SECURITY;

-- Public can read ONLY active, non-expired tokens (needed for /emergencia/:token page)
CREATE POLICY "public can read active tokens"
ON public.emergency_links
FOR SELECT
TO anon, authenticated
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "members can view family emergency links"
ON public.emergency_links
FOR SELECT
TO authenticated
USING (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()));

CREATE POLICY "admins can create emergency links"
ON public.emergency_links
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND app_private.is_family_admin(app_private.patient_family(patient_id), auth.uid())
);

CREATE POLICY "admins can update emergency links"
ON public.emergency_links
FOR UPDATE
TO authenticated
USING (app_private.is_family_admin(app_private.patient_family(patient_id), auth.uid()));

CREATE POLICY "admins can delete emergency links"
ON public.emergency_links
FOR DELETE
TO authenticated
USING (app_private.is_family_admin(app_private.patient_family(patient_id), auth.uid()));

CREATE TRIGGER update_emergency_links_updated_at
BEFORE UPDATE ON public.emergency_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- access_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS public.access_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emergency_link_id uuid,
  patient_id uuid,
  action text NOT NULL,
  ip text,
  user_agent text,
  accessed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_logs_link ON public.access_logs(emergency_link_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_patient ON public.access_logs(patient_id);

GRANT SELECT ON public.access_logs TO authenticated;
GRANT ALL ON public.access_logs TO service_role;

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view access logs"
ON public.access_logs
FOR SELECT
TO authenticated
USING (
  patient_id IS NOT NULL
  AND app_private.is_family_member(app_private.patient_family(patient_id), auth.uid())
);
-- INSERT is service_role only (no policy needed; bypasses RLS).