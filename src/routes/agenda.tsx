import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Plus, MapPin, User2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui-extras";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/agenda")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <AgendaPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function AgendaPage() {
  const { activePatient, activeFamily } = useFamilyContext();

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", activePatient?.id],
    enabled: !!activePatient?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", activePatient!.id)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const newHref = activeFamily ? `/familia/${activeFamily.id}/agenda/novo` : "#";
  const now = new Date();
  const items = data ?? [];
  const upcoming = items.filter((a) => isAfter(parseISO(a.scheduled_at), now));
  const past = items.filter((a) => !isAfter(parseISO(a.scheduled_at), now));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agenda"
        description={
          activePatient
            ? `Consultas e compromissos de ${activePatient.name}.`
            : "Selecione um familiar para ver a agenda."
        }
        action={
          activeFamily && (
            <Button asChild className="h-11 gap-2">
              <Link to={newHref}>
                <Plus className="h-4 w-4" /> Nova consulta
              </Link>
            </Button>
          )
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhuma consulta agendada"
          description="Cadastre consultas, exames e retornos para receber lembretes e manter tudo organizado."
          action={activeFamily ? { label: "Criar consulta", to: newHref } : undefined}
        />
      ) : (
        <div className="space-y-8">
          <Section title="Próximas" items={upcoming} empty="Nenhuma consulta futura." />
          <Section title="Histórico" items={past} empty="Sem consultas anteriores." muted />
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  empty,
  muted,
}: {
  title: string;
  items: Array<{
    id: string;
    title: string;
    specialty: string | null;
    doctor_name: string | null;
    location: string | null;
    scheduled_at: string;
    status: string;
  }>;
  empty: string;
  muted?: boolean;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="grid gap-3">
          {items.map((a) => {
            const date = parseISO(a.scheduled_at);
            return (
              <Card
                key={a.id}
                className={`flex items-start gap-4 border-border/70 p-5 shadow-soft ${muted ? "opacity-70" : ""}`}
              >
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <div className="text-center leading-tight">
                    <p className="text-[10px] font-semibold uppercase">
                      {format(date, "MMM", { locale: ptBR })}
                    </p>
                    <p className="text-xl font-bold">{format(date, "dd")}</p>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold leading-tight">{a.title}</p>
                    {a.specialty && (
                      <Badge variant="secondary" className="font-normal">
                        {a.specialty}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {format(date, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {a.doctor_name && (
                      <span className="inline-flex items-center gap-1">
                        <User2 className="h-3.5 w-3.5" /> {a.doctor_name}
                      </span>
                    )}
                    {a.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {a.location}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
