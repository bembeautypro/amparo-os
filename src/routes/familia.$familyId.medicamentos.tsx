import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pill, Plus, ArrowLeft } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui-extras";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/familia/$familyId/medicamentos")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <MedicationsPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function MedicationsPage() {
  const { familyId } = useParams({ from: "/familia/$familyId/medicamentos" });
  const { activePatient } = useFamilyContext();
  

  const { data, isLoading } = useQuery({
    queryKey: ["medications", activePatient?.id],
    enabled: !!activePatient?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .eq("patient_id", activePatient!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
        <Link to="/familia">
          <ArrowLeft className="h-4 w-4" /> Família
        </Link>
      </Button>

      <PageHeader
        title="Medicamentos"
        description={
          activePatient
            ? `Doses e horários de ${activePatient.name}.`
            : "Selecione um familiar."
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

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="Nenhum medicamento cadastrado"
          description="Registre os medicamentos em uso para nunca esquecer uma dose."
          action={
            <Button asChild className="h-11">
              <Link
                to="/familia/$familyId/medicamentos/novo"
                params={{ familyId }}
              >
                Adicionar medicamento
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((m) => (
            <Card
              key={m.id}
              className="flex items-start gap-4 border-border/70 p-5 shadow-soft"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <Pill className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold leading-tight">{m.name}</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                  {m.dosage && <span>{m.dosage}</span>}
                  {m.frequency && <span>· {m.frequency}</span>}
                </div>
                {m.notes && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {m.notes}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
