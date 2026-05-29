import type { Database } from "@/integrations/supabase/types";

export type Medication = Database["public"]["Tables"]["medications"]["Row"];
export type MedicationLog = Database["public"]["Tables"]["medication_logs"]["Row"];
export type ChangeHistory =
  Database["public"]["Tables"]["medication_change_history"]["Row"];
export type MedicationStatus = Database["public"]["Enums"]["medication_status"];

export type ScheduleEntry = { time: string };

export const FORM_OPTIONS = [
  { value: "comprimido", label: "Comprimido" },
  { value: "capsula", label: "Cápsula" },
  { value: "gotas", label: "Gotas" },
  { value: "xarope", label: "Xarope" },
  { value: "injecao", label: "Injeção" },
  { value: "adesivo", label: "Adesivo" },
  { value: "outro", label: "Outro" },
] as const;

export const FREQ_OPTIONS = [
  { value: "1x", label: "1x ao dia", slots: 1 },
  { value: "2x", label: "2x ao dia", slots: 2 },
  { value: "3x", label: "3x ao dia", slots: 3 },
  { value: "4x", label: "4x ao dia", slots: 4 },
  { value: "prn", label: "Conforme necessário", slots: 0 },
  { value: "outro", label: "Outro (descrever)", slots: -1 },
] as const;

export type FreqValue = (typeof FREQ_OPTIONS)[number]["value"];

export const STATUS_LABEL: Record<MedicationStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  ended: "Encerrado",
  archived: "Arquivado",
};
