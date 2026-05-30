import { createFileRoute, useParams } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { DocumentNewForm } from "@/features/documents/DocumentNewForm";

export const Route = createFileRoute("/familia/$familyId/documentos/novo")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <Page />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function Page() {
  const { familyId } = useParams({ from: "/familia/$familyId/documentos/novo" });
  const { activePatient, loading } = useFamilyContext();
  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }
  if (!activePatient) {
    return <p className="text-sm text-muted-foreground">Selecione um familiar.</p>;
  }
  return <DocumentNewForm familyId={familyId} patientId={activePatient.id} />;
}
