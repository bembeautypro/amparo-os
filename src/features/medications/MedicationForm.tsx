import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";
import {
  FORM_OPTIONS,
  FREQ_OPTIONS,
  type FreqValue,
  type Medication,
  type ScheduleEntry,
} from "./types";
import { parseSchedule } from "./utils";
import { ScheduleField, defaultsForSlots } from "./ScheduleField";
import { PhotoUploader } from "./PhotoUploader";

type Props = {
  mode: "create" | "edit";
  familyId: string;
  patientId: string;
  existing?: Medication | null;
};

type FormState = {
  name: string;
  generic_name: string;
  dosage: string;
  form: string;
  photo_path: string | null;
  frequency: FreqValue | "";
  schedule: ScheduleEntry[];
  freqOther: string;
  start_date: Date;
  end_date: Date | null;
  prescriber: string;
  notes: string;
};

function emptyState(): FormState {
  return {
    name: "",
    generic_name: "",
    dosage: "",
    form: "",
    photo_path: null,
    frequency: "",
    schedule: [],
    freqOther: "",
    start_date: new Date(),
    end_date: null,
    prescriber: "",
    notes: "",
  };
}

function inferFreqFromExisting(m: Medication): {
  frequency: FreqValue | "";
  freqOther: string;
} {
  const raw = (m.frequency ?? "").trim();
  if (!raw) return { frequency: "", freqOther: "" };
  const match = FREQ_OPTIONS.find(
    (f) => f.value === raw || f.label === raw,
  );
  if (match) return { frequency: match.value, freqOther: "" };
  return { frequency: "outro", freqOther: raw };
}

function fromExisting(m: Medication): FormState {
  const inf = inferFreqFromExisting(m);
  return {
    name: m.name,
    generic_name: m.generic_name ?? "",
    dosage: m.dosage ?? "",
    form: m.form ?? "",
    photo_path: m.photo_path,
    frequency: inf.frequency,
    freqOther: inf.freqOther,
    schedule: parseSchedule(m.schedule),
    start_date: m.start_date ? new Date(m.start_date + "T00:00:00") : new Date(),
    end_date: m.end_date ? new Date(m.end_date + "T00:00:00") : null,
    prescriber: m.prescriber ?? "",
    notes: m.notes ?? "",
  };
}

function serializeForDb(s: FormState) {
  const freqDef = FREQ_OPTIONS.find((f) => f.value === s.frequency);
  const freqLabel = freqDef?.label ?? null;
  const scheduleEntries =
    freqDef?.slots && freqDef.slots > 0 ? s.schedule.slice(0, freqDef.slots) : null;
  // DB CHECK constraint requires { "times": [...] }
  const scheduleDb =
    scheduleEntries && scheduleEntries.length > 0
      ? { times: scheduleEntries.map((e) => e.time) }
      : null;
  return {
    name: s.name.trim(),
    generic_name: s.generic_name.trim() || null,
    dosage: s.dosage.trim() || null,
    form: s.form || null,
    photo_path: s.photo_path,
    frequency:
      s.frequency === "outro"
        ? s.freqOther.trim() || null
        : freqLabel,
    schedule: scheduleDb,
    start_date: format(s.start_date, "yyyy-MM-dd"),
    end_date: s.end_date ? format(s.end_date, "yyyy-MM-dd") : null,
    prescriber: s.prescriber.trim() || null,
    notes: s.notes.trim() || null,
  };
}

const TRACKED_FIELDS = [
  "name",
  "generic_name",
  "dosage",
  "form",
  "frequency",
  "schedule",
  "start_date",
  "end_date",
  "prescriber",
  "notes",
  "photo_path",
] as const;

export function MedicationForm({ mode, familyId, patientId, existing }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [state, setState] = useState<FormState>(() =>
    existing ? fromExisting(existing) : emptyState(),
  );

  // When frequency changes in create mode, seed schedule defaults
  useEffect(() => {
    if (mode !== "create") return;
    const def = FREQ_OPTIONS.find((f) => f.value === state.frequency);
    if (def && def.slots > 0 && state.schedule.length === 0) {
      setState((s) => ({ ...s, schedule: defaultsForSlots(def.slots) }));
    }
  }, [state.frequency, mode, state.schedule.length]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const save = useMutation({
    mutationFn: async () => {
      if (!state.name.trim()) throw new Error("Informe o nome do medicamento");
      if (!state.frequency) throw new Error("Selecione a frequência");
      const payload = serializeForDb(state);

      if (mode === "create") {
        const { data, error } = await supabase
          .from("medications")
          .insert({ patient_id: patientId, ...payload })
          .select("id")
          .single();
        if (error) throw error;
        return data.id as string;
      }

      if (!existing) throw new Error("Registro não encontrado");

      // Diff for change history
      const oldPayload = serializeForDb(fromExisting(existing));
      const diff: {
        field_changed: string;
        old_value: string | null;
        new_value: string | null;
      }[] = [];
      for (const field of TRACKED_FIELDS) {
        const oldV = (oldPayload as Record<string, unknown>)[field];
        const newV = (payload as Record<string, unknown>)[field];
        const oldStr = oldV == null ? null : JSON.stringify(oldV);
        const newStr = newV == null ? null : JSON.stringify(newV);
        if (oldStr !== newStr) {
          diff.push({
            field_changed: field,
            old_value: oldStr,
            new_value: newStr,
          });
        }
      }

      const { error } = await supabase
        .from("medications")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw error;

      if (diff.length > 0) {
        const { data: u } = await supabase.auth.getUser();
        const uid = u.user?.id;
        if (uid) {
          await supabase.from("medication_change_history").insert(
            diff.map((d) => ({
              medication_id: existing.id,
              field_changed: d.field_changed,
              old_value: d.old_value,
              new_value: d.new_value,
              changed_by: uid,
            })),
          );
        }
      }
      return existing.id;
    },
    onSuccess: (medId) => {
      toast.success(
        mode === "create" ? "Medicamento adicionado" : "Alterações salvas",
      );
      qc.invalidateQueries({ queryKey: ["medications"] });
      qc.invalidateQueries({ queryKey: ["medication", medId] });
      qc.invalidateQueries({ queryKey: ["dash"] });
      navigate(
        mode === "create"
          ? {
              to: "/familia/$familyId/medicamentos",
              params: { familyId },
            }
          : {
              to: "/familia/$familyId/medicamentos/$medId",
              params: { familyId, medId },
            },
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="border-border/70 p-6 shadow-soft">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-7"
      >
        <Section title="Identificação">
          <Field label="Nome do medicamento" required>
            <Input
              value={state.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ex: Losartana"
              className="h-11"
            />
          </Field>
          <Field label="Nome genérico / substituto">
            <Input
              value={state.generic_name}
              onChange={(e) => set("generic_name", e.target.value)}
              placeholder="Ex: Losartana potássica"
              className="h-11"
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Dosagem">
              <Input
                value={state.dosage}
                onChange={(e) => set("dosage", e.target.value)}
                placeholder="50mg, 10 gotas, 1 comprimido"
                className="h-11"
              />
            </Field>
            <Field label="Forma">
              <Select value={state.form} onValueChange={(v) => set("form", v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {FORM_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Foto da caixa ou receita">
            <PhotoUploader
              patientId={patientId}
              value={state.photo_path}
              onChange={(p) => set("photo_path", p)}
            />
          </Field>
        </Section>

        <SectionSep />

        <Section title="Posologia">
          <Field label="Frequência" required>
            <Select
              value={state.frequency}
              onValueChange={(v) => set("frequency", v as FreqValue)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {FREQ_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <ScheduleField
            frequency={state.frequency}
            schedule={state.schedule}
            freqOther={state.freqOther}
            onScheduleChange={(s) => set("schedule", s)}
            onFreqOtherChange={(s) => set("freqOther", s)}
          />
        </Section>

        <SectionSep />

        <Section title="Período">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Data de início">
              <DatePopover
                value={state.start_date}
                onChange={(d) => d && set("start_date", d)}
              />
            </Field>
            <Field label="Data de fim (opcional)">
              <DatePopover
                value={state.end_date}
                onChange={(d) => set("end_date", d)}
                clearable
              />
            </Field>
          </div>
          <Field label="Médico prescritor">
            <Input
              value={state.prescriber}
              onChange={(e) => set("prescriber", e.target.value)}
              placeholder="Dra. Ana Souza"
              className="h-11"
            />
          </Field>
        </Section>

        <SectionSep />

        <Section title="Observações">
          <Field label="Notas">
            <Textarea
              value={state.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Tomar com água, evitar sol..."
              rows={3}
            />
          </Field>
        </Section>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() =>
              navigate({
                to: "/familia/$familyId/medicamentos",
                params: { familyId },
              })
            }
          >
            Cancelar
          </Button>
          <Button type="submit" className="h-11" disabled={save.isPending}>
            {save.isPending
              ? "Salvando…"
              : mode === "create"
                ? "Salvar medicamento"
                : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SectionSep() {
  return <Separator className="my-1" />;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-emergency">*</span>}
      </Label>
      {children}
    </div>
  );
}

function DatePopover({
  value,
  onChange,
  clearable,
}: {
  value: Date | null;
  onChange: (d: Date | null) => void;
  clearable?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-11 w-full justify-start gap-2 font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {value ? format(value, "dd/MM/yyyy") : "Selecionar"}
          {clearable && value && (
            <span
              role="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(null);
              }}
              className="ml-auto text-xs text-muted-foreground underline"
            >
              limpar
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(d) => onChange(d ?? null)}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
