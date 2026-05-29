import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History } from "lucide-react";
import type { ChangeHistory } from "./types";

const FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  generic_name: "Nome genérico",
  dosage: "Dosagem",
  form: "Forma",
  frequency: "Frequência",
  schedule: "Horários",
  start_date: "Data de início",
  end_date: "Data de fim",
  prescriber: "Prescritor",
  notes: "Observações",
  photo_path: "Foto",
};

function prettyValue(raw: string | null): string {
  if (raw == null) return "—";
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v))
      return v
        .map((x) => (typeof x === "object" && x && "time" in x ? x.time : String(x)))
        .join(", ");
    if (typeof v === "string") return v;
    return JSON.stringify(v);
  } catch {
    return raw;
  }
}

export function ChangeHistoryTimeline({ items }: { items: ChangeHistory[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma alteração registrada.
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {items.map((it) => (
        <li
          key={it.id}
          className="flex gap-3 rounded-2xl border border-border/70 bg-card p-3"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <History className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {FIELD_LABELS[it.field_changed] ?? it.field_changed}
            </p>
            <p className="mt-0.5 break-words text-xs text-muted-foreground">
              <span className="line-through">{prettyValue(it.old_value)}</span>{" "}
              → <span className="text-foreground">{prettyValue(it.new_value)}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {format(new Date(it.changed_at), "dd 'de' MMM 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
