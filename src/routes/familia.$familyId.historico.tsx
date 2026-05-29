import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { HistoryList } from "@/features/history/HistoryList";

export const Route = createFileRoute("/familia/$familyId/historico")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <Page />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function Page() {
  const { familyId } = useParams({ from: "/familia/$familyId/historico" });
  const { activePatient } = useFamilyContext();
  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link to="/familia">
          <ArrowLeft className="h-4 w-4" /> Família
        </Link>
      </Button>
      {activePatient ? (
        <HistoryList familyId={familyId} patientId={activePatient.id} />
      ) : (
        <p className="text-sm text-muted-foreground">Selecione um familiar.</p>
      )}
    </div>
  );
}
