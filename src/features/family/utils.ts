import type { FamilyRole } from "./types";

export const ROLE_OPTIONS: { value: FamilyRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Gerencia tudo" },
  { value: "editor", label: "Editor", description: "Adiciona e edita dados" },
  { value: "viewer", label: "Visualizador", description: "Apenas consulta" },
  { value: "caregiver", label: "Cuidador", description: "Rotina, medicamentos e agenda" },
  { value: "doctor", label: "Médico", description: "Acesso temporário a resumo e documentos" },
];

export const ROLE_LABEL: Record<FamilyRole, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Visualizador",
  caregiver: "Cuidador",
  doctor: "Médico",
  member: "Membro",
};

// Color classes per spec: roxo, azul, cinza, verde, teal
export const ROLE_BADGE_CLASS: Record<FamilyRole, string> = {
  admin: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-200",
  editor: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200",
  viewer: "bg-muted text-muted-foreground border-border",
  caregiver: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-200",
  doctor: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-200",
  member: "bg-muted text-muted-foreground border-border",
};

export const ACTION_LABEL: Record<string, string> = {
  member_added: "adicionou um membro",
  member_removed: "removeu um membro",
  member_role_changed: "alterou o papel de um membro",
  invitation_created: "enviou um convite",
  invitation_resent: "reenviou um convite",
  invitation_cancelled: "cancelou um convite",
  invitation_accepted: "aceitou o convite",
};

export function describeAction(action: string, details?: Record<string, unknown> | null): string {
  const base = ACTION_LABEL[action] ?? action;
  if (!details) return base;
  if (details.email) return `${base} (${String(details.email)})`;
  if (details.target_name) return `${base} — ${String(details.target_name)}`;
  return base;
}

export function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "agora há pouco";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return `ontem às ${d.getHours().toString().padStart(2, "0")}h${d.getMinutes().toString().padStart(2, "0")}`;
  const days = Math.floor(diff / 86400);
  if (days < 30) return `há ${days} dias`;
  return d.toLocaleDateString("pt-BR");
}
