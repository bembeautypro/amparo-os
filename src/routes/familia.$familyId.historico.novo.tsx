import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, UserPlus } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useActivePatientForFamily } from "@/hooks/useActivePatientForFamily";
import { ClinicalEventForm } from "@/features/history/ClinicalEventForm";

export const Route = createFileRoute("/familia/$familyId/historico/novo")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <Page />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function Page() {
  const { familyId } = useParams({ from: "/familia/$familyId/historico/novo" });
  const { patient, loading, empty } = useActivePatientForFamily(familyId);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link to="/familia/$familyId/historico" params={{ familyId }}>
          <ArrowLeft className="h-4 w-4" /> Histórico
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold tracking-tight">Novo evento</h1>
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : patient ? (
        <ClinicalEventForm familyId={familyId} patientId={patient.id} />
      ) : empty ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Adicione um familiar antes de registrar eventos.
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
