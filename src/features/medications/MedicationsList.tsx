import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pill, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/ui-extras";
import { PillsEmpty } from "@/components/illustrations/EmptyIllustrations";

import { fetchMedications } from "./api";
import { MedicationCard } from "./MedicationCard";
import type { MedicationStatus } from "./types";

type Props = {
  familyId: string;
  patientId: string;
  patientName?: string;
};

const TABS: { value: MedicationStatus; label: string }[] = [
  { value: "active", label: "Ativos" },
  { value: "paused", label: "Pausados" },
  { value: "ended", label: "Encerrados" },
];

export function MedicationsList({ familyId, patientId, patientName }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Medicamentos"
        description={
          patientName ? `Doses e horários de ${patientName}.` : undefined
        }
        action={
          <Button asChild className="h-11 gap-2">
            <Link
              to="/familia/$familyId/medicamentos/novo"
              params={{ familyId }}
            >
              <Plus className="h-4 w-4" /> Adicionar
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="active">
        <TabsList className="w-full sm:w-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="flex-1 sm:flex-none">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-5">
            <StatusPanel
              status={t.value}
              patientId={patientId}
              familyId={familyId}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function StatusPanel({
  status,
  patientId,
  familyId,
}: {
  status: MedicationStatus;
  patientId: string;
  familyId: string;
}) {
  const q = useQuery({
    queryKey: ["medications", patientId, status],
    queryFn: () => fetchMedications(patientId, status),
  });

  if (q.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  if (!q.data || q.data.length === 0) {
    const empty: Record<MedicationStatus, { title: string; desc: string; cta: string }> = {
      active: {
        title: "Nenhum medicamento cadastrado ainda.",
        desc: "Cadastre um medicamento para começar a acompanhar doses e horários.",
        cta: "Cadastrar primeiro",
      },
      paused: {
        title: "Nenhum medicamento pausado",
        desc: "Tratamentos pausados aparecem aqui.",
        cta: "Cadastrar medicamento",
      },
      ended: {
        title: "Nenhum medicamento encerrado",
        desc: "Tratamentos finalizados ficam arquivados aqui.",
        cta: "Cadastrar medicamento",
      },
      archived: { title: "Vazio", desc: "", cta: "" },
    };
    return (
      <EmptyState
        illustration={<PillsEmpty />}
        title={empty[status].title}
        description={empty[status].desc}
        action={
          status === "active" ? (
            <Button asChild className="h-11">
              <Link
                to="/familia/$familyId/medicamentos/novo"
                params={{ familyId }}
              >
                {empty[status].cta}
              </Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {q.data.map((m) => (
        <MedicationCard key={m.id} medication={m} familyId={familyId} />
      ))}
    </div>
  );
}
