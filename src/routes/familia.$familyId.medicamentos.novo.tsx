import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useFamilyContext } from "@/contexts/FamilyContext";
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
  const { activePatient } = useFamilyContext();

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

      {activePatient ? (
        <MedicationForm
          mode="create"
          familyId={familyId}
          patientId={activePatient.id}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Selecione um familiar para cadastrar.
        </p>
      )}
    </div>
  );
}
