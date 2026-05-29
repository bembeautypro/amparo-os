import { Link } from "@tanstack/react-router";
import { Pill, Plus } from "lucide-react";
import { format, isBefore } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useActiveMedications,
  useTodayMedicationLogs,
  type MedicationLog,
} from "@/features/dashboard/hooks/useDashboardQueries";

function statusFor(
  logs: MedicationLog[] | undefined,
  medicationId: string,
  hhmm: string,
): "taken" | "pending" {
  if (!logs) return "pending";
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  const target = new Date();
  target.setHours(h ?? 0, m ?? 0, 0, 0);
  const match = logs.find((l) => {
    if (l.medication_id !== medicationId) return false;
    const sched = new Date(l.scheduled_for);
    return Math.abs(sched.getTime() - target.getTime()) < 30 * 60 * 1000;
  });
  return match?.taken_at ? "taken" : "pending";
}

export function MedicationsTodayCard({
  patientId,
  familyId,
}: {
  patientId: string;
  familyId: string;
}) {
  const medsQ = useActiveMedications(patientId);
  const logsQ = useTodayMedicationLogs(patientId);
  const now = new Date();

  return (
    <Card
      aria-labelledby="card-meds-title"
      className="border-border/70 p-5 shadow-soft"
    >
      <header className="flex items-center justify-between">
        <h2 id="card-meds-title" className="text-base font-semibold">
          Medicamentos de hoje
        </h2>
        <Link
          to="/familia/$familyId/medicamentos"
          params={{ familyId }}
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver todos
        </Link>
      </header>

      <div className="mt-4 space-y-2">
        {medsQ.isPending ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : medsQ.data && medsQ.data.length > 0 ? (
          medsQ.data.map((m) => (
            <div
              key={m.id}
              className="rounded-lg border border-border/60 bg-card p-3"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Pill className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[m.dosage, m.frequency].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                {(!m.schedule || m.schedule.length === 0) && (
                  <Badge className="bg-warn-soft text-warn hover:bg-warn-soft">
                    Sem horário
                  </Badge>
                )}
              </div>

              {m.schedule && m.schedule.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {m.schedule.map((t) => {
                    const s = statusFor(logsQ.data, m.id, t);
                    const [h, mm] = t.split(":").map((n) => parseInt(n, 10));
                    const slot = new Date();
                    slot.setHours(h ?? 0, mm ?? 0, 0, 0);
                    const past = isBefore(slot, now);
                    return (
                      <Badge
                        key={t}
                        className={
                          s === "taken"
                            ? "bg-success-soft text-success hover:bg-success-soft"
                            : past
                              ? "bg-emergency-soft text-emergency hover:bg-emergency-soft"
                              : "bg-muted text-muted-foreground hover:bg-muted"
                        }
                      >
                        {format(slot, "HH:mm")} ·{" "}
                        {s === "taken" ? "Tomado" : "Pendente"}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-muted/30 p-5 text-center">
            <Pill className="h-7 w-7 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhum medicamento cadastrado
            </p>
            <Button asChild size="sm" className="mt-3 h-9">
              <Link
                to="/familia/$familyId/medicamentos/novo"
                params={{ familyId }}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Cadastrar
              </Link>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
