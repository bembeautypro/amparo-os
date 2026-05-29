import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Phone, ShieldCheck, Pill, Heart, Hospital } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatAge } from "@/lib/age";

type EmergencyData = {
  link: { created_at: string; expires_at: string | null };
  patient: {
    id: string;
    full_name: string;
    birth_date: string | null;
    blood_type: string | null;
    photo_url: string | null;
    insurance_name: string | null;
    insurance_number: string | null;
  } | null;
  allergies: { id: string; name: string; severity: string }[];
  conditions: { id: string; name: string; status: string }[];
  contacts: {
    id: string;
    name: string;
    phone: string;
    relation: string | null;
    priority: number;
  }[];
  medications: { id: string; name: string; dosage: string | null; frequency: string | null }[];
};

export const Route = createFileRoute("/emergencia/$token")({
  component: PublicEmergencyPage,
});

function PublicEmergencyPage() {
  const { token } = useParams({ from: "/emergencia/$token" });

  const q = useQuery({
    queryKey: ["public-emergency", token],
    queryFn: async (): Promise<EmergencyData> => {
      const { data, error } = await supabase.functions.invoke("log-emergency-access", {
        body: { token },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) {
        throw new Error((data as { error: string }).error);
      }
      return data as EmergencyData;
    },
    retry: false,
  });

  if (q.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Carregando informações…</p>
      </div>
    );
  }

  if (q.error || !q.data) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-sm space-y-3 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-emergency" />
          <h1 className="text-xl font-semibold">Link expirado ou inválido</h1>
          <p className="text-sm text-muted-foreground">
            Solicite um novo link de emergência ao familiar responsável pelo paciente.
          </p>
        </div>
      </div>
    );
  }

  const d = q.data;
  const p = d.patient;
  const ageLabel = formatAge(p?.birth_date);

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Banner */}
      <header className="bg-emergency px-4 py-5 text-emergency-foreground">
        <div className="mx-auto max-w-2xl">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
            <AlertTriangle className="h-5 w-5" /> Informações de emergência
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight md:text-3xl">
            {p?.full_name ?? "—"}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 pt-5">
        {/* Identification */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-4">
            {p?.photo_url ? (
              <PhotoCircle path={p.photo_url} alt={p.full_name} />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-xl font-bold text-primary">
                {(p?.full_name ?? "?").slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-base text-muted-foreground">
                {ageLabel ?? "Idade não informada"}
              </p>
              {p?.blood_type && p.blood_type !== "unknown" && (
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emergency px-3 py-1 text-base font-bold text-emergency-foreground">
                  🩸 {p.blood_type}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Allergies — critical, displayed first */}
        <section
          className="rounded-2xl border-2 border-emergency p-4"
          style={{ backgroundColor: "color-mix(in oklab, var(--emergency) 10%, var(--background))" }}
        >
          <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-emergency">
            <AlertTriangle className="h-5 w-5" /> ALERGIAS
          </h2>
          {d.allergies.length === 0 ? (
            <p className="text-base font-medium text-success">
              ✓ Nenhuma alergia registrada
            </p>
          ) : (
            <ul className="space-y-1.5 text-lg">
              {d.allergies.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <span className="font-semibold">• {a.name}</span>
                  <span className="rounded-full bg-emergency px-2.5 py-0.5 text-xs font-bold uppercase text-emergency-foreground">
                    {a.severity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Active medications */}
        <Section title="Medicamentos ativos" icon={<Pill className="h-5 w-5" />}>
          {d.medications.length === 0 ? (
            <p className="text-base text-muted-foreground">Nenhum medicamento ativo.</p>
          ) : (
            <ul className="space-y-1.5 text-base">
              {d.medications.map((m) => (
                <li key={m.id}>
                  • <span className="font-semibold">{m.name}</span>
                  {m.dosage ? ` · ${m.dosage}` : ""}
                  {m.frequency ? ` · ${m.frequency}` : ""}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Conditions */}
        {d.conditions.length > 0 && (
          <Section title="Condições médicas" icon={<Heart className="h-5 w-5" />}>
            <ul className="space-y-1.5 text-base">
              {d.conditions.map((c) => (
                <li key={c.id}>• {c.name}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Insurance */}
        {(p?.insurance_name || p?.insurance_number) && (
          <Section title="Convênio" icon={<ShieldCheck className="h-5 w-5" />}>
            <p className="text-lg font-semibold">{p.insurance_name ?? "—"}</p>
            {p.insurance_number && (
              <p className="mt-1 break-all font-mono text-xl">{p.insurance_number}</p>
            )}
          </Section>
        )}

        {/* Contacts */}
        {d.contacts.length > 0 && (
          <Section
            title="Contatos de emergência"
            icon={<Phone className="h-5 w-5" />}
          >
            <ul className="space-y-3">
              {d.contacts.map((c) => (
                <li key={c.id} className="space-y-2">
                  <div>
                    <p className="text-base font-semibold">
                      {c.name}{" "}
                      {c.relation && (
                        <span className="font-normal text-muted-foreground">
                          ({c.relation})
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-sm text-muted-foreground">
                      {c.phone}
                    </p>
                  </div>
                  <a
                    href={`tel:${c.phone.replace(/\s/g, "")}`}
                    className="grid h-12 w-full place-items-center rounded-xl bg-emergency text-base font-bold text-emergency-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <Phone className="h-5 w-5" /> Ligar agora
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Footer */}
        <footer className="space-y-2 pt-6 text-center text-xs text-muted-foreground">
          <p>
            Gerado via Amparo · {new Date(d.link.created_at).toLocaleString("pt-BR")}
          </p>
          <p className="px-4">
            Este resumo é para uso emergencial. Não substitui avaliação médica.
          </p>
        </footer>
      </main>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

function PhotoCircle({ path, alt }: { path: string; alt: string }) {
  // Public page can't get signed URL for private bucket; show fallback initials.
  // (Patient photos live in a private bucket; rendering them publicly would
  // require a separate signed-URL flow via the edge function.)
  return (
    <div className="grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-xl font-bold text-primary">
      {alt.slice(0, 1).toUpperCase()}
    </div>
  );
}
