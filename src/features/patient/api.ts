import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Patient = Database["public"]["Tables"]["patients"]["Row"];
export type Allergy = Database["public"]["Tables"]["patient_allergies"]["Row"];
export type Condition = Database["public"]["Tables"]["patient_conditions"]["Row"];
export type EmergencyContact = Database["public"]["Tables"]["emergency_contacts"]["Row"];

export type Severity = Database["public"]["Enums"]["severity_level"];
export type ConditionStatus = Database["public"]["Enums"]["condition_status"];
export type BloodType = Database["public"]["Enums"]["blood_type"];

export async function fetchPatientProfile(patientId: string) {
  const [p, a, c, ec] = await Promise.all([
    supabase.from("patients").select("*").eq("id", patientId).maybeSingle(),
    supabase
      .from("patient_allergies")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("patient_conditions")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("emergency_contacts")
      .select("*")
      .eq("patient_id", patientId)
      .order("priority", { ascending: true }),
  ]);
  if (p.error) throw p.error;
  if (!p.data) throw new Error("Paciente não encontrado");
  return {
    patient: p.data as Patient,
    allergies: (a.data ?? []) as Allergy[],
    conditions: (c.data ?? []) as Condition[],
    contacts: (ec.data ?? []) as EmergencyContact[],
  };
}

export async function logPatientUpdate(
  patientId: string,
  familyId: string,
  details: Record<string, unknown>,
) {
  const { data: u } = await supabase.auth.getUser();
  await supabase.from("access_logs").insert({
    patient_id: patientId,
    family_id: familyId,
    actor_user_id: u.user?.id ?? null,
    action: "patient_update",
    details: { resource_type: "patient", resource_id: patientId, ...details },
  });
}
