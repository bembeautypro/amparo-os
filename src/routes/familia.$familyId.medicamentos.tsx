import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { MedicationsList } from "@/features/medications/MedicationsList";

export const Route = createFileRoute("/familia/$familyId/medicamentos")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <MedicationsPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function MedicationsPage() {
  const { familyId } = useParams({ from: "/familia/$familyId/medicamentos" });
  const { activePatient } = useFamilyContext();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
        <Link to="/familia">
          <ArrowLeft className="h-4 w-4" /> Família
        </Link>
      </Button>

      {activePatient ? (
        <MedicationsList
          familyId={familyId}
          patientId={activePatient.id}
          patientName={activePatient.name}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Selecione um familiar.</p>
      )}
    </div>
  );
}
