import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, UserPlus } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useActivePatientForFamily } from "@/hooks/useActivePatientForFamily";
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
  const { patient, loading, empty } = useActivePatientForFamily(familyId);
  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!patient) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {empty
            ? "Adicione um familiar antes de subir documentos."
            : "Carregando familiar…"}
        </p>
        {empty && (
          <Button asChild className="mt-3">
            <Link to="/familia/$familyId/pacientes/novo" params={{ familyId }}>
              <UserPlus className="mr-2 h-4 w-4" /> Adicionar familiar
            </Link>
          </Button>
        )}
      </div>
    );
  }
  return <DocumentNewForm familyId={familyId} patientId={patient.id} />;
}
