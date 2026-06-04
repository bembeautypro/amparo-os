import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Family = { id: string; name: string };
export type Patient = {
  id: string;
  name: string;
  relation?: string | null;
  avatarUrl?: string | null;
  family_id: string;
};

type FamilyContextValue = {
  families: Family[];
  patients: Patient[];
  activeFamily: Family | null;
  activePatient: Patient | null;
  setActiveFamily: (f: Family | null) => void;
  setActivePatient: (p: Patient | null) => void;
  loading: boolean;
};

const FamilyContext = createContext<FamilyContextValue | undefined>(undefined);

const FAMILY_KEY = "amparo:active-family-id";
const PATIENT_KEY = "amparo:active-patient-id";

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeFamily, setActiveFamilyState] = useState<Family | null>(null);
  const [activePatient, setActivePatientState] = useState<Patient | null>(null);

  const setActiveFamily = useCallback((f: Family | null) => {
    setActiveFamilyState(f);
    writeStorage(FAMILY_KEY, f?.id ?? null);
  }, []);

  const setActivePatient = useCallback((p: Patient | null) => {
    setActivePatientState(p);
    writeStorage(PATIENT_KEY, p?.id ?? null);
  }, []);

  const familiesQ = useQuery({
    queryKey: ["families", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Family[]> => {
      const { data, error } = await supabase
        .from("families")
        .select("id, name")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const patientsQ = useQuery({
    queryKey: ["patients", activeFamily?.id],
    enabled: !!activeFamily?.id,
    queryFn: async (): Promise<Patient[]> => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, relation, photo_url, family_id")
        .eq("family_id", activeFamily!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((p) => ({
        id: p.id,
        name: p.full_name,
        relation: p.relation,
        avatarUrl: p.photo_url,
        family_id: p.family_id,
      }));
    },
  });

  // Hydrate active family from localStorage when families load
  useEffect(() => {
    if (activeFamily || !familiesQ.data || familiesQ.data.length === 0) return;
    const savedId = readStorage(FAMILY_KEY);
    const saved = savedId ? familiesQ.data.find((f) => f.id === savedId) : null;
    setActiveFamily(saved ?? familiesQ.data[0]);
  }, [familiesQ.data, activeFamily, setActiveFamily]);

  // Hydrate active patient from localStorage when patients load
  useEffect(() => {
    if (!patientsQ.data) return;
    if (patientsQ.data.length === 0) {
      setActivePatient(null);
      return;
    }
    const currentValid =
      activePatient &&
      activePatient.family_id === activeFamily?.id &&
      patientsQ.data.some((p) => p.id === activePatient.id);
    if (currentValid) return;

    const savedId = readStorage(PATIENT_KEY);
    const saved = savedId ? patientsQ.data.find((p) => p.id === savedId) : null;
    setActivePatient(saved ?? patientsQ.data[0]);
  }, [patientsQ.data, activeFamily?.id, activePatient, setActivePatient]);

  return (
    <FamilyContext.Provider
      value={{
        families: familiesQ.data ?? [],
        patients: patientsQ.data ?? [],
        activeFamily,
        activePatient,
        setActiveFamily,
        setActivePatient,
        loading: familiesQ.isLoading || patientsQ.isLoading,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamilyContext() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("useFamilyContext deve ser usado dentro de <FamilyProvider>");
  return ctx;
}
