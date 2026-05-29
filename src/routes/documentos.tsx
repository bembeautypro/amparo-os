import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { DocumentsList } from "@/features/documents/DocumentsList";

export const Route = createFileRoute("/documentos")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <Page />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function Page() {
  const { activeFamily, activePatient } = useFamilyContext();
  if (activeFamily) {
    return (
      <Navigate
        to="/familia/$familyId/documentos"
        params={{ familyId: activeFamily.id }}
        replace
      />
    );
  }
  if (!activePatient) {
    return <p className="text-sm text-muted-foreground">Selecione um familiar.</p>;
  }
  return null;
}
