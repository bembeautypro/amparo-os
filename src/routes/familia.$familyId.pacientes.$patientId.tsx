import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { PatientProfile } from "@/features/patient/PatientProfile";

export const Route = createFileRoute(
  "/familia/$familyId/pacientes/$patientId",
)({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <Page />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function Page() {
  const { familyId, patientId } = Route.useParams();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/familia">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Perfil do familiar</h1>
      <PatientProfile familyId={familyId} patientId={patientId} />
    </div>
  );
}
