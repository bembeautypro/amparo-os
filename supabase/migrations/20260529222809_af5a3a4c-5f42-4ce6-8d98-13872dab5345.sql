CREATE SCHEMA IF NOT EXISTS app_private;

GRANT USAGE ON SCHEMA app_private TO authenticated;

ALTER FUNCTION public.is_family_member(uuid, uuid) SET SCHEMA app_private;
ALTER FUNCTION public.is_family_admin(uuid, uuid) SET SCHEMA app_private;
ALTER FUNCTION public.is_family_creator(uuid, uuid) SET SCHEMA app_private;
ALTER FUNCTION public.patient_family(uuid) SET SCHEMA app_private;

REVOKE ALL ON SCHEMA app_private FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION app_private.is_family_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_family_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_family_creator(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.patient_family(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION app_private.is_family_member(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION app_private.is_family_admin(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION app_private.is_family_creator(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION app_private.patient_family(uuid) FROM anon, PUBLIC;