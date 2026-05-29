import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  Camera,
  ImagePlus,
  Phone,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PatientAvatarImage } from "@/components/PatientAvatarImage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatAge } from "@/lib/age";
import { EmergencyModal } from "@/features/emergency/EmergencyModal";
import {
  fetchPatientProfile,
  logPatientUpdate,
  type Patient,
  type Allergy,
  type Condition,
  type EmergencyContact,
  type Severity,
  type ConditionStatus,
  type BloodType,
} from "./api";

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function relative(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return formatDistanceToNow(d, { locale: ptBR, addSuffix: true });
}

const BLOOD_TYPES: BloodType[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Crítica",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const SEVERITY_CLASSES: Record<Severity, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warn-soft text-warn border-warn/30",
  medium: "bg-warn-soft/60 text-warn border-warn/20",
  low: "bg-muted text-muted-foreground border-border",
};

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];

type Props = { familyId: string; patientId: string };

export function PatientProfile({ familyId, patientId }: Props) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["patient-profile", patientId],
    queryFn: () => fetchPatientProfile(patientId),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["patient-profile", patientId] });

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Carregando…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion
        type="multiple"
        defaultValue={["identification"]}
        className="space-y-3"
      >
        <IdentificationSection
          patient={data.patient}
          familyId={familyId}
          onSaved={invalidate}
        />
        <InsuranceSection
          patient={data.patient}
          familyId={familyId}
          onSaved={invalidate}
        />
        <AllergiesSection
          patientId={patientId}
          familyId={familyId}
          allergies={data.allergies}
          onSaved={invalidate}
        />
        <ConditionsSection
          patientId={patientId}
          familyId={familyId}
          conditions={data.conditions}
          onSaved={invalidate}
        />
        <ContactsSection
          patientId={patientId}
          familyId={familyId}
          contacts={data.contacts}
          onSaved={invalidate}
        />
        <EmergencyPreviewSection
          patient={data.patient}
          allergies={data.allergies}
          conditions={data.conditions}
          contacts={data.contacts}
          patientId={patientId}
        />
      </Accordion>
    </div>
  );
}

/* ───────────── Section header ───────────── */

function SectionHeader({
  title,
  updatedAt,
  editing,
  onEdit,
  hideEdit,
}: {
  title: string;
  updatedAt?: string | null;
  editing?: boolean;
  onEdit?: () => void;
  hideEdit?: boolean;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-3 pr-2">
      <div className="flex flex-col items-start text-left">
        <span className="text-base font-semibold tracking-tight">{title}</span>
        <span className="text-xs text-muted-foreground">
          Atualizado {relative(updatedAt)}
        </span>
      </div>
      {!hideEdit && !editing && onEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      )}
    </div>
  );
}

/* ───────────── 1. Identification ───────────── */

function IdentificationSection({
  patient,
  familyId,
  onSaved,
}: {
  patient: Patient;
  familyId: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: patient.full_name,
    birth_date: patient.birth_date ?? "",
    blood_type: patient.blood_type ?? ("unknown" as BloodType),
    height_cm: patient.height_cm?.toString() ?? "",
    weight_kg: patient.weight_kg?.toString() ?? "",
    critical_notes: patient.critical_notes ?? "",
  });
  const [photoPath, setPhotoPath] = useState<string | null>(patient.photo_url);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setForm({
      full_name: patient.full_name,
      birth_date: patient.birth_date ?? "",
      blood_type: patient.blood_type ?? ("unknown" as BloodType),
      height_cm: patient.height_cm?.toString() ?? "",
      weight_kg: patient.weight_kg?.toString() ?? "",
      critical_notes: patient.critical_notes ?? "",
    });
    setPhotoPath(patient.photo_url);
  };

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("patients")
        .update({
          full_name: form.full_name.trim(),
          birth_date: form.birth_date || null,
          blood_type: form.blood_type,
          height_cm: form.height_cm ? Number(form.height_cm) : null,
          weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
          critical_notes: form.critical_notes.trim() || null,
          photo_url: photoPath,
        })
        .eq("id", patient.id);
      if (error) throw error;
      await logPatientUpdate(patient.id, familyId, {
        section: "identification",
      });
    },
    onSuccess: () => {
      toast.success("Identificação atualizada");
      setEditing(false);
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${familyId}/${patient.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("patient-photos")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      setPhotoPath(path);
      if (!editing) {
        const { error: e2 } = await supabase
          .from("patients")
          .update({ photo_url: path })
          .eq("id", patient.id);
        if (e2) throw e2;
        await logPatientUpdate(patient.id, familyId, { section: "photo" });
        toast.success("Foto atualizada");
        onSaved();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <AccordionItem value="identification" className="rounded-card border bg-card">
      <AccordionTrigger className="px-5 py-4 hover:no-underline">
        <SectionHeader
          title="Identificação"
          updatedAt={patient.updated_at}
          editing={editing}
          onEdit={() => setEditing(true)}
        />
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-5">
        <div className="flex flex-col items-center gap-3 pb-4 sm:flex-row sm:items-start sm:gap-5">
          <div className="relative">
            <Avatar className="h-[100px] w-[100px] border-2 border-border">
              <PatientAvatarImage path={photoPath} alt={patient.full_name} />
              <AvatarFallback className="text-xl">
                {initials(patient.full_name)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 rounded-full border bg-background p-2 shadow-sm hover:bg-muted"
              aria-label="Trocar foto"
            >
              {uploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadPhoto(f);
                e.target.value = "";
              }}
            />
          </div>
          {!editing && (
            <div className="text-center sm:text-left">
              <p className="text-xl font-semibold">{patient.full_name}</p>
              {patient.birth_date && (
                <p className="text-sm text-muted-foreground">
                  {formatAge(patient.birth_date)} ·{" "}
                  {format(new Date(patient.birth_date), "dd/MM/yyyy")}
                </p>
              )}
              {patient.blood_type && patient.blood_type !== "unknown" && (
                <Badge variant="outline" className="mt-2">
                  Sangue {patient.blood_type}
                </Badge>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nome completo</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Data de nascimento</Label>
              <Input
                type="date"
                value={form.birth_date}
                onChange={(e) =>
                  setForm({ ...form, birth_date: e.target.value })
                }
              />
              {form.birth_date && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatAge(form.birth_date)}
                </p>
              )}
            </div>
            <div>
              <Label>Tipo sanguíneo</Label>
              <Select
                value={form.blood_type}
                onValueChange={(v) =>
                  setForm({ ...form, blood_type: v as BloodType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Não sei</SelectItem>
                  {BLOOD_TYPES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Altura (cm)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={form.height_cm}
                onChange={(e) =>
                  setForm({ ...form, height_cm: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={form.weight_kg}
                onChange={(e) =>
                  setForm({ ...form, weight_kg: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Observações críticas</Label>
              <Textarea
                rows={3}
                value={form.critical_notes}
                onChange={(e) =>
                  setForm({ ...form, critical_notes: e.target.value })
                }
                placeholder="Ex.: marca-passo, anticoagulante, restrições importantes…"
              />
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button
                variant="ghost"
                onClick={() => {
                  reset();
                  setEditing(false);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Altura" value={patient.height_cm ? `${patient.height_cm} cm` : "—"} />
            <Field label="Peso" value={patient.weight_kg ? `${patient.weight_kg} kg` : "—"} />
            {patient.critical_notes && (
              <div className="sm:col-span-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Observações críticas
                </p>
                <p className="text-sm">{patient.critical_notes}</p>
              </div>
            )}
          </dl>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

/* ───────────── 2. Insurance ───────────── */

function InsuranceSection({
  patient,
  familyId,
  onSaved,
}: {
  patient: Patient;
  familyId: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    insurance_name: patient.insurance_name ?? "",
    insurance_number: patient.insurance_number ?? "",
    preferred_hospital: patient.preferred_hospital ?? "",
    primary_doctor: patient.primary_doctor ?? "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("patients")
        .update({
          insurance_name: form.insurance_name.trim() || null,
          insurance_number: form.insurance_number.trim() || null,
          preferred_hospital: form.preferred_hospital.trim() || null,
          primary_doctor: form.primary_doctor.trim() || null,
        })
        .eq("id", patient.id);
      if (error) throw error;
      await logPatientUpdate(patient.id, familyId, { section: "insurance" });
    },
    onSuccess: () => {
      toast.success("Convênio atualizado");
      setEditing(false);
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AccordionItem value="insurance" className="rounded-card border bg-card">
      <AccordionTrigger className="px-5 py-4 hover:no-underline">
        <SectionHeader
          title="Convênio e hospital"
          updatedAt={patient.updated_at}
          editing={editing}
          onEdit={() => setEditing(true)}
        />
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-5">
        {editing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Convênio</Label>
              <Input
                value={form.insurance_name}
                onChange={(e) =>
                  setForm({ ...form, insurance_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Número da carteirinha</Label>
              <Input
                value={form.insurance_number}
                onChange={(e) =>
                  setForm({ ...form, insurance_number: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Hospital de preferência</Label>
              <Input
                value={form.preferred_hospital}
                onChange={(e) =>
                  setForm({ ...form, preferred_hospital: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Médico principal</Label>
              <Input
                value={form.primary_doctor}
                onChange={(e) =>
                  setForm({ ...form, primary_doctor: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setForm({
                    insurance_name: patient.insurance_name ?? "",
                    insurance_number: patient.insurance_number ?? "",
                    preferred_hospital: patient.preferred_hospital ?? "",
                    primary_doctor: patient.primary_doctor ?? "",
                  });
                  setEditing(false);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Convênio" value={patient.insurance_name ?? "—"} />
            <Field label="Carteirinha" value={patient.insurance_number ?? "—"} />
            <Field
              label="Hospital de preferência"
              value={patient.preferred_hospital ?? "—"}
            />
            <Field label="Médico principal" value={patient.primary_doctor ?? "—"} />
          </dl>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

/* ───────────── 3. Allergies ───────────── */

function AllergiesSection({
  patientId,
  familyId,
  allergies,
  onSaved,
}: {
  patientId: string;
  familyId: string;
  allergies: Allergy[];
  onSaved: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState<Severity>("high");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSeverity, setEditSeverity] = useState<Severity>("high");
  const [confirmDelete, setConfirmDelete] = useState<Allergy | null>(null);

  const lastUpdated = allergies[0]?.created_at ?? null;

  const add = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Informe o nome da alergia");
      const { error } = await supabase
        .from("patient_allergies")
        .insert({ patient_id: patientId, name: name.trim(), severity });
      if (error) throw error;
      await logPatientUpdate(patientId, familyId, {
        section: "allergies",
        op: "add",
      });
    },
    onSuccess: () => {
      toast.success("Alergia adicionada");
      setName("");
      setSeverity("high");
      setAdding(false);
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSev = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("patient_allergies")
        .update({ severity: editSeverity })
        .eq("id", id);
      if (error) throw error;
      await logPatientUpdate(patientId, familyId, {
        section: "allergies",
        op: "update",
      });
    },
    onSuccess: () => {
      setEditingId(null);
      onSaved();
      toast.success("Atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("patient_allergies")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await logPatientUpdate(patientId, familyId, {
        section: "allergies",
        op: "delete",
      });
    },
    onSuccess: () => {
      setConfirmDelete(null);
      onSaved();
      toast.success("Removida");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AccordionItem value="allergies" className="rounded-card border bg-card">
      <AccordionTrigger className="px-5 py-4 hover:no-underline">
        <SectionHeader
          title={`Alergias (${allergies.length})`}
          updatedAt={lastUpdated}
          hideEdit
        />
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-5">
        <div className="space-y-2">
          {allergies.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma alergia registrada.
            </p>
          )}
          {allergies.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2"
            >
              {editingId === a.id ? (
                <>
                  <div className="flex-1">
                    <p className="font-medium">{a.name}</p>
                    <Select
                      value={editSeverity}
                      onValueChange={(v) => setEditSeverity(v as Severity)}
                    >
                      <SelectTrigger className="mt-1 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEVERITIES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {SEVERITY_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateSev.mutate(a.id)}
                      disabled={updateSev.isPending}
                    >
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setConfirmDelete(a)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-1 items-center gap-2">
                    <span className="font-medium">{a.name}</span>
                    <Badge
                      variant="outline"
                      className={cn("border", SEVERITY_CLASSES[a.severity])}
                    >
                      {SEVERITY_LABEL[a.severity]}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(a.id);
                      setEditSeverity(a.severity);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}

          {adding ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
                <Input
                  placeholder="Nome da alergia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                <Select
                  value={severity}
                  onValueChange={(v) => setSeverity(v as Severity)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SEVERITY_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAdding(false);
                    setName("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => add.mutate()}
                  disabled={add.isPending}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="mt-2 w-full gap-1.5"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-4 w-4" />
              Adicionar alergia
            </Button>
          )}
        </div>

        <AlertDialog
          open={!!confirmDelete}
          onOpenChange={(o) => !o && setConfirmDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover alergia?</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDelete?.name} será removida permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  confirmDelete && remove.mutate(confirmDelete.id)
                }
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AccordionContent>
    </AccordionItem>
  );
}

/* ───────────── 4. Conditions ───────────── */

function ConditionsSection({
  patientId,
  familyId,
  conditions,
  onSaved,
}: {
  patientId: string;
  familyId: string;
  conditions: Condition[];
  onSaved: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    status: ConditionStatus;
    diagnosed_at: string;
  }>({ name: "", status: "active", diagnosed_at: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    status: ConditionStatus;
    diagnosed_at: string;
  }>({ name: "", status: "active", diagnosed_at: "" });

  const lastUpdated = conditions[0]?.created_at ?? null;

  const add = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Informe a condição");
      const { error } = await supabase.from("patient_conditions").insert({
        patient_id: patientId,
        name: form.name.trim(),
        status: form.status,
        diagnosed_at: form.diagnosed_at || null,
      });
      if (error) throw error;
      await logPatientUpdate(patientId, familyId, {
        section: "conditions",
        op: "add",
      });
    },
    onSuccess: () => {
      toast.success("Condição adicionada");
      setForm({ name: "", status: "active", diagnosed_at: "" });
      setAdding(false);
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("patient_conditions")
        .update({
          name: editForm.name.trim(),
          status: editForm.status,
          diagnosed_at: editForm.diagnosed_at || null,
        })
        .eq("id", id);
      if (error) throw error;
      await logPatientUpdate(patientId, familyId, {
        section: "conditions",
        op: "update",
      });
    },
    onSuccess: () => {
      setEditingId(null);
      onSaved();
      toast.success("Atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AccordionItem value="conditions" className="rounded-card border bg-card">
      <AccordionTrigger className="px-5 py-4 hover:no-underline">
        <SectionHeader
          title={`Condições médicas (${conditions.length})`}
          updatedAt={lastUpdated}
          hideEdit
        />
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-5">
        <div className="space-y-2">
          {conditions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma condição registrada.
            </p>
          )}
          {conditions.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border bg-background px-3 py-2"
            >
              {editingId === c.id ? (
                <div className="grid gap-2">
                  <Input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Select
                      value={editForm.status}
                      onValueChange={(v) =>
                        setEditForm({
                          ...editForm,
                          status: v as ConditionStatus,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="inactive">Inativa</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={editForm.diagnosed_at}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          diagnosed_at: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => update.mutate(c.id)}
                      disabled={update.isPending}
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <span className="font-medium">{c.name}</span>
                    <Badge
                      variant="outline"
                      className={
                        c.status === "active"
                          ? "border-success/30 bg-success-soft text-success"
                          : "border-border bg-muted text-muted-foreground"
                      }
                    >
                      {c.status === "active" ? "Ativa" : "Inativa"}
                    </Badge>
                    {c.diagnosed_at && (
                      <span className="text-xs text-muted-foreground">
                        Diagnóstico{" "}
                        {format(new Date(c.diagnosed_at), "dd/MM/yyyy")}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditForm({
                        name: c.name,
                        status: c.status,
                        diagnosed_at: c.diagnosed_at ?? "",
                      });
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {adding ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-3">
              <div className="grid gap-2">
                <Input
                  placeholder="Nome da condição (ex.: Hipertensão)"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm({ ...form, status: v as ConditionStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="inactive">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    placeholder="Diagnóstico"
                    value={form.diagnosed_at}
                    onChange={(e) =>
                      setForm({ ...form, diagnosed_at: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAdding(false);
                      setForm({ name: "", status: "active", diagnosed_at: "" });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => add.mutate()}
                    disabled={add.isPending}
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="mt-2 w-full gap-1.5"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-4 w-4" />
              Adicionar condição
            </Button>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/* ───────────── 5. Emergency contacts ───────────── */

function ContactsSection({
  patientId,
  familyId,
  contacts,
  onSaved,
}: {
  patientId: string;
  familyId: string;
  contacts: EmergencyContact[];
  onSaved: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    name: "",
    relation: "",
    phone: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    relation: "",
    phone: "",
  });

  const lastUpdated = contacts[0]?.created_at ?? null;

  const add = useMutation({
    mutationFn: async () => {
      if (!form.name.trim() || !form.phone.trim())
        throw new Error("Nome e telefone obrigatórios");
      const nextPriority = (contacts.at(-1)?.priority ?? 0) + 1;
      const { error } = await supabase.from("emergency_contacts").insert({
        patient_id: patientId,
        name: form.name.trim(),
        relation: form.relation.trim() || null,
        phone: form.phone.trim(),
        priority: nextPriority,
      });
      if (error) throw error;
      await logPatientUpdate(patientId, familyId, {
        section: "contacts",
        op: "add",
      });
    },
    onSuccess: () => {
      toast.success("Contato adicionado");
      setForm({ name: "", relation: "", phone: "" });
      setAdding(false);
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("emergency_contacts")
        .update({
          name: editForm.name.trim(),
          relation: editForm.relation.trim() || null,
          phone: editForm.phone.trim(),
        })
        .eq("id", id);
      if (error) throw error;
      await logPatientUpdate(patientId, familyId, {
        section: "contacts",
        op: "update",
      });
    },
    onSuccess: () => {
      setEditingId(null);
      onSaved();
      toast.success("Atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("emergency_contacts")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await logPatientUpdate(patientId, familyId, {
        section: "contacts",
        op: "delete",
      });
    },
    onSuccess: () => {
      onSaved();
      toast.success("Removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: async ({ index, dir }: { index: number; dir: -1 | 1 }) => {
      const target = index + dir;
      if (target < 0 || target >= contacts.length) return;
      const a = contacts[index];
      const b = contacts[target];
      const { error: e1 } = await supabase
        .from("emergency_contacts")
        .update({ priority: b.priority })
        .eq("id", a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("emergency_contacts")
        .update({ priority: a.priority })
        .eq("id", b.id);
      if (e2) throw e2;
      await logPatientUpdate(patientId, familyId, {
        section: "contacts",
        op: "reorder",
      });
    },
    onSuccess: () => onSaved(),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AccordionItem value="contacts" className="rounded-card border bg-card">
      <AccordionTrigger className="px-5 py-4 hover:no-underline">
        <SectionHeader
          title={`Contatos de emergência (${contacts.length})`}
          updatedAt={lastUpdated}
          hideEdit
        />
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-5">
        <div className="space-y-2">
          {contacts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum contato cadastrado.
            </p>
          )}
          {contacts.map((c, i) => (
            <div
              key={c.id}
              className="rounded-lg border bg-background px-3 py-2"
            >
              {editingId === c.id ? (
                <div className="grid gap-2">
                  <Input
                    placeholder="Nome"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Relação"
                      value={editForm.relation}
                      onChange={(e) =>
                        setEditForm({ ...editForm, relation: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Telefone"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex justify-between gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => remove.mutate(c.id)}
                    >
                      <Trash2 className="h-4 w-4" /> Remover
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => update.mutate(c.id)}
                        disabled={update.isPending}
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      disabled={i === 0 || move.isPending}
                      onClick={() => move.mutate({ index: i, dir: -1 })}
                      aria-label="Mover para cima"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      disabled={i === contacts.length - 1 || move.isPending}
                      onClick={() => move.mutate({ index: i, dir: 1 })}
                      aria-label="Mover para baixo"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.relation || "—"} · {c.phone}
                    </p>
                  </div>
                  <a href={`tel:${c.phone}`}>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Ligar
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditForm({
                        name: c.name,
                        relation: c.relation ?? "",
                        phone: c.phone,
                      });
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {adding ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-3">
              <div className="grid gap-2">
                <Input
                  placeholder="Nome"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Relação (ex.: filha)"
                    value={form.relation}
                    onChange={(e) =>
                      setForm({ ...form, relation: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Telefone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAdding(false);
                      setForm({ name: "", relation: "", phone: "" });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => add.mutate()}
                    disabled={add.isPending}
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="mt-2 w-full gap-1.5"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-4 w-4" />
              Adicionar contato
            </Button>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/* ───────────── 6. Emergency preview ───────────── */

function EmergencyPreviewSection({
  patient,
  allergies,
  conditions,
  contacts,
  patientId,
}: {
  patient: Patient;
  allergies: Allergy[];
  conditions: Condition[];
  contacts: EmergencyContact[];
  patientId: string;
}) {
  const [open, setOpen] = useState(false);
  const activeConditions = conditions.filter((c) => c.status === "active");

  return (
    <AccordionItem value="emergency-preview" className="rounded-card border bg-card">
      <AccordionTrigger className="px-5 py-4 hover:no-underline">
        <SectionHeader title="Prévia de emergência" hideEdit />
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-5">
        <p className="mb-3 text-xs text-muted-foreground">
          Este é exatamente o conteúdo que aparece para quem abre seu link público
          de emergência.
        </p>
        <div className="rounded-card border border-destructive/30 bg-destructive/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-destructive">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Emergência médica
            </span>
          </div>
          <p className="text-lg font-semibold">{patient.full_name}</p>
          <p className="text-sm text-muted-foreground">
            {patient.birth_date && `${formatAge(patient.birth_date)} · `}
            {patient.blood_type && patient.blood_type !== "unknown"
              ? `Sangue ${patient.blood_type}`
              : "Sangue não informado"}
          </p>

          <PreviewBlock title="Alergias">
            {allergies.length ? (
              <ul className="space-y-1 text-sm">
                {allergies.map((a) => (
                  <li key={a.id} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        a.severity === "critical" || a.severity === "high"
                          ? "bg-destructive"
                          : "bg-warn",
                      )}
                    />
                    {a.name} · {SEVERITY_LABEL[a.severity]}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma</p>
            )}
          </PreviewBlock>

          <PreviewBlock title="Condições ativas">
            {activeConditions.length ? (
              <ul className="list-disc pl-5 text-sm">
                {activeConditions.map((c) => (
                  <li key={c.id}>{c.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma</p>
            )}
          </PreviewBlock>

          <PreviewBlock title="Contatos">
            {contacts.length ? (
              <ul className="space-y-1 text-sm">
                {contacts.slice(0, 3).map((c) => (
                  <li key={c.id}>
                    {c.name} ({c.relation || "—"}) · {c.phone}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum</p>
            )}
          </PreviewBlock>

          {patient.preferred_hospital && (
            <PreviewBlock title="Hospital de preferência">
              <p className="text-sm">{patient.preferred_hospital}</p>
            </PreviewBlock>
          )}
        </div>

        <Button
          className="mt-3 w-full"
          variant="outline"
          onClick={() => setOpen(true)}
        >
          Abrir tela de emergência
        </Button>

        <EmergencyModal
          patientId={patientId}
          open={open}
          onOpenChange={setOpen}
        />
      </AccordionContent>
    </AccordionItem>
  );
}

function PreviewBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3 border-t border-destructive/15 pt-3">
      <p className="mb-1 text-xs font-semibold uppercase text-destructive/80">
        {title}
      </p>
      {children}
    </div>
  );
}
