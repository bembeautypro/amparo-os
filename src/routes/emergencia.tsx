import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  PhoneCall,
  Droplet,
  AlertTriangle,
  HeartPulse,
  Pill,
  User2,
  ArrowLeft,
  Copy,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui-extras";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/emergencia")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <EmergencyPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function EmergencyPage() {
  const { activePatient } = useFamilyContext();
  const patientId = activePatient?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["emergency", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const [patient, allergies, conditions, contacts, meds] = await Promise.all([
        supabase
          .from("patients")
          .select("full_name, birth_date, blood_type, insurance_name, insurance_number")
          .eq("id", patientId!)
          .maybeSingle(),
        supabase
          .from("patient_allergies")
          .select("name, severity")
          .eq("patient_id", patientId!),
        supabase.from("patient_conditions").select("name").eq("patient_id", patientId!),
        supabase
          .from("emergency_contacts")
          .select("name, phone, relation")
          .eq("patient_id", patientId!),
        supabase
          .from("medications")
          .select("name, dosage, frequency")
          .eq("patient_id", patientId!),
      ]);
      return {
        patient: patient.data,
        allergies: allergies.data ?? [],
        conditions: conditions.data ?? [],
        contacts: contacts.data ?? [],
        meds: meds.data ?? [],
      };
    },
  });

  if (!activePatient) {
    return (
      <Card className="border-border/70 p-8 text-center shadow-soft">
        <p className="text-sm text-muted-foreground">
          Selecione um familiar para ver as informações de emergência.
        </p>
      </Card>
    );
  }

  async function copySummary() {
    if (!data) return;
    const lines = [
      `🚨 EMERGÊNCIA — ${data.patient?.full_name ?? activePatient!.name}`,
      data.patient?.blood_type && `Tipo sanguíneo: ${data.patient.blood_type}`,
      data.allergies.length &&
        `Alergias: ${data.allergies.map((a) => a.name).join(", ")}`,
      data.conditions.length &&
        `Condições: ${data.conditions.map((c) => c.name).join(", ")}`,
      data.meds.length &&
        `Medicamentos: ${data.meds.map((m) => `${m.name}${m.dosage ? ` ${m.dosage}` : ""}`).join(", ")}`,
      data.contacts.length &&
        `Contato: ${data.contacts[0].name} (${data.contacts[0].phone})`,
    ].filter(Boolean);
    await navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Resumo copiado");
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </Button>

      <PageHeader
        title="Painel de emergência"
        description={`Informações vitais de ${activePatient.name}.`}
        action={
          <Button variant="outline" className="h-11 gap-2" onClick={copySummary}>
            <Copy className="h-4 w-4" /> Copiar resumo
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <Card className="border-emergency/30 bg-emergency-soft/40 p-6 shadow-soft">
            <div className="grid gap-4 sm:grid-cols-3">
              <Vital
                icon={Droplet}
                label="Tipo sanguíneo"
                value={data?.patient?.blood_type ?? "—"}
              />
              <Vital
                icon={AlertTriangle}
                label="Alergias"
                value={data?.allergies.length ? `${data.allergies.length}` : "0"}
              />
              <Vital
                icon={HeartPulse}
                label="Condições"
                value={data?.conditions.length ? `${data.conditions.length}` : "0"}
              />
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/70 p-6 shadow-soft">
              <SectionTitle icon={PhoneCall} title="Contatos de emergência" />
              {data?.contacts.length ? (
                <ul className="mt-4 space-y-3">
                  {data.contacts.map((c, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.relation ?? "Contato"} · {c.phone}
                        </p>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        className="bg-emergency text-emergency-foreground hover:bg-emergency/90"
                      >
                        <a href={`tel:${c.phone}`}>Ligar</a>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyText>Nenhum contato cadastrado.</EmptyText>
              )}
            </Card>

            <Card className="border-border/70 p-6 shadow-soft">
              <SectionTitle icon={AlertTriangle} title="Alergias" />
              {data?.allergies.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.allergies.map((a, i) => (
                    <Badge
                      key={i}
                      className={
                        a.severity === "high"
                          ? "bg-emergency text-emergency-foreground"
                          : "bg-muted text-foreground"
                      }
                    >
                      {a.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyText>Nenhuma alergia registrada.</EmptyText>
              )}

              <div className="mt-6">
                <SectionTitle icon={HeartPulse} title="Condições" />
                {data?.conditions.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {data.conditions.map((c, i) => (
                      <Badge key={i} variant="secondary">
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <EmptyText>Nenhuma condição registrada.</EmptyText>
                )}
              </div>
            </Card>

            <Card className="border-border/70 p-6 shadow-soft lg:col-span-2">
              <SectionTitle icon={Pill} title="Medicamentos em uso" />
              {data?.meds.length ? (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {data.meds.map((m, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-border bg-card px-4 py-3"
                    >
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[m.dosage, m.frequency].filter(Boolean).join(" · ") ||
                          "Sem detalhes"}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyText>Nenhum medicamento cadastrado.</EmptyText>
              )}
            </Card>

            {(data?.patient?.insurance_name || data?.patient?.insurance_number) && (
              <Card className="border-border/70 p-6 shadow-soft lg:col-span-2">
                <SectionTitle icon={User2} title="Convênio" />
                <p className="mt-3 text-sm">
                  <span className="font-medium">{data.patient.insurance_name ?? "—"}</span>
                  {data.patient.insurance_number && (
                    <span className="text-muted-foreground">
                      {" · "}
                      {data.patient.insurance_number}
                    </span>
                  )}
                </p>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Vital({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Droplet;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-background/70 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-emergency text-emergency-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <div className="leading-tight">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof Droplet;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
    </div>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-sm text-muted-foreground">{children}</p>;
}
