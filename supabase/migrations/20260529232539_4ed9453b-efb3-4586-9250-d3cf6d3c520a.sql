
DO $$ BEGIN
  CREATE TYPE public.invitation_status AS ENUM ('pending','accepted','expired','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.family_role NOT NULL DEFAULT 'viewer',
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(18), 'base64'),
  status public.invitation_status NOT NULL DEFAULT 'pending',
  invited_by uuid NOT NULL,
  accepted_by uuid,
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_family ON public.invitations(family_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(lower(email));
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);

GRANT SELECT ON public.invitations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage invitations"
  ON public.invitations
  FOR ALL
  TO authenticated
  USING (app_private.is_family_admin(family_id, auth.uid()))
  WITH CHECK (app_private.is_family_admin(family_id, auth.uid()) AND invited_by = auth.uid());

CREATE POLICY "members can view invitations of their families"
  ON public.invitations
  FOR SELECT
  TO authenticated
  USING (app_private.is_family_member(family_id, auth.uid()));

CREATE POLICY "anyone can read pending invitation by token"
  ON public.invitations
  FOR SELECT
  TO anon, authenticated
  USING (status = 'pending' AND expires_at > now());

CREATE POLICY "authed users can accept their invitations"
  ON public.invitations
  FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND expires_at > now()
    AND lower(email) = lower(coalesce((auth.jwt() ->> 'email'),''))
  )
  WITH CHECK (
    lower(email) = lower(coalesce((auth.jwt() ->> 'email'),''))
  );

CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Extend access_logs for family activity
ALTER TABLE public.access_logs
  ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES public.families(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS actor_user_id uuid,
  ADD COLUMN IF NOT EXISTS details jsonb;

CREATE INDEX IF NOT EXISTS idx_access_logs_family ON public.access_logs(family_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_actor ON public.access_logs(actor_user_id);

DROP POLICY IF EXISTS "members can view access logs" ON public.access_logs;

CREATE POLICY "members view patient or family logs"
  ON public.access_logs
  FOR SELECT
  TO authenticated
  USING (
    (family_id IS NOT NULL AND app_private.is_family_admin(family_id, auth.uid()))
    OR (patient_id IS NOT NULL AND app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()))
  );

CREATE POLICY "members can insert family activity logs"
  ON public.access_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IS NOT NULL
    AND actor_user_id = auth.uid()
    AND app_private.is_family_member(family_id, auth.uid())
  );

GRANT INSERT ON public.access_logs TO authenticated;
