import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import {
  AlertTriangle,
  Pill,
  Phone,
  Hospital,
  Heart,
  X,
  Copy,
  Share2,
  Download,
  Printer,
  Link2,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PatientAvatarImage } from "@/components/PatientAvatarImage";
import { cn } from "@/lib/utils";
import { formatAge } from "@/lib/age";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type EmergencyLink = {
  id: string;
  token: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

const EXPIRY_PRESETS: { label: string; hours: number | null }[] = [
  { label: "24 horas", hours: 24 },
  { label: "72 horas", hours: 72 },
  { label: "7 dias", hours: 24 * 7 },
  { label: "Sem expiração", hours: null },
];

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function EmergencyModal({ patientId, open, onOpenChange }: Props) {
  const qc = useQueryClient();

  const dataQ = useQuery({
    queryKey: ["emergency-modal", patientId],
    enabled: !!patientId && open,
    queryFn: async () => {
      const [patient, allergies, conditions, contacts, meds] = await Promise.all([
        supabase
          .from("patients")
          .select(
            "full_name, birth_date, blood_type, photo_url, insurance_name, insurance_number",
          )
          .eq("id", patientId)
          .maybeSingle(),
        supabase
          .from("patient_allergies")
          .select("id, name, severity")
          .eq("patient_id", patientId),
        supabase
          .from("patient_conditions")
          .select("id, name, status")
          .eq("patient_id", patientId)
          .eq("status", "active"),
        supabase
          .from("emergency_contacts")
          .select("id, name, phone, relation, priority")
          .eq("patient_id", patientId)
          .order("priority", { ascending: true }),
        supabase
          .from("medications")
          .select("id, name, dosage, frequency")
          .eq("patient_id", patientId)
          .eq("status", "active"),
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

  const linkQ = useQuery({
    queryKey: ["emergency-link", patientId],
    enabled: !!patientId && open,
    queryFn: async (): Promise<EmergencyLink | null> => {
      const { data, error } = await supabase
        .from("emergency_links")
        .select("id, token, expires_at, is_active, created_at")
        .eq("patient_id", patientId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as EmergencyLink | null) ?? null;
    },
  });

  const createM = useMutation({
    mutationFn: async (hours: number | null) => {
      const { data: userData } = await supabase.auth.getUser();
      const expires_at =
        hours === null ? null : new Date(Date.now() + hours * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from("emergency_links")
        .insert({
          patient_id: patientId,
          created_by: userData.user!.id,
          expires_at,
        })
        .select("id, token, expires_at, is_active, created_at")
        .single();
      if (error) throw error;
      return data as EmergencyLink;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emergency-link", patientId] });
      toast.success("Link de emergência gerado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateExpiryM = useMutation({
    mutationFn: async ({ id, hours }: { id: string; hours: number | null }) => {
      const expires_at =
        hours === null ? null : new Date(Date.now() + hours * 3600 * 1000).toISOString();
      const { error } = await supabase
        .from("emergency_links")
        .update({ expires_at })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emergency-link", patientId] });
      toast.success("Expiração atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const data = dataQ.data;
  const patient = data?.patient;
  const ageLabel = formatAge(patient?.birth_date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-screen max-h-screen w-screen max-w-none rounded-none border-0 bg-background p-0 sm:rounded-none"
      >
        <div className="flex h-full flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between bg-emergency px-4 py-3 pr-12 text-emergency-foreground">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-5 w-5" /> Emergência
            </div>
          </div>


          <Tabs defaultValue="resumo" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mx-4 mt-3 grid h-11 w-auto grid-cols-2">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="share">Compartilhar</TabsTrigger>
            </TabsList>

            <TabsContent
              value="resumo"
              className="mt-3 flex-1 overflow-y-auto px-4 pb-8"
            >
              {dataQ.isLoading ? (
                <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
              ) : (
                <div className="mx-auto max-w-2xl space-y-4">
                  {/* Identification */}
                  <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                    <Avatar className="h-16 w-16 border border-border">
                      <PatientAvatarImage
                        path={patient?.photo_url}
                        alt={patient?.full_name ?? ""}
                      />
                      <AvatarFallback className="bg-primary-soft text-lg font-semibold text-primary">
                        {initials(patient?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xl font-bold tracking-tight">
                        {patient?.full_name ?? "—"}
                      </p>
                      <p className="text-base text-muted-foreground">
                        {[ageLabel, patient?.blood_type && patient.blood_type !== "unknown"
                          ? patient.blood_type
                          : null]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Allergies */}
                  <Section
                    title="⚠ ALERGIAS"
                    tone="danger"
                    empty={!data?.allergies.length}
                    emptyText="Nenhuma alergia registrada"
                  >
                    <ul className="space-y-1.5">
                      {data?.allergies.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center justify-between text-base font-medium"
                        >
                          <span>• {a.name}</span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "uppercase",
                              a.severity === "high"
                                ? "bg-emergency text-emergency-foreground"
                                : "",
                            )}
                          >
                            {a.severity}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </Section>

                  {/* Active medications */}
                  <Section
                    title="💊 MEDICAMENTOS ATIVOS"
                    empty={!data?.meds.length}
                    emptyText="Nenhum medicamento ativo"
                  >
                    <ul className="space-y-1.5 text-base">
                      {data?.meds.map((m) => (
                        <li key={m.id}>
                          • <span className="font-semibold">{m.name}</span>
                          {m.dosage ? ` · ${m.dosage}` : ""}
                        </li>
                      ))}
                    </ul>
                  </Section>

                  {/* Insurance */}
                  {(patient?.insurance_name || patient?.insurance_number) && (
                    <Section title="🏥 CONVÊNIO">
                      <p className="text-base">
                        <span className="font-semibold">
                          {patient.insurance_name ?? "—"}
                        </span>
                        {patient.insurance_number && (
                          <span className="ml-2 font-mono">
                            · {patient.insurance_number}
                          </span>
                        )}
                      </p>
                    </Section>
                  )}

                  {/* Conditions */}
                  {data?.conditions.length ? (
                    <Section title="🧬 CONDIÇÕES ATIVAS">
                      <div className="flex flex-wrap gap-1.5">
                        {data.conditions.map((c) => (
                          <Badge key={c.id} variant="secondary">
                            {c.name}
                          </Badge>
                        ))}
                      </div>
                    </Section>
                  ) : null}

                  {/* Contacts */}
                  <Section
                    title="📞 CONTATOS DE EMERGÊNCIA"
                    empty={!data?.contacts.length}
                    emptyText="Nenhum contato cadastrado"
                  >
                    <ul className="space-y-3">
                      {data?.contacts.map((c) => (
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
                          <Button
                            asChild
                            className="h-12 w-full bg-emergency text-emergency-foreground hover:bg-emergency/90"
                          >
                            <a href={`tel:${c.phone.replace(/\s/g, "")}`}>
                              <Phone className="mr-2 h-5 w-5" /> Ligar agora
                            </a>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </Section>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="share"
              className="mt-3 flex-1 overflow-y-auto px-4 pb-8"
            >
              <ShareTab
                patientName={patient?.full_name ?? ""}
                link={linkQ.data ?? null}
                isLoading={linkQ.isLoading}
                onGenerate={(h) => createM.mutate(h)}
                isGenerating={createM.isPending}
                onUpdateExpiry={(h) =>
                  linkQ.data && updateExpiryM.mutate({ id: linkQ.data.id, hours: h })
                }
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  children,
  tone,
  empty,
  emptyText,
}: {
  title: string;
  children?: React.ReactNode;
  tone?: "danger";
  empty?: boolean;
  emptyText?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        tone === "danger"
          ? "border-emergency/40 bg-emergency-soft/40"
          : "border-border bg-card",
      )}
    >
      <p className="mb-2 text-sm font-bold tracking-wide">{title}</p>
      {empty ? (
        <p className="text-sm text-success">{emptyText ?? "—"}</p>
      ) : (
        children
      )}
    </div>
  );
}

function ShareTab({
  patientName,
  link,
  isLoading,
  onGenerate,
  isGenerating,
  onUpdateExpiry,
}: {
  patientName: string;
  link: EmergencyLink | null;
  isLoading: boolean;
  onGenerate: (hours: number | null) => void;
  isGenerating: boolean;
  onUpdateExpiry: (hours: number | null) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const url = useMemo(() => {
    if (!link) return "";
    return `${window.location.origin}/emergencia/${link.token}`;
  }, [link]);

  const [selectedPreset, setSelectedPreset] = useState<number | null>(24 * 7);

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Carregando…</p>;
  }

  if (!link) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-8 text-center">
        <Link2 className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Compartilhar dados de emergência</h3>
        <p className="text-sm text-muted-foreground">
          Gere um link público com as informações vitais. Qualquer pessoa com o link
          poderá ver alergias, medicamentos e contatos — sem precisar fazer login.
        </p>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Validade
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXPIRY_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setSelectedPreset(p.hours)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition",
                  selectedPreset === p.hours
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <Button
          size="lg"
          className="h-12 w-full"
          onClick={() => onGenerate(selectedPreset)}
          disabled={isGenerating}
        >
          {isGenerating ? "Gerando…" : "Gerar link de emergência"}
        </Button>
      </div>
    );
  }

  function copy() {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  }

  function shareWa() {
    const text = `Informações de emergência de ${patientName}: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function downloadPng() {
    const canvas = canvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `emergencia-${patientName.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  }

  function printQr() {
    const w = window.open("", "_blank", "width=600,height=700");
    if (!w) return;
    const canvas = canvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    const dataUrl = canvas?.toDataURL("image/png") ?? "";
    w.document.write(`<!doctype html><html><head><title>QR Emergência ${patientName}</title>
      <style>body{font-family:system-ui;text-align:center;padding:24px}
      img{width:300px;height:300px}</style></head>
      <body><h2>Emergência · ${patientName}</h2>
      <img src="${dataUrl}" alt="QR" />
      <p style="word-break:break-all;font-size:12px">${url}</p>
      <script>window.onload=()=>{window.print();}</script></body></html>`);
    w.document.close();
  }

  return (
    <div className="mx-auto max-w-md space-y-4 py-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
          Link público
        </p>
        <p className="break-all rounded-md bg-muted p-3 font-mono text-sm">{url}</p>
        {link.expires_at ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Expira em {new Date(link.expires_at).toLocaleString("pt-BR")}
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Sem expiração</p>
        )}
      </div>

      <div ref={canvasRef} className="flex justify-center rounded-2xl border border-border bg-card p-4">
        {/* Canvas for download/print */}
        <QRCodeCanvas value={url} size={240} includeMargin />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          Atualizar validade
        </p>
        <div className="flex flex-wrap gap-2">
          {EXPIRY_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onUpdateExpiry(p.hours)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-sm"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-11" onClick={copy}>
          <Copy className="mr-1.5 h-4 w-4" /> Copiar link
        </Button>
        <Button variant="outline" className="h-11" onClick={shareWa}>
          <Share2 className="mr-1.5 h-4 w-4" /> WhatsApp
        </Button>
        <Button variant="outline" className="h-11" onClick={downloadPng}>
          <Download className="mr-1.5 h-4 w-4" /> Baixar QR
        </Button>
        <Button variant="outline" className="h-11" onClick={printQr}>
          <Printer className="mr-1.5 h-4 w-4" /> Imprimir
        </Button>
      </div>
    </div>
  );
}
