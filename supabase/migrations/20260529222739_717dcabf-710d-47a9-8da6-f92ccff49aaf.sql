CREATE OR REPLACE FUNCTION public.is_family_member(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(_user_id = auth.uid(), false)
    AND EXISTS (
      SELECT 1
      FROM public.family_members
      WHERE family_id = _family_id
        AND user_id = _user_id
        AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_family_admin(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(_user_id = auth.uid(), false)
    AND EXISTS (
      SELECT 1
      FROM public.family_members
      WHERE family_id = _family_id
        AND user_id = _user_id
        AND status = 'active'
        AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_family_creator(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(_user_id = auth.uid(), false)
    AND EXISTS (
      SELECT 1
      FROM public.families
      WHERE id = _family_id
        AND created_by = _user_id
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_family_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_family_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_family_creator(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_family(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_family_member(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_family_admin(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_family_creator(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.patient_family(uuid) FROM anon, PUBLIC;