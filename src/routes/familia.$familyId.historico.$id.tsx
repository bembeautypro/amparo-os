import { createFileRoute, useParams } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClinicalEventDetail } from "@/features/history/ClinicalEventDetail";

export const Route = createFileRoute("/familia/$familyId/historico/$id")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <Page />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function Page() {
  const { familyId, id } = useParams({
    from: "/familia/$familyId/historico/$id",
  });
  return <ClinicalEventDetail familyId={familyId} eventId={id} />;
}
