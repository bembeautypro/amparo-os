import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MedicationForm } from "@/features/medications/MedicationForm";
import { fetchMedicationById } from "@/features/medications/api";

export const Route = createFileRoute(
  "/familia/$familyId/medicamentos/$medId/editar",
)({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <EditMedicationPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function EditMedicationPage() {
  const { familyId, medId } = useParams({
    from: "/familia/$familyId/medicamentos/$medId/editar",
  });

  const q = useQuery({
    queryKey: ["medication", medId],
    queryFn: () => fetchMedicationById(medId),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
        <Link
          to="/familia/$familyId/medicamentos/$medId"
          params={{ familyId, medId }}
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Editar medicamento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alterações ficam registradas no histórico do medicamento.
        </p>
      </div>

      {q.isPending ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : !q.data ? (
        <p className="text-sm text-muted-foreground">
          Medicamento não encontrado.
        </p>
      ) : (
        <MedicationForm
          mode="edit"
          familyId={familyId}
          patientId={q.data.patient_id}
          existing={q.data}
        />
      )}
    </div>
  );
}
