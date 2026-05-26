import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pill,
  CalendarCheck,
  FileText,
  Activity,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyContext } from "@/contexts/FamilyContext";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Dashboard />
      </AppLayout>
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { activePatient } = useFamilyContext();
  const firstName =
    ((user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "")
      .split(" ")[0] ?? "";

  return (
    <div className="space-y-8">
      <section className="space-y-1.5">
        <p className="text-sm text-muted-foreground">Olá, {firstName} 👋</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Tudo certo com {activePatient?.name ?? "sua família"} hoje.
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Aqui está um resumo do cuidado. Em breve você poderá registrar medicamentos,
          agendar consultas e organizar documentos médicos.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Pill, label: "Medicamentos hoje", value: "—" },
          { icon: CalendarCheck, label: "Próximas consultas", value: "—" },
          { icon: FileText, label: "Documentos", value: "—" },
          { icon: Activity, label: "Última aferição", value: "—" },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="border-border/70 p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/70 p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Configure o cuidado</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Termine o onboarding para começar a organizar a rotina de saúde.
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          <ol className="mt-6 space-y-3">
            {[
              "Adicionar familiar idoso",
              "Cadastrar condições e alergias",
              "Configurar medicamentos",
              "Convidar irmãos e cuidadores",
              "Definir contato de emergência",
            ].map((step, i) => (
              <li
                key={step}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium">{step}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </li>
            ))}
          </ol>

          <Button className="mt-6 h-11 w-full sm:w-auto">Continuar onboarding</Button>
        </Card>

        <Card className="border-border/70 p-6 shadow-soft">
          <h2 className="text-lg font-semibold">Em caso de emergência</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesso rápido às informações vitais do familiar.
          </p>
          <div className="mt-5 space-y-3 text-sm">
            <Row label="Tipo sanguíneo" value="—" />
            <Row label="Alergias" value="—" />
            <Row label="Contato principal" value="—" />
          </div>
          <Button
            variant="outline"
            className="mt-6 h-11 w-full border-emergency/30 bg-emergency-soft text-emergency hover:bg-emergency-soft hover:text-emergency"
          >
            Gerar link de emergência
          </Button>
        </Card>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
