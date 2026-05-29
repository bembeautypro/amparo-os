
CREATE OR REPLACE FUNCTION public.is_family_creator(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.families
    WHERE id = _family_id AND created_by = _user_id
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_family_creator(uuid, uuid) FROM anon, authenticated;

DROP POLICY IF EXISTS "creator bootstraps admin membership" ON public.family_members;

CREATE POLICY "creator bootstraps admin membership"
ON public.family_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'admin'::family_role
  AND status = 'active'::member_status
  AND public.is_family_creator(family_id, auth.uid())
);
