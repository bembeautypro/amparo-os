import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useFamilyContext } from "@/contexts/FamilyContext";
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
  const { activePatient } = useFamilyContext();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link to="/familia/$familyId/historico" params={{ familyId }}>
          <ArrowLeft className="h-4 w-4" /> Histórico
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold tracking-tight">Novo evento</h1>
      {activePatient ? (
        <ClinicalEventForm familyId={familyId} patientId={activePatient.id} />
      ) : (
        <p className="text-sm text-muted-foreground">Selecione um familiar.</p>
      )}
    </div>
  );
}
