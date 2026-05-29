import { Link } from "@tanstack/react-router";
import { CalendarCheck, CalendarPlus, Stethoscope } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeDateTime } from "@/lib/dates";
import { useUpcomingAppointments } from "@/features/dashboard/hooks/useDashboardQueries";

export function AppointmentsCard({
  patientId,
  familyId,
}: {
  patientId: string;
  familyId: string;
}) {
  const q = useUpcomingAppointments(patientId, 3);

  return (
    <Card aria-labelledby="card-appts-title" className="border-border/70 p-5 shadow-soft">
      <header className="flex items-center justify-between">
        <h2 id="card-appts-title" className="text-base font-semibold">
          Agenda
        </h2>
        <Link
          to="/agenda"
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver tudo
        </Link>
      </header>

      <div className="mt-4 space-y-2">
        {q.isPending ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : q.data && q.data.length > 0 ? (
          q.data.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <Stethoscope className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatRelativeDateTime(a.scheduled_at)}
                  {a.specialty ? ` · ${a.specialty}` : ""}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-muted/30 p-5 text-center">
            <CalendarCheck className="h-7 w-7 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhum compromisso agendado
            </p>
            <Button asChild size="sm" className="mt-3 h-9">
              <Link
                to="/familia/$familyId/agenda/novo"
                params={{ familyId }}
              >
                <CalendarPlus className="mr-1.5 h-4 w-4" /> Agendar
              </Link>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
