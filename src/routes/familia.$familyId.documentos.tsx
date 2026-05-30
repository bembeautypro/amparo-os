import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, UserPlus } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useActivePatientForFamily } from "@/hooks/useActivePatientForFamily";
import { DocumentsList } from "@/features/documents/DocumentsList";

export const Route = createFileRoute("/familia/$familyId/documentos")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <Page />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function Page() {
  const { familyId } = useParams({ from: "/familia/$familyId/documentos" });
  const { patient, loading, empty } = useActivePatientForFamily(familyId);
  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link to="/familia">
          <ArrowLeft className="h-4 w-4" /> Família
        </Link>
      </Button>
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : patient ? (
        <DocumentsList familyId={familyId} patientId={patient.id} />
      ) : empty ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhum familiar nesta família.</p>
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
