
-- 1. Remove anon enumeration of emergency link tokens
DROP POLICY IF EXISTS "public can read active tokens" ON public.emergency_links;

-- 2. Remove anon enumeration of pending invitations
DROP POLICY IF EXISTS "anyone can read pending invitation by token" ON public.invitations;

-- 3. Restrict profiles SELECT to self + users who share a family
DROP POLICY IF EXISTS "anyone authenticated can read profiles" ON public.profiles;

CREATE POLICY "users read own or family-shared profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.family_members fm_self
    JOIN public.family_members fm_other
      ON fm_other.family_id = fm_self.family_id
    WHERE fm_self.user_id = auth.uid()
      AND fm_self.status = 'active'
      AND fm_other.user_id = public.profiles.id
      AND fm_other.status = 'active'
  )
);
