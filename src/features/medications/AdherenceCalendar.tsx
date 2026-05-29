import { format, eachDayOfInterval, subDays, startOfDay, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { MedicationLog } from "./types";

type Props = {
  startDate: string | null; // ISO yyyy-MM-dd
  logs: MedicationLog[];
};

export function AdherenceCalendar({ startDate, logs }: Props) {
  const today = startOfDay(new Date());
  const start = subDays(today, 29);
  const days = eachDayOfInterval({ start, end: today });
  const medStart = startDate ? startOfDay(new Date(startDate + "T00:00:00")) : null;

  const byDay = new Map<string, { taken: number; missed: number }>();
  for (const log of logs) {
    const key = format(new Date(log.scheduled_for), "yyyy-MM-dd");
    const cur = byDay.get(key) ?? { taken: 0, missed: 0 };
    if (log.status === "taken") cur.taken += 1;
    else if (log.status === "missed") cur.missed += 1;
    byDay.set(key, cur);
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10">
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const beforeStart = medStart && isBefore(d, medStart);
          const counts = byDay.get(key);
          let cls = "bg-muted/40 text-muted-foreground";
          if (beforeStart) cls = "bg-transparent border-dashed text-muted-foreground/40";
          else if (counts?.taken) cls = "bg-success/80 text-white";
          else if (counts?.missed) cls = "bg-emergency/80 text-white";
          return (
            <div
              key={key}
              title={format(d, "dd MMM", { locale: ptBR })}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md border border-border/50 text-[10px] font-medium",
                cls,
              )}
            >
              {format(d, "d")}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Legend className="bg-success/80" label="Tomado" />
        <Legend className="bg-emergency/80" label="Perdido" />
        <Legend className="bg-muted/40" label="Sem registro" />
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-3 w-3 rounded-sm", className)} /> {label}
    </span>
  );
}
