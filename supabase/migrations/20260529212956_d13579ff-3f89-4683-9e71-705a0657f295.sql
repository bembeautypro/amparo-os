-- 1) Fix privilege escalation on family_members
-- Drop the broad self-insert policy and replace with a narrow bootstrap policy:
-- only the family CREATOR may insert themselves as an admin (one-time bootstrap).
DROP POLICY IF EXISTS "users can add themselves as members" ON public.family_members;

CREATE POLICY "creator bootstraps admin membership"
ON public.family_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'admin'
  AND status = 'active'
  AND EXISTS (
    SELECT 1 FROM public.families
    WHERE id = family_id AND created_by = auth.uid()
  )
);

-- 2) Revoke direct EXECUTE on SECURITY DEFINER helpers.
-- These remain callable from RLS policies (server-side), but clients cannot
-- invoke them through PostgREST.
REVOKE EXECUTE ON FUNCTION public.is_family_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_family_admin(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.patient_family(uuid) FROM PUBLIC, anon, authenticated;

-- 3) Make patient-photos bucket private (was public + listable)
UPDATE storage.buckets SET public = false WHERE id = 'patient-photos';

-- 4) Replace any existing patient-photos policies with family-scoped ones.
-- New convention: object path is "{family_id}/{filename}". First folder = family_id.
DROP POLICY IF EXISTS "Patient photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view patient photos" ON storage.objects;
DROP POLICY IF EXISTS "patient-photos public read" ON storage.objects;
DROP POLICY IF EXISTS "patient-photos family read" ON storage.objects;
DROP POLICY IF EXISTS "patient-photos family insert" ON storage.objects;
DROP POLICY IF EXISTS "patient-photos family update" ON storage.objects;
DROP POLICY IF EXISTS "patient-photos family delete" ON storage.objects;

CREATE POLICY "patient-photos family read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'patient-photos'
  AND public.is_family_member(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "patient-photos family insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'patient-photos'
  AND public.is_family_admin(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "patient-photos family update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'patient-photos'
  AND public.is_family_admin(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "patient-photos family delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'patient-photos'
  AND public.is_family_admin(((storage.foldername(name))[1])::uuid, auth.uid())
);