import { supabase } from "@/integrations/supabase/client";
import type { Appointment, ClinicalEvent } from "./types";

export async function fetchAppointments(patientId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Appointment[];
}

export async function fetchAppointment(id: string): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Appointment | null;
}

export async function fetchAppointmentDocuments(appointmentId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchDoneAppointments(
  patientId: string,
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .eq("status", "done")
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Appointment[];
}

export async function markAppointmentDone(appt: Appointment): Promise<ClinicalEvent> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  const { error: updErr } = await supabase
    .from("appointments")
    .update({ status: "done" })
    .eq("id", appt.id);
  if (updErr) throw updErr;

  const { data, error } = await supabase
    .from("clinical_events")
    .insert({
      patient_id: appt.patient_id,
      appointment_id: appt.id,
      type: "consultation",
      title: appt.title,
      event_date: appt.scheduled_at,
      created_by: userId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ClinicalEvent;
}
