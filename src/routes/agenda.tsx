import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { AgendaList } from "@/features/agenda/AgendaList";

export const Route = createFileRoute("/agenda")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <AgendaPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function AgendaPage() {
  const { activeFamily, activePatient } = useFamilyContext();

  if (!activeFamily || !activePatient) {
    return (
      <p className="text-sm text-muted-foreground">
        Selecione uma família e um familiar para ver a agenda.
      </p>
    );
  }

  return <AgendaList familyId={activeFamily.id} patientId={activePatient.id} />;
}
