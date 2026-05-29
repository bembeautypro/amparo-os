import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X, MinusCircle } from "lucide-react";
import type { MedicationLog } from "./types";

export function LogsList({ logs }: { logs: MedicationLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma tomada registrada ainda.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border/70">
      {logs.slice(0, 10).map((log) => {
        const Icon =
          log.status === "taken" ? Check : log.status === "missed" ? X : MinusCircle;
        const cls =
          log.status === "taken"
            ? "bg-success/15 text-success"
            : log.status === "missed"
              ? "bg-emergency/15 text-emergency"
              : "bg-muted text-muted-foreground";
        return (
          <li key={log.id} className="flex items-center gap-3 py-3">
            <span className={`grid h-8 w-8 place-items-center rounded-full ${cls}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {format(new Date(log.scheduled_for), "EEE, dd 'de' MMM 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
              {log.taken_at && (
                <p className="text-xs text-muted-foreground">
                  Registrado {format(new Date(log.taken_at), "dd/MM HH:mm")}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
