DROP POLICY IF EXISTS "members can view their families" ON public.families;

CREATE POLICY "members and creators can view their families"
ON public.families
FOR SELECT
TO authenticated
USING (
  public.is_family_member(id, auth.uid())
  OR created_by = auth.uid()
);

DROP POLICY IF EXISTS "Patient photos are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload patient photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own patient photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own patient photos" ON storage.objects;