import { createFileRoute, Link, useParams, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeft, UserPlus } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useActivePatientForFamily } from "@/hooks/useActivePatientForFamily";
import { AppointmentForm } from "@/features/agenda/AppointmentForm";
import type { AppointmentType } from "@/features/agenda/types";

const searchSchema = z.object({
  type: z
    .enum([
      "consulta",
      "exame",
      "retorno",
      "procedimento",
      "fisioterapia",
      "vacina",
      "outro",
    ])
    .optional(),
  parent: z.string().optional(),
});

export const Route = createFileRoute("/familia/$familyId/agenda/novo")({
  validateSearch: searchSchema,
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <NewAppointmentPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function NewAppointmentPage() {
  const { familyId } = useParams({ from: "/familia/$familyId/agenda/novo" });
  const search = useSearch({ from: "/familia/$familyId/agenda/novo" });
  const { patient, loading, empty } = useActivePatientForFamily(familyId);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link to="/familia/$familyId/agenda" params={{ familyId }}>
          <ArrowLeft className="h-4 w-4" /> Agenda
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold tracking-tight">Novo compromisso</h1>
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : patient ? (
        <AppointmentForm
          familyId={familyId}
          patientId={patient.id}
          defaultType={search.type as AppointmentType | undefined}
          parentAppointmentId={search.parent ?? null}
        />
      ) : empty ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Adicione um familiar antes de criar compromissos.
          </p>
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
