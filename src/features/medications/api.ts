import { supabase } from "@/integrations/supabase/client";
import type { Medication, MedicationStatus } from "./types";

export async function fetchMedications(
  patientId: string,
  status: MedicationStatus,
) {
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .eq("patient_id", patientId)
    .eq("status", status)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Medication[];
}

export async function fetchMedicationById(id: string) {
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Medication | null;
}

export async function fetchTodayLogsForMedication(
  medicationId: string,
  dayStart: Date,
  dayEnd: Date,
) {
  const { data, error } = await supabase
    .from("medication_logs")
    .select("*")
    .eq("medication_id", medicationId)
    .gte("scheduled_for", dayStart.toISOString())
    .lte("scheduled_for", dayEnd.toISOString());
  if (error) throw error;
  return data ?? [];
}

export async function markDoseTaken(args: {
  medicationId: string;
  patientId: string;
  scheduledFor: Date;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  const { error } = await supabase.from("medication_logs").upsert(
    {
      medication_id: args.medicationId,
      patient_id: args.patientId,
      scheduled_for: args.scheduledFor.toISOString(),
      taken_at: new Date().toISOString(),
      taken_by: uid,
      logged_by: uid,
      status: "taken",
    },
    { onConflict: "medication_id,scheduled_for" },
  );
  if (error) throw error;
}

export async function updateMedicationStatus(
  id: string,
  status: MedicationStatus,
) {
  const { error } = await supabase
    .from("medications")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}
