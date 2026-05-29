import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { PatientSwitcher } from "./PatientSwitcher";
import { QuickActionsFab } from "./QuickActionsFab";
import { PatientCard } from "./cards/PatientCard";
import { AlertsCard } from "./cards/AlertsCard";
import { AppointmentsCard } from "./cards/AppointmentsCard";
import { MedicationsTodayCard } from "./cards/MedicationsTodayCard";
import { DocumentsRecentCard } from "./cards/DocumentsRecentCard";
import { FamilyCard } from "./cards/FamilyCard";

export function DashboardHome() {
  const { activeFamily, activePatient, patients, loading } = useFamilyContext();

  // Empty states
  if (!loading && !activeFamily) {
    return (
      <Card className="border-border/70 p-8 text-center shadow-soft">
        <Users className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Vamos começar</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
          Cadastre sua família e o primeiro familiar para organizar a rotina de
          cuidado.
        </p>
        <Button asChild className="mt-6 h-11">
          <Link to="/onboarding">Iniciar onboarding</Link>
        </Button>
      </Card>
    );
  }

  if (activeFamily && patients.length === 0) {
    return (
      <Card className="border-border/70 p-8 text-center shadow-soft">
        <Users className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Adicione um familiar</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
          Complete o cadastro para começar a registrar medicamentos e consultas.
        </p>
        <Button asChild className="mt-6 h-11">
          <Link to="/onboarding">Continuar onboarding</Link>
        </Button>
      </Card>
    );
  }

  if (!activeFamily || !activePatient) {
    return null;
  }

  return (
    <>
      <PatientSwitcher />

      <div className="space-y-3 pt-3">
        <PatientCard patientId={activePatient.id} />
        <AlertsCard patientId={activePatient.id} familyId={activeFamily.id} />
        <AppointmentsCard patientId={activePatient.id} familyId={activeFamily.id} />
        <MedicationsTodayCard
          patientId={activePatient.id}
          familyId={activeFamily.id}
        />
        <DocumentsRecentCard
          patientId={activePatient.id}
          familyId={activeFamily.id}
        />
        <FamilyCard familyId={activeFamily.id} />
      </div>

      <QuickActionsFab familyId={activeFamily.id} />
    </>
  );
}
