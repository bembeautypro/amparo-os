import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeFamily, setActiveFamily] = useState<Family | null>(null);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);

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

  useEffect(() => {
    if (!activeFamily && familiesQ.data && familiesQ.data.length > 0) {
      setActiveFamily(familiesQ.data[0]);
    }
  }, [familiesQ.data, activeFamily]);

  useEffect(() => {
    if (patientsQ.data && patientsQ.data.length > 0) {
      if (!activePatient || activePatient.family_id !== activeFamily?.id) {
        setActivePatient(patientsQ.data[0]);
      }
    } else if (patientsQ.data && patientsQ.data.length === 0) {
      setActivePatient(null);
    }
  }, [patientsQ.data, activeFamily?.id, activePatient]);

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
