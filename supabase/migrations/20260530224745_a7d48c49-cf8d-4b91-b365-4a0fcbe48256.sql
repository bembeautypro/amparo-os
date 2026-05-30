-- =========================================================
-- 1) helpers
-- =========================================================
CREATE OR REPLACE FUNCTION app_private.invitee_can_join(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.invitations i
    JOIN auth.users u ON u.id = _user_id
    WHERE i.family_id = _family_id
      AND i.status = 'pending'
      AND i.expires_at > now()
      AND lower(i.email) = lower(COALESCE(u.email, ''))
  );
$$;
GRANT EXECUTE ON FUNCTION app_private.invitee_can_join(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION app_private.invitee_can_join(uuid, uuid) FROM anon, PUBLIC;

-- =========================================================
-- 2) Tabelas: trocar admin → member ativo
-- =========================================================

-- patients
DROP POLICY IF EXISTS "admins can create patients" ON public.patients;
DROP POLICY IF EXISTS "admins can update patients" ON public.patients;
DROP POLICY IF EXISTS "admins can delete patients" ON public.patients;
DROP POLICY IF EXISTS "members can create patients" ON public.patients;
DROP POLICY IF EXISTS "members can update patients" ON public.patients;
DROP POLICY IF EXISTS "members can delete patients" ON public.patients;
CREATE POLICY "members can create patients" ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (app_private.is_family_member(family_id, auth.uid()));
CREATE POLICY "members can update patients" ON public.patients
  FOR UPDATE TO authenticated
  USING (app_private.is_family_member(family_id, auth.uid()))
  WITH CHECK (app_private.is_family_member(family_id, auth.uid()));
CREATE POLICY "members can delete patients" ON public.patients
  FOR DELETE TO authenticated
  USING (app_private.is_family_member(family_id, auth.uid()));

-- Generic helper macro via DO block for patient-scoped tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'patient_allergies','patient_conditions','emergency_contacts',
    'appointments','clinical_events','documents','medications','medication_logs'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "admins can manage %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "admins can manage allergies" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "admins can manage conditions" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "admins can manage emergency contacts" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "admins can manage appointments" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "admins can manage clinical events" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "admins can manage documents" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "admins can manage medications" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "admins can manage medication logs" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "members can manage %1$s" ON public.%1$s', t);
    EXECUTE format($f$
      CREATE POLICY "members can manage %1$s" ON public.%1$s
        FOR ALL TO authenticated
        USING (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()))
        WITH CHECK (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()))
    $f$, t);
  END LOOP;
END $$;

-- medication_change_history (insert + select for members; no update/delete)
DROP POLICY IF EXISTS "admins can insert change history" ON public.medication_change_history;
DROP POLICY IF EXISTS "members can insert change history" ON public.medication_change_history;
CREATE POLICY "members can insert change history" ON public.medication_change_history
  FOR INSERT TO authenticated
  WITH CHECK (
    changed_by = auth.uid()
    AND app_private.is_family_member(
      app_private.patient_family(
        (SELECT m.patient_id FROM public.medications m WHERE m.id = medication_change_history.medication_id)
      ),
      auth.uid()
    )
  );

-- emergency_links → members podem gerenciar
DROP POLICY IF EXISTS "admins can create emergency links" ON public.emergency_links;
DROP POLICY IF EXISTS "admins can update emergency links" ON public.emergency_links;
DROP POLICY IF EXISTS "admins can delete emergency links" ON public.emergency_links;
DROP POLICY IF EXISTS "members can create emergency links" ON public.emergency_links;
DROP POLICY IF EXISTS "members can update emergency links" ON public.emergency_links;
DROP POLICY IF EXISTS "members can delete emergency links" ON public.emergency_links;
CREATE POLICY "members can create emergency links" ON public.emergency_links
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND app_private.is_family_member(app_private.patient_family(patient_id), auth.uid())
  );
CREATE POLICY "members can update emergency links" ON public.emergency_links
  FOR UPDATE TO authenticated
  USING (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()))
  WITH CHECK (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()));
CREATE POLICY "members can delete emergency links" ON public.emergency_links
  FOR DELETE TO authenticated
  USING (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()));

-- families: membros podem ver e atualizar
DROP POLICY IF EXISTS "admins can update their families" ON public.families;
DROP POLICY IF EXISTS "admins can delete their families" ON public.families;
DROP POLICY IF EXISTS "members can update their families" ON public.families;
DROP POLICY IF EXISTS "members can delete their families" ON public.families;
CREATE POLICY "members can update their families" ON public.families
  FOR UPDATE TO authenticated
  USING (app_private.is_family_member(id, auth.uid()))
  WITH CHECK (app_private.is_family_member(id, auth.uid()));
-- exclusão segue restrita ao criador (evita perda acidental por terceiros)
CREATE POLICY "creators can delete their families" ON public.families
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- family_members: permitir convidado entrar; membros podem atualizar/remover
DROP POLICY IF EXISTS "admins can add other members" ON public.family_members;
DROP POLICY IF EXISTS "admins can update members" ON public.family_members;
DROP POLICY IF EXISTS "admins can remove members" ON public.family_members;
DROP POLICY IF EXISTS "members can add other members" ON public.family_members;
DROP POLICY IF EXISTS "members can update members" ON public.family_members;
DROP POLICY IF EXISTS "members can remove members" ON public.family_members;
DROP POLICY IF EXISTS "invitees can join family" ON public.family_members;

CREATE POLICY "members can add other members" ON public.family_members
  FOR INSERT TO authenticated
  WITH CHECK (app_private.is_family_member(family_id, auth.uid()));

CREATE POLICY "invitees can join family" ON public.family_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'active'
    AND app_private.invitee_can_join(family_id, auth.uid())
  );

CREATE POLICY "members can update members" ON public.family_members
  FOR UPDATE TO authenticated
  USING (app_private.is_family_member(family_id, auth.uid()))
  WITH CHECK (app_private.is_family_member(family_id, auth.uid()));

CREATE POLICY "members can remove members" ON public.family_members
  FOR DELETE TO authenticated
  USING (app_private.is_family_member(family_id, auth.uid()) OR user_id = auth.uid());

-- invitations: qualquer membro pode gerenciar
DROP POLICY IF EXISTS "admins manage invitations" ON public.invitations;
DROP POLICY IF EXISTS "members manage invitations" ON public.invitations;
CREATE POLICY "members manage invitations" ON public.invitations
  FOR ALL TO authenticated
  USING (app_private.is_family_member(family_id, auth.uid()))
  WITH CHECK (
    app_private.is_family_member(family_id, auth.uid())
    AND invited_by = auth.uid()
  );

-- access_logs: já permite member insert; broaden select para todos os membros (não só admin)
DROP POLICY IF EXISTS "members view patient or family logs" ON public.access_logs;
CREATE POLICY "members view patient or family logs" ON public.access_logs
  FOR SELECT TO authenticated
  USING (
    (family_id IS NOT NULL AND app_private.is_family_member(family_id, auth.uid()))
    OR (patient_id IS NOT NULL AND app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()))
  );

-- =========================================================
-- 3) Storage buckets
-- =========================================================

-- patient-documents (caminho: {familyId}/{patientId}/arquivo)
DROP POLICY IF EXISTS "members can read patient documents" ON storage.objects;
DROP POLICY IF EXISTS "admins can upload patient documents" ON storage.objects;
DROP POLICY IF EXISTS "admins can update patient documents" ON storage.objects;
DROP POLICY IF EXISTS "admins can delete patient documents" ON storage.objects;
DROP POLICY IF EXISTS "members can upload patient documents" ON storage.objects;
DROP POLICY IF EXISTS "members can update patient documents" ON storage.objects;
DROP POLICY IF EXISTS "members can delete patient documents" ON storage.objects;

CREATE POLICY "members can read patient documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND app_private.is_family_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );
CREATE POLICY "members can upload patient documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'patient-documents'
    AND app_private.is_family_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );
CREATE POLICY "members can update patient documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND app_private.is_family_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );
CREATE POLICY "members can delete patient documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND app_private.is_family_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );

-- medication-photos (caminho: {patientId}/arquivo)
DROP POLICY IF EXISTS "medication photos: family members read" ON storage.objects;
DROP POLICY IF EXISTS "medication photos: admins write" ON storage.objects;
DROP POLICY IF EXISTS "medication photos: admins update" ON storage.objects;
DROP POLICY IF EXISTS "medication photos: admins delete" ON storage.objects;
DROP POLICY IF EXISTS "medication photos: members write" ON storage.objects;
DROP POLICY IF EXISTS "medication photos: members update" ON storage.objects;
DROP POLICY IF EXISTS "medication photos: members delete" ON storage.objects;

CREATE POLICY "medication photos: family members read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'medication-photos'
    AND app_private.is_family_member(app_private.patient_family(((storage.foldername(name))[1])::uuid), auth.uid())
  );
CREATE POLICY "medication photos: members write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'medication-photos'
    AND app_private.is_family_member(app_private.patient_family(((storage.foldername(name))[1])::uuid), auth.uid())
  );
CREATE POLICY "medication photos: members update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'medication-photos'
    AND app_private.is_family_member(app_private.patient_family(((storage.foldername(name))[1])::uuid), auth.uid())
  );
CREATE POLICY "medication photos: members delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'medication-photos'
    AND app_private.is_family_member(app_private.patient_family(((storage.foldername(name))[1])::uuid), auth.uid())
  );

-- patient-photos (caminho: {familyId}/arquivo)
DROP POLICY IF EXISTS "patient-photos family read" ON storage.objects;
DROP POLICY IF EXISTS "patient-photos family insert" ON storage.objects;
DROP POLICY IF EXISTS "patient-photos family update" ON storage.objects;
DROP POLICY IF EXISTS "patient-photos family delete" ON storage.objects;

CREATE POLICY "patient-photos family read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'patient-photos'
    AND app_private.is_family_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );
CREATE POLICY "patient-photos family insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'patient-photos'
    AND app_private.is_family_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );
CREATE POLICY "patient-photos family update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'patient-photos'
    AND app_private.is_family_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );
CREATE POLICY "patient-photos family delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'patient-photos'
    AND app_private.is_family_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );

-- =========================================================
-- 4) Endurecer grants públicos (anon) em tabelas privadas
--    Mantém invitations (token público) e emergency_links (token público).
-- =========================================================
REVOKE ALL ON public.access_logs FROM anon;
REVOKE ALL ON public.appointments FROM anon;
REVOKE ALL ON public.clinical_events FROM anon;
REVOKE ALL ON public.documents FROM anon;
REVOKE ALL ON public.emergency_contacts FROM anon;
REVOKE ALL ON public.families FROM anon;
REVOKE ALL ON public.family_members FROM anon;
REVOKE ALL ON public.medication_change_history FROM anon;
REVOKE ALL ON public.medication_logs FROM anon;
REVOKE ALL ON public.medications FROM anon;
REVOKE ALL ON public.patient_allergies FROM anon;
REVOKE ALL ON public.patient_conditions FROM anon;
REVOKE ALL ON public.patients FROM anon;
REVOKE ALL ON public.profiles FROM anon;
-- mantém SELECT anônimo apenas onde existe policy pública por token
GRANT SELECT ON public.invitations TO anon;
GRANT SELECT ON public.emergency_links TO anon;