import { createFileRoute, useParams } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { DocumentDetail } from "@/features/documents/DocumentDetail";

export const Route = createFileRoute("/familia/$familyId/documentos/$id")({
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
    from: "/familia/$familyId/documentos/$id",
  });
  return <DocumentDetail familyId={familyId} id={id} />;
}
