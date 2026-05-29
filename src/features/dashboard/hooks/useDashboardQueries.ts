import { useQuery } from "@tanstack/react-query";
import { startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

/* ------------------------- Types ------------------------- */

export type PatientHeader = {
  id: string;
  full_name: string;
  birth_date: string | null;
  blood_type: string | null;
  photo_url: string | null;
  relation: string | null;
};

export type Allergy = { id: string; name: string; severity: string };
export type Condition = { id: string; name: string; status: string };
export type Appointment = {
  id: string;
  title: string;
  specialty: string | null;
  location: string | null;
  scheduled_at: string;
  status: string;
  responsible_user_id: string | null;
};
export type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  schedule: string[] | null;
  status: string;
};
export type DocumentRow = {
  id: string;
  title: string;
  doc_type: string;
  created_at: string;
};
export type EmergencyContact = { id: string; name: string; phone: string };
export type MedicationLog = {
  id: string;
  medication_id: string;
  scheduled_for: string;
  taken_at: string | null;
};
export type FamilyMember = {
  id: string;
  user_id: string;
  role: string;
  relation: string;
};

/* --------------------- Query hooks ----------------------- */

export function usePatientHeader(patientId: string | undefined) {
  return useQuery({
    queryKey: ["dash", "patient-header", patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<PatientHeader | null> => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, birth_date, blood_type, photo_url, relation")
        .eq("id", patientId!)
        .maybeSingle();
      if (error) throw error;
      return data as PatientHeader | null;
    },
  });
}

export function usePatientAllergies(patientId: string | undefined) {
  return useQuery({
    queryKey: ["dash", "allergies", patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<Allergy[]> => {
      const { data, error } = await supabase
        .from("patient_allergies")
        .select("id, name, severity")
        .eq("patient_id", patientId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePatientConditions(patientId: string | undefined) {
  return useQuery({
    queryKey: ["dash", "conditions", patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<Condition[]> => {
      const { data, error } = await supabase
        .from("patient_conditions")
        .select("id, name, status")
        .eq("patient_id", patientId!)
        .eq("status", "active");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEmergencyContacts(patientId: string | undefined) {
  return useQuery({
    queryKey: ["dash", "emergency-contacts", patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<EmergencyContact[]> => {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("id, name, phone")
        .eq("patient_id", patientId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpcomingAppointments(
  patientId: string | undefined,
  limit = 3,
) {
  return useQuery({
    queryKey: ["dash", "appointments-upcoming", patientId, limit],
    enabled: !!patientId,
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          "id, title, specialty, location, scheduled_at, status, responsible_user_id",
        )
        .eq("patient_id", patientId!)
        .gt("scheduled_at", new Date().toISOString())
        .not("status", "in", "(cancelled,done)")
        .order("scheduled_at", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Appointment[];
    },
  });
}

export function useActiveMedications(patientId: string | undefined) {
  return useQuery({
    queryKey: ["dash", "medications-active", patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<Medication[]> => {
      const { data, error } = await supabase
        .from("medications")
        .select("id, name, dosage, frequency, schedule, status")
        .eq("patient_id", patientId!)
        .eq("status", "active");
      if (error) throw error;
      return (data ?? []).map((m) => ({
        ...m,
        schedule: Array.isArray(m.schedule) ? (m.schedule as string[]) : null,
      })) as Medication[];
    },
  });
}

export function useTodayMedicationLogs(patientId: string | undefined) {
  return useQuery({
    queryKey: ["dash", "medication-logs-today", patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<MedicationLog[]> => {
      const now = new Date();
      const { data, error } = await supabase
        .from("medication_logs")
        .select("id, medication_id, scheduled_for, taken_at")
        .eq("patient_id", patientId!)
        .gte("scheduled_for", startOfDay(now).toISOString())
        .lte("scheduled_for", endOfDay(now).toISOString());
      if (error) throw error;
      return (data ?? []) as MedicationLog[];
    },
  });
}

export function useRecentDocuments(patientId: string | undefined, limit = 3) {
  return useQuery({
    queryKey: ["dash", "documents-recent", patientId, limit],
    enabled: !!patientId,
    queryFn: async (): Promise<DocumentRow[]> => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, doc_type, created_at")
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as DocumentRow[];
    },
  });
}

export function useFamilyMembers(familyId: string | undefined) {
  return useQuery({
    queryKey: ["dash", "family-members", familyId],
    enabled: !!familyId,
    queryFn: async (): Promise<FamilyMember[]> => {
      const { data, error } = await supabase
        .from("family_members")
        .select("id, user_id, role, relation")
        .eq("family_id", familyId!)
        .eq("status", "active");
      if (error) throw error;
      return (data ?? []) as FamilyMember[];
    },
  });
}
