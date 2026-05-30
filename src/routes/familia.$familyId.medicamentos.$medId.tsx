import { useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, StopCircle } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";

import { fetchMedicationById, updateMedicationStatus } from "@/features/medications/api";
import { AdherenceCalendar } from "@/features/medications/AdherenceCalendar";
import { LogsList } from "@/features/medications/LogsList";
import { ChangeHistoryTimeline } from "@/features/medications/ChangeHistoryTimeline";
import { MedicationPhoto } from "@/features/medications/MedicationPhoto";
import { parseSchedule } from "@/features/medications/utils";
import {
  FORM_OPTIONS,
  STATUS_LABEL,
  type ChangeHistory,
  type MedicationLog,
} from "@/features/medications/types";

export const Route = createFileRoute("/familia/$familyId/medicamentos/$medId")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <MedicationDetailPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function MedicationDetailPage() {
  const { familyId, medId } = useParams({
    from: "/familia/$familyId/medicamentos/$medId",
  });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmEnd, setConfirmEnd] = useState(false);

  const medQ = useQuery({
    queryKey: ["medication", medId],
    queryFn: () => fetchMedicationById(medId),
  });

  const logsQ = useQuery({
    queryKey: ["medication-logs", medId],
    enabled: !!medQ.data,
    queryFn: async (): Promise<MedicationLog[]> => {
      const since = subDays(startOfDay(new Date()), 29);
      const { data, error } = await supabase
        .from("medication_logs")
        .select("*")
        .eq("medication_id", medId)
        .gte("scheduled_for", since.toISOString())
        .order("scheduled_for", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MedicationLog[];
    },
  });

  const historyQ = useQuery({
    queryKey: ["medication-history", medId],
    enabled: !!medQ.data,
    queryFn: async (): Promise<ChangeHistory[]> => {
      const { data, error } = await supabase
        .from("medication_change_history")
        .select("*")
        .eq("medication_id", medId)
        .order("changed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChangeHistory[];
    },
  });

  const endMutation = useMutation({
    mutationFn: () => updateMedicationStatus(medId, "ended"),
    onSuccess: () => {
      toast.success("Medicamento encerrado");
      qc.invalidateQueries({ queryKey: ["medications"] });
      qc.invalidateQueries({ queryKey: ["medication", medId] });
      qc.invalidateQueries({ queryKey: ["dash"] });
      navigate({
        to: "/familia/$familyId/medicamentos",
        params: { familyId },
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (medQ.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-60 w-full rounded-2xl" />
      </div>
    );
  }

  if (!medQ.data) {
    return (
      <div className="space-y-4">
        <BackLink familyId={familyId} />
        <p className="text-sm text-muted-foreground">
          Medicamento não encontrado.
        </p>
      </div>
    );
  }

  const m = medQ.data;
  const schedule = parseSchedule(m.schedule);
  const formLabel =
    FORM_OPTIONS.find((f) => f.value === m.form)?.label ?? m.form ?? "—";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink familyId={familyId} />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {m.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {m.dosage && <span>{m.dosage}</span>}
            {m.frequency && <span>· {m.frequency}</span>}
            <Badge variant="secondary" className="rounded-full">
              {STATUS_LABEL[m.status]}
            </Badge>
          </div>
        </div>
        <Button asChild variant="outline" className="h-10 gap-2">
          <Link
            to="/familia/$familyId/medicamentos/$medId/editar"
            params={{ familyId, medId }}
          >
            <Pencil className="h-4 w-4" /> Editar
          </Link>
        </Button>
      </header>

      <Card className="border-border/70 p-5 shadow-soft">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Info label="Nome genérico" value={m.generic_name} />
          <Info label="Forma" value={formLabel} />
          <Info
            label="Horários"
            value={
              schedule.length ? schedule.map((s) => s.time).join(", ") : "—"
            }
          />
          <Info
            label="Período"
            value={
              m.start_date
                ? `${format(new Date(m.start_date + "T00:00:00"), "dd/MM/yyyy")}${
                    m.end_date
                      ? " – " +
                        format(new Date(m.end_date + "T00:00:00"), "dd/MM/yyyy")
                      : " – uso contínuo"
                  }`
                : "—"
            }
          />
          <Info label="Prescritor" value={m.prescriber} />
          <Info label="Observações" value={m.notes} fullWidth />
        </dl>
      </Card>

      <Card className="border-border/70 p-5 shadow-soft">
        <h2 className="text-base font-semibold">
          Histórico de tomadas — últimos 30 dias
        </h2>
        <div className="mt-4">
          {logsQ.isPending ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <AdherenceCalendar
              startDate={m.start_date}
              logs={logsQ.data ?? []}
            />
          )}
        </div>
        <Separator className="my-5" />
        <h3 className="text-sm font-semibold">Últimas tomadas</h3>
        <div className="mt-3">
          {logsQ.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <LogsList logs={logsQ.data ?? []} />
          )}
        </div>
      </Card>

      <Card className="border-border/70 p-5 shadow-soft">
        <h2 className="text-base font-semibold">Histórico de alterações</h2>
        <div className="mt-4">
          {historyQ.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <ChangeHistoryTimeline items={historyQ.data ?? []} />
          )}
        </div>
      </Card>

      {m.status !== "ended" && (
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full gap-2 border-emergency/40 text-emergency hover:bg-emergency/10"
          onClick={() => setConfirmEnd(true)}
        >
          <StopCircle className="h-4 w-4" /> Encerrar medicamento
        </Button>
      )}

      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar {m.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              O histórico será preservado e o medicamento ficará na aba
              "Encerrados".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emergency text-emergency-foreground hover:bg-emergency/90"
              onClick={() => endMutation.mutate()}
            >
              Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BackLink({ familyId }: { familyId: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
      <Link to="/familia/$familyId/medicamentos" params={{ familyId }}>
        <ArrowLeft className="h-4 w-4" /> Medicamentos
      </Link>
    </Button>
  );
}

function Info({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: string | null | undefined;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : undefined}>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 whitespace-pre-line text-sm text-foreground">
        {value || "—"}
      </dd>
    </div>
  );
}
