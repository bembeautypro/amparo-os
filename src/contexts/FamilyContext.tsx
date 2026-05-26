import { createContext, useContext, useState, type ReactNode } from "react";

export type Family = { id: string; name: string };
export type Patient = { id: string; name: string; relation?: string; avatarUrl?: string };

type FamilyContextValue = {
  activeFamily: Family | null;
  activePatient: Patient | null;
  setActiveFamily: (f: Family | null) => void;
  setActivePatient: (p: Patient | null) => void;
};

const FamilyContext = createContext<FamilyContextValue | undefined>(undefined);

// Mock inicial — substituir por dados reais quando módulos forem implementados.
const DEFAULT_FAMILY: Family = { id: "demo", name: "Família Silva" };
const DEFAULT_PATIENT: Patient = {
  id: "p1",
  name: "Dona Maria",
  relation: "Mãe",
};

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [activeFamily, setActiveFamily] = useState<Family | null>(DEFAULT_FAMILY);
  const [activePatient, setActivePatient] = useState<Patient | null>(DEFAULT_PATIENT);

  return (
    <FamilyContext.Provider
      value={{ activeFamily, activePatient, setActiveFamily, setActivePatient }}
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
