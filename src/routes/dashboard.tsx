import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isAfter, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Pill,
  CalendarCheck,
  FileText,
  AlertTriangle,
  ArrowRight,
  PhoneCall,
  Plus,
  Users,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { supabase } from "@/integrations/supabase/client";

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
  const { activePatient, activeFamily, patients, loading } = useFamilyContext();
  const firstName =
    ((user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "")
      .split(" ")[0] ?? "";

  const patientId = activePatient?.id;

  const summaryQ = useQuery({
    queryKey: ["dashboard-summary", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const [meds, appts, docs, allergies] = await Promise.all([
        supabase.from("medications").select("id, name, dosage, frequency").eq("patient_id", patientId!),
        supabase
          .from("appointments")
          .select("id, title, specialty, scheduled_at, location")
          .eq("patient_id", patientId!)
          .order("scheduled_at", { ascending: true }),
        supabase.from("documents").select("id").eq("patient_id", patientId!),
        supabase.from("patient_allergies").select("id, name, severity").eq("patient_id", patientId!),
      ]);
      return {
        meds: meds.data ?? [],
        appts: appts.data ?? [],
        docs: docs.data ?? [],
        allergies: allergies.data ?? [],
      };
    },
  });

  const patientInfoQ = useQuery({
    queryKey: ["patient-info", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const [{ data: p }, { data: contacts }] = await Promise.all([
        supabase
          .from("patients")
          .select("blood_type")
          .eq("id", patientId!)
          .maybeSingle(),
        supabase
          .from("emergency_contacts")
          .select("name, phone, relation")
          .eq("patient_id", patientId!)
          .limit(1),
      ]);
      return { bloodType: p?.blood_type ?? null, primaryContact: contacts?.[0] ?? null };
    },
  });

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const appts = summaryQ.data?.appts ?? [];
  const todaysAppts = appts.filter((a) => {
    const d = parseISO(a.scheduled_at);
    return d >= todayStart && d <= todayEnd;
  });
  const nextAppt = appts.find((a) => isAfter(parseISO(a.scheduled_at), now));

  // No families yet → invite to onboarding
  if (!loading && !activeFamily) {
    return (
      <Card className="border-border/70 p-8 text-center shadow-soft">
        <Users className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Vamos começar</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
          Cadastre sua família e o primeiro familiar para organizar a rotina de cuidado.
        </p>
        <Button asChild className="mt-6 h-11">
          <Link to="/onboarding">Iniciar onboarding</Link>
        </Button>
      </Card>
    );
  }

  // Family exists but no patients yet
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

  return (
    <div className="space-y-8">
      <section className="space-y-1.5">
        <p className="text-sm text-muted-foreground">Olá, {firstName} 👋</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Tudo certo com {activePatient?.name ?? "sua família"} hoje.
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Um resumo rápido do cuidado. Use os atalhos abaixo para registrar tudo no lugar certo.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Pill}
          label="Medicamentos ativos"
          value={summaryQ.data?.meds.length ?? "—"}
          to={activeFamily ? "/familia/$familyId/medicamentos" : undefined}
          params={activeFamily ? { familyId: activeFamily.id } : undefined}
        />
        <StatCard
          icon={CalendarCheck}
          label="Consultas hoje"
          value={todaysAppts.length}
          to="/agenda"
        />
        <StatCard
          icon={FileText}
          label="Documentos"
          value={summaryQ.data?.docs.length ?? "—"}
          to="/documentos"
        />
        <StatCard
          icon={AlertTriangle}
          label="Alergias"
          value={summaryQ.data?.allergies.length ?? "—"}
          to="/emergencia"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/70 p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Próxima consulta</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Compromisso mais próximo na agenda.
              </p>
            </div>
            <CalendarCheck className="h-5 w-5 text-primary" />
          </div>

          {nextAppt ? (
            <div className="mt-5 flex items-start gap-4 rounded-xl border border-border bg-card p-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <div className="text-center leading-tight">
                  <p className="text-[10px] font-semibold uppercase">
                    {format(parseISO(nextAppt.scheduled_at), "MMM", { locale: ptBR })}
                  </p>
                  <p className="text-xl font-bold">
                    {format(parseISO(nextAppt.scheduled_at), "dd")}
                  </p>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold leading-tight">{nextAppt.title}</p>
                  {nextAppt.specialty && (
                    <Badge variant="secondary" className="font-normal">
                      {nextAppt.specialty}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {format(
                    parseISO(nextAppt.scheduled_at),
                    "EEEE, dd 'de' MMMM 'às' HH:mm",
                    { locale: ptBR },
                  )}
                </p>
                {nextAppt.location && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{nextAppt.location}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Nenhuma consulta agendada.
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="h-10">
              <Link to="/agenda">Ver agenda <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            {activeFamily && (
              <Button asChild className="h-10">
                <Link
                  to="/familia/$familyId/agenda/novo"
                  params={{ familyId: activeFamily.id }}
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Nova consulta
                </Link>
              </Button>
            )}
          </div>
        </Card>

        <Card className="border-emergency/20 bg-emergency-soft/40 p-6 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Em emergência</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Informações vitais à mão.
              </p>
            </div>
            <PhoneCall className="h-5 w-5 text-emergency" />
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <Row label="Tipo sanguíneo" value={patientInfoQ.data?.bloodType ?? "—"} />
            <Row
              label="Alergias"
              value={
                summaryQ.data?.allergies.length
                  ? summaryQ.data.allergies.map((a) => a.name).join(", ")
                  : "Nenhuma registrada"
              }
            />
            <Row
              label="Contato principal"
              value={
                patientInfoQ.data?.primaryContact
                  ? `${patientInfoQ.data.primaryContact.name} · ${patientInfoQ.data.primaryContact.phone}`
                  : "—"
              }
            />
          </div>
          <Button
            asChild
            className="mt-6 h-11 w-full bg-emergency text-emergency-foreground hover:bg-emergency/90"
          >
            <Link to="/emergencia">Abrir painel de emergência</Link>
          </Button>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Medicamentos
        </h2>
        {summaryQ.data && summaryQ.data.meds.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {summaryQ.data.meds.slice(0, 4).map((m) => (
              <Card
                key={m.id}
                className="flex items-start gap-3 border-border/70 p-4 shadow-soft"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Pill className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[m.dosage, m.frequency].filter(Boolean).join(" · ") || "Sem detalhes"}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Nenhum medicamento cadastrado.{" "}
            {activeFamily && (
              <Link
                to="/familia/$familyId/medicamentos/novo"
                params={{ familyId: activeFamily.id }}
                className="font-medium text-primary hover:underline"
              >
                Adicionar agora
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  to,
  params,
}: {
  icon: typeof Pill;
  label: string;
  value: number | string;
  to?: string;
  params?: Record<string, string>;
}) {
  const inner = (
    <Card className="border-border/70 p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
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
  );
  if (!to) return inner;
  return (
    // @ts-expect-error dynamic to/params
    <Link to={to} params={params} className="block">
      {inner}
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
