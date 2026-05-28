import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Plus, Pill, CalendarDays, FileText, AlertTriangle } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui-extras";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/familia")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <FamilyPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function FamilyPage() {
  const { activeFamily, patients, setActivePatient, activePatient } = useFamilyContext();

  const { data: counts } = useQuery({
    queryKey: ["patient-counts", activeFamily?.id, patients.map((p) => p.id).join(",")],
    enabled: patients.length > 0,
    queryFn: async () => {
      const ids = patients.map((p) => p.id);
      const [meds, appts, docs, allergies] = await Promise.all([
        supabase.from("medications").select("patient_id").in("patient_id", ids),
        supabase.from("appointments").select("patient_id").in("patient_id", ids),
        supabase.from("documents").select("patient_id").in("patient_id", ids),
        supabase.from("patient_allergies").select("patient_id").in("patient_id", ids),
      ]);
      const tally = (rows: { patient_id: string }[] | null) =>
        (rows ?? []).reduce<Record<string, number>>(
          (acc, r) => ((acc[r.patient_id] = (acc[r.patient_id] ?? 0) + 1), acc),
          {},
        );
      return {
        meds: tally(meds.data),
        appts: tally(appts.data),
        docs: tally(docs.data),
        allergies: tally(allergies.data),
      };
    },
  });

  if (!activeFamily) {
    return (
      <EmptyState
        icon={Users}
        title="Crie sua família"
        description="Comece adicionando familiares para organizar a saúde de todos juntos."
        action={{ label: "Iniciar onboarding", to: "/onboarding" }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={activeFamily.name}
        description="Familiares sob seu cuidado e atalhos rápidos."
      />

      {patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum familiar cadastrado"
          description="Adicione um familiar para começar a registrar medicamentos, consultas e documentos."
          action={{ label: "Adicionar familiar", to: "/onboarding" }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {patients.map((p) => {
            const active = activePatient?.id === p.id;
            return (
              <Card
                key={p.id}
                className={`border-border/70 p-5 shadow-soft transition-all ${active ? "ring-2 ring-primary/40" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    {p.avatarUrl && <AvatarImage src={p.avatarUrl} alt={p.name} />}
                    <AvatarFallback className="bg-primary-soft text-primary text-base font-semibold">
                      {p.name
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.name}</p>
                    {p.relation && (
                      <p className="text-sm text-muted-foreground">{p.relation}</p>
                    )}
                  </div>
                  {active ? (
                    <Badge className="bg-primary text-primary-foreground">Ativo</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActivePatient(p)}
                    >
                      Selecionar
                    </Button>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                  <Stat icon={Pill} value={counts?.meds[p.id] ?? 0} label="Remédios" />
                  <Stat
                    icon={CalendarDays}
                    value={counts?.appts[p.id] ?? 0}
                    label="Consultas"
                  />
                  <Stat icon={FileText} value={counts?.docs[p.id] ?? 0} label="Docs" />
                  <Stat
                    icon={AlertTriangle}
                    value={counts?.allergies[p.id] ?? 0}
                    label="Alergias"
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="secondary" className="gap-1.5">
                    <Link
                      to="/familia/$familyId/medicamentos"
                      params={{ familyId: activeFamily.id }}
                    >
                      <Pill className="h-3.5 w-3.5" /> Medicamentos
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary" className="gap-1.5">
                    <Link
                      to="/familia/$familyId/agenda/novo"
                      params={{ familyId: activeFamily.id }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Consulta
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary" className="gap-1.5">
                    <Link
                      to="/familia/$familyId/documentos/novo"
                      params={{ familyId: activeFamily.id }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Documento
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Pill;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-lg bg-muted/60 px-2 py-2.5">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
      <p className="mt-1 text-base font-semibold leading-none">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
