import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, UserPlus } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useActivePatientForFamily } from "@/hooks/useActivePatientForFamily";
import { MedicationForm } from "@/features/medications/MedicationForm";

export const Route = createFileRoute("/familia/$familyId/medicamentos/novo")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <NewMedicationPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function NewMedicationPage() {
  const { familyId } = useParams({ from: "/familia/$familyId/medicamentos/novo" });
  const { patient, loading, empty } = useActivePatientForFamily(familyId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
        <Link to="/familia/$familyId/medicamentos" params={{ familyId }}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Novo medicamento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre dose, frequência e observações importantes.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : patient ? (
        <MedicationForm mode="create" familyId={familyId} patientId={patient.id} />
      ) : empty ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Adicione um familiar antes de cadastrar medicamentos.
          </p>
          <Button asChild className="mt-3">
            <Link to="/familia/$familyId/pacientes/novo" params={{ familyId }}>
              <UserPlus className="mr-2 h-4 w-4" /> Adicionar familiar
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
