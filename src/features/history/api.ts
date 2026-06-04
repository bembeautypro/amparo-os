import { supabase } from "@/integrations/supabase/client";
import type { ClinicalEvent, ClinicalEventType, Severity } from "./types";

export type HistoryFilters = {
  search?: string;
  types?: ClinicalEventType[];
  severities?: Severity[];
  from?: string; // ISO date
  to?: string; // ISO date
};

export async function fetchClinicalEvents(
  patientId: string,
  filters: HistoryFilters,
): Promise<ClinicalEvent[]> {
  let q = supabase
    .from("clinical_events")
    .select("*")
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .order("event_date", { ascending: false });

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim().replace(/[%,]/g, " ");
    q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }
  if (filters.types?.length) q = q.in("type", filters.types);
  if (filters.severities?.length) q = q.in("severity", filters.severities);
  if (filters.from) q = q.gte("event_date", filters.from);
  if (filters.to) q = q.lte("event_date", filters.to);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ClinicalEvent[];
}

export async function fetchClinicalEvent(id: string) {
  const { data, error } = await supabase
    .from("clinical_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as ClinicalEvent | null;
}

export async function fetchEventDocuments(eventId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("clinical_event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAppointmentsForPatient(patientId: string) {
  const { data, error } = await supabase
    .from("appointments")
    .select("id, title, scheduled_at")
    .eq("patient_id", patientId)
    .order("scheduled_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getSignedDocUrl(path: string, ttl = 60) {
  const { data, error } = await supabase.storage
    .from("patient-documents")
    .createSignedUrl(path, ttl);
  if (error) throw error;
  return data.signedUrl;
}
