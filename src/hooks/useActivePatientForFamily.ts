import { useEffect } from "react";
import { useFamilyContext, type Patient } from "@/contexts/FamilyContext";

/**
 * Resolves the active patient for a given familyId.
 * - If the FamilyContext is still loading, returns loading=true.
 * - If the current activePatient doesn't belong to this family, auto-selects
 *   the first patient of this family.
 * - If the family has no patients, returns patient=null and empty=true.
 */
export function useActivePatientForFamily(familyId: string): {
  patient: Patient | null;
  loading: boolean;
  empty: boolean;
} {
  const { activePatient, patients, setActivePatient, loading, activeFamily } =
    useFamilyContext();

  const familyPatients = patients.filter((p) => p.family_id === familyId);
  const matches =
    activePatient && activePatient.family_id === familyId
      ? activePatient
      : null;

  useEffect(() => {
    if (loading) return;
    if (matches) return;
    if (familyPatients.length > 0) {
      setActivePatient(familyPatients[0]);
    }
  }, [loading, matches, familyPatients, setActivePatient]);

  // While the family list is loaded but matches activeFamily not yet
  // pointing to this family's patients, treat as loading to avoid flicker.
  const stillResolving =
    loading ||
    (activeFamily?.id !== familyId && patients.length === 0);

  return {
    patient: matches ?? familyPatients[0] ?? null,
    loading: stillResolving,
    empty: !loading && familyPatients.length === 0,
  };
}
