import { createFileRoute, useParams } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppointmentDetail } from "@/features/agenda/AppointmentDetail";

export const Route = createFileRoute("/familia/$familyId/agenda/$id")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <DetailPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function DetailPage() {
  const { familyId, id } = useParams({ from: "/familia/$familyId/agenda/$id" });
  return <AppointmentDetail familyId={familyId} appointmentId={id} />;
}
