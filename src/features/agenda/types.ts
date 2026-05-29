import type { Database } from "@/integrations/supabase/types";

export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type AppointmentInsert =
  Database["public"]["Tables"]["appointments"]["Insert"];
export type AppointmentStatus =
  Database["public"]["Enums"]["appointment_status"];
export type AppointmentType = Database["public"]["Enums"]["appointment_type"];
export type ClinicalEvent =
  Database["public"]["Tables"]["clinical_events"]["Row"];

export const TYPE_OPTIONS: Array<{
  value: AppointmentType;
  label: string;
  icon: string;
}> = [
  { value: "consulta", label: "Consulta", icon: "🩺" },
  { value: "exame", label: "Exame", icon: "🧪" },
  { value: "retorno", label: "Retorno", icon: "🔁" },
  { value: "procedimento", label: "Procedimento", icon: "🏥" },
  { value: "fisioterapia", label: "Fisioterapia", icon: "💪" },
  { value: "vacina", label: "Vacina", icon: "💉" },
  { value: "outro", label: "Outro", icon: "📌" },
];

export function typeMeta(t: AppointmentType | null | undefined) {
  return (
    TYPE_OPTIONS.find((o) => o.value === t) ??
    TYPE_OPTIONS[TYPE_OPTIONS.length - 1]
  );
}

export function statusLabel(s: AppointmentStatus): string {
  if (s === "scheduled") return "Agendado";
  if (s === "done") return "Realizado";
  if (s === "cancelled") return "Cancelado";
  return s;
}

export function statusBadgeClass(s: AppointmentStatus): string {
  if (s === "done") return "bg-success/15 text-success border-success/30";
  if (s === "cancelled") return "bg-muted text-muted-foreground";
  return "bg-primary-soft text-primary border-primary/20";
}
