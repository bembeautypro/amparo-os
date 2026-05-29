import type { Database } from "@/integrations/supabase/types";

export type ClinicalEvent = Database["public"]["Tables"]["clinical_events"]["Row"];
export type ClinicalEventInsert =
  Database["public"]["Tables"]["clinical_events"]["Insert"];
export type ClinicalEventType = Database["public"]["Enums"]["clinical_event_type"];
export type Severity = Database["public"]["Enums"]["clinical_severity"];

export type TypeMeta = {
  value: ClinicalEventType;
  label: string;
  icon: string;
  /** Tailwind classes for icon bg + fg */
  color: string;
};

export const TYPE_META: TypeMeta[] = [
  { value: "consultation", label: "Consulta", icon: "🩺", color: "bg-primary-soft text-primary" },
  { value: "exam_result", label: "Exame", icon: "🧪", color: "bg-primary-soft text-primary" },
  { value: "hospitalization", label: "Internação", icon: "🏥", color: "bg-[color-mix(in_oklab,var(--primary)_15%,transparent)] text-primary" },
  { value: "surgery", label: "Cirurgia", icon: "🔪", color: "bg-emergency/15 text-emergency" },
  { value: "symptom", label: "Sintoma relevante", icon: "🤒", color: "bg-warn/15 text-warn" },
  { value: "fall", label: "Queda / Acidente", icon: "⚠️", color: "bg-warn/15 text-warn" },
  { value: "medication_change", label: "Alteração de medicamento", icon: "💊", color: "bg-primary-soft text-primary" },
  { value: "diagnosis", label: "Diagnóstico", icon: "📋", color: "bg-primary-soft text-primary" },
  { value: "follow_up", label: "Retorno médico", icon: "🔁", color: "bg-primary-soft text-primary" },
  { value: "crisis", label: "Crise", icon: "🚨", color: "bg-emergency/15 text-emergency" },
  { value: "vaccination", label: "Vacina", icon: "💉", color: "bg-success/15 text-success" },
  { value: "family_observation", label: "Observação familiar", icon: "👀", color: "bg-muted text-muted-foreground" },
  { value: "procedure", label: "Procedimento", icon: "🏥", color: "bg-primary-soft text-primary" },
  { value: "other", label: "Outro", icon: "📌", color: "bg-muted text-muted-foreground" },
];

export function typeMeta(t: ClinicalEventType | null | undefined): TypeMeta {
  return TYPE_META.find((m) => m.value === t) ?? TYPE_META[TYPE_META.length - 1];
}

export const SEVERITY_META: Array<{
  value: Severity;
  label: string;
  emoji: string;
  /** background classes for button */
  btn: string;
  /** badge classes */
  badge: string;
  /** left-border accent (only used for high/critical) */
  accent: string;
}> = [
  {
    value: "low",
    label: "Baixa",
    emoji: "🟢",
    btn: "bg-success/15 text-success border-success/30 hover:bg-success/25",
    badge: "bg-success/15 text-success border-success/30",
    accent: "",
  },
  {
    value: "medium",
    label: "Média",
    emoji: "🟡",
    btn: "bg-warn/10 text-warn border-warn/30 hover:bg-warn/20",
    badge: "bg-warn/15 text-warn border-warn/30",
    accent: "",
  },
  {
    value: "high",
    label: "Alta",
    emoji: "🟠",
    btn: "bg-warn/20 text-warn border-warn/40 hover:bg-warn/30",
    badge: "bg-warn/20 text-warn border-warn/40",
    accent: "border-l-4 border-l-warn",
  },
  {
    value: "critical",
    label: "Crítica",
    emoji: "🔴",
    btn: "bg-emergency/15 text-emergency border-emergency/40 hover:bg-emergency/25",
    badge: "bg-emergency/15 text-emergency border-emergency/40",
    accent: "border-l-4 border-l-emergency",
  },
];

export function severityMeta(s: Severity) {
  return SEVERITY_META.find((m) => m.value === s) ?? SEVERITY_META[0];
}
