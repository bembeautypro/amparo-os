import { supabase } from "@/integrations/supabase/client";
import {
  DOCUMENTS_BUCKET,
  type Document,
  type DocumentFilters,
  type DocumentType,
} from "./types";

export async function fetchDocuments(
  patientId: string,
  filters: DocumentFilters = {},
): Promise<Document[]> {
  let q = supabase
    .from("documents")
    .select("*")
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters.search?.trim()) {
    const term = filters.search.trim().replace(/[%,]/g, "");
    // Search across title, doctor_name, institution and tags
    q = q.or(
      `title.ilike.%${term}%,doctor_name.ilike.%${term}%,institution.ilike.%${term}%,tags.cs.{${term}}`,
    );
  }
  if (filters.types?.length) {
    q = q.in("doc_type", filters.types);
  }
  if (filters.from) {
    q = q.gte("document_date", filters.from);
  }
  if (filters.to) {
    q = q.lte("document_date", filters.to);
  }
  if (filters.doctorOrInstitution?.trim()) {
    const t = filters.doctorOrInstitution.trim().replace(/[%,]/g, "");
    q = q.or(`doctor_name.ilike.%${t}%,institution.ilike.%${t}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Document[];
}

export async function fetchDocument(id: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data as Document | null;
}

export async function getSignedDocUrl(path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error || !data) throw error ?? new Error("signed url failed");
  return data.signedUrl;
}

export async function uploadDocumentFile(args: {
  familyId: string;
  patientId: string;
  file: File;
  onProgress?: (pct: number) => void;
}) {
  const { familyId, patientId, file } = args;
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const uuid = crypto.randomUUID();
  const path = `${familyId}/${patientId}/${uuid}.${ext}`;
  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return { path, mime_type: file.type, file_size: file.size };
}

export async function createDocument(payload: {
  patient_id: string;
  title: string;
  doc_type: DocumentType;
  file_path: string;
  mime_type?: string | null;
  file_size?: number | null;
  document_date?: string | null;
  doctor_name?: string | null;
  institution?: string | null;
  tags?: string[];
  expiry_date?: string | null;
  appointment_id?: string | null;
  clinical_event_id?: string | null;
  notes?: string | null;
}) {
  const { data, error } = await supabase
    .from("documents")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Document;
}

export async function updateDocument(
  id: string,
  patch: Partial<Omit<Document, "id" | "patient_id" | "created_at" | "updated_at">>,
) {
  const { data, error } = await supabase
    .from("documents")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Document;
}

export async function softDeleteDocument(id: string) {
  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchAppointmentsForPatient(patientId: string) {
  const { data, error } = await supabase
    .from("appointments")
    .select("id,title,scheduled_at")
    .eq("patient_id", patientId)
    .order("scheduled_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function fetchClinicalEventsForPatient(patientId: string) {
  const { data, error } = await supabase
    .from("clinical_events")
    .select("id,title,event_date")
    .eq("patient_id", patientId)
    .order("event_date", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}
