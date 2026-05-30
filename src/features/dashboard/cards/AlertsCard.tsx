import { Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronRight } from "lucide-react";
import {
  usePatientHeader,
  usePatientAllergies,
  useEmergencyContacts,
  useUpcomingAppointments,
  useActiveMedications,
} from "@/features/dashboard/hooks/useDashboardQueries";

type Alert = {
  id: string;
  label: string;
  to: string;
  params: Record<string, string>;
};

export function AlertsCard({
  patientId,
  familyId,
}: {
  patientId: string;
  familyId: string;
}) {
  const headerQ = usePatientHeader(patientId);
  const allergiesQ = usePatientAllergies(patientId);
  const contactsQ = useEmergencyContacts(patientId);
  const apptsQ = useUpcomingAppointments(patientId, 20);
  const medsQ = useActiveMedications(patientId);

  const alerts: Alert[] = [];

  const profilePath = "/familia/$familyId/pacientes/$patientId";
  const profileParams = { familyId, patientId };

  medsQ.data?.forEach((m) => {
    if (!m.schedule || m.schedule.length === 0) {
      alerts.push({
        id: `med-${m.id}`,
        label: `Medicamento "${m.name}" sem horário definido`,
        to: "/familia/$familyId/medicamentos/$medId/editar",
        params: { familyId, medId: m.id },
      });
    }
  });

  if (contactsQ.data && contactsQ.data.length === 0) {
    alerts.push({
      id: "no-contact",
      label: "Adicione um contato de emergência",
      to: profilePath,
      params: profileParams,
    });
  }

  apptsQ.data?.forEach((a) => {
    if (!a.responsible_user_id) {
      alerts.push({
        id: `appt-${a.id}`,
        label: `Consulta "${a.title}" sem responsável definido`,
        to: "/familia/$familyId/agenda/$id/editar",
        params: { familyId, id: a.id },
      });
    }
  });

  if (headerQ.data && (!headerQ.data.blood_type || headerQ.data.blood_type === "unknown")) {
    alerts.push({
      id: "no-blood",
      label: "Cadastre o tipo sanguíneo",
      to: profilePath,
      params: profileParams,
    });
  }

  if (allergiesQ.data && allergiesQ.data.length === 0) {
    alerts.push({
      id: "no-allergies",
      label: "Registre alergias conhecidas (ou confirme que não há)",
      to: profilePath,
      params: profileParams,
    });
  }

  if (alerts.length === 0) return null;

  return (
    <section
      aria-labelledby="card-alerts-title"
      className="rounded-[var(--radius)] border border-warn/30 border-l-4 border-l-warn bg-warn-soft/40 p-5 shadow-soft"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-warn" />
        <h2 id="card-alerts-title" className="text-sm font-semibold text-foreground">
          {alerts.length} {alerts.length === 1 ? "pendência" : "pendências"} para resolver
        </h2>
      </div>
      <ul className="mt-3 space-y-1.5">
        {alerts.map((a) => (
          <li key={a.id}>
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to={a.to as any}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              params={a.params as any}
              className="group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-warn-soft/70"
            >
              <span className="min-w-0 truncate">{a.label}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
