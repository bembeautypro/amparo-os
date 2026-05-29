import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { AppointmentForm } from "@/features/agenda/AppointmentForm";
import { fetchAppointment } from "@/features/agenda/api";

export const Route = createFileRoute("/familia/$familyId/agenda/$id/editar")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <EditPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function EditPage() {
  const { familyId, id } = useParams({
    from: "/familia/$familyId/agenda/$id/editar",
  });
  const { data, isLoading } = useQuery({
    queryKey: ["appointment", id],
    queryFn: () => fetchAppointment(id),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link
          to="/familia/$familyId/agenda/$id"
          params={{ familyId, id }}
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold tracking-tight">Editar compromisso</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">Não encontrado.</p>
      ) : (
        <AppointmentForm
          familyId={familyId}
          patientId={data.patient_id}
          initial={data}
        />
      )}
    </div>
  );
}
