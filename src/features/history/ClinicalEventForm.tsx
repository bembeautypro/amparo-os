import { useState, type KeyboardEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { fetchAppointmentsForPatient } from "./api";
import {
  SEVERITY_META,
  TYPE_META,
  type ClinicalEvent,
  type ClinicalEventType,
  type Severity,
} from "./types";

type Props = {
  familyId: string;
  patientId: string;
  initial?: ClinicalEvent | null;
};

export function ClinicalEventForm({ familyId, patientId, initial }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [eventDate, setEventDate] = useState(
    (initial?.event_date ?? new Date().toISOString()).slice(0, 10),
  );
  const [type, setType] = useState<ClinicalEventType>(
    initial?.type ?? "consultation",
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [severity, setSeverity] = useState<Severity>(initial?.severity ?? "low");
  const [doctorName, setDoctorName] = useState(initial?.doctor_name ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [appointmentId, setAppointmentId] = useState(
    initial?.appointment_id ?? "",
  );
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const apptsQ = useQuery({
    queryKey: ["history-appts", patientId],
    enabled: !!patientId,
    queryFn: () => fetchAppointmentsForPatient(patientId),
  });

  const addTag = () => {
    const v = tagDraft.trim();
    if (!v) return;
    if (!tags.includes(v)) setTags((prev) => [...prev, v]);
    setTagDraft("");
  };
  const onTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !tagDraft && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = Array.from(e.dataTransfer.files ?? []);
    if (f.length) setFiles((prev) => [...prev, ...f]);
  };

  const mut = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Informe o título");
      if (!eventDate) throw new Error("Informe a data");

      const { data: u } = await supabase.auth.getUser();
      const payload = {
        patient_id: patientId,
        type,
        title: title.trim(),
        description: description.trim() || null,
        event_date: new Date(`${eventDate}T12:00:00`).toISOString(),
        severity,
        doctor_name: doctorName.trim() || null,
        tags,
        appointment_id: appointmentId || null,
      };

      let eventId: string;
      if (initial) {
        const { error } = await supabase
          .from("clinical_events")
          .update(payload)
          .eq("id", initial.id);
        if (error) throw error;
        eventId = initial.id;
      } else {
        const { data, error } = await supabase
          .from("clinical_events")
          .insert({ ...payload, created_by: u.user?.id ?? null })
          .select()
          .single();
        if (error) throw error;
        eventId = data.id;
      }

      for (const file of files) {
        if (file.size > 15 * 1024 * 1024) continue;
        const uploaded = await uploadDocumentFile({ familyId, patientId, file });
        const { error: docErr } = await supabase.from("documents").insert({
          patient_id: patientId,
          clinical_event_id: eventId,
          title: file.name,
          doc_type: "other",
          file_path: uploaded.path,
          mime_type: uploaded.mime_type,
          file_size: uploaded.file_size,
        });
        if (docErr) throw docErr;
      }
      return eventId;
    },
    onSuccess: (id) => {
      toast.success(initial ? "Evento atualizado" : "Evento registrado");
      qc.invalidateQueries({ queryKey: ["clinical_events"] });
      qc.invalidateQueries({ queryKey: ["event-docs", id] });
      navigate({
        to: "/familia/$familyId/historico/$id",
        params: { familyId, id },
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="border-border/70 p-5 shadow-soft">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Data do evento *</Label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as ClinicalEventType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_META.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Título *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>Descrição</Label>
          <Textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Gravidade</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SEVERITY_META.map((s) => {
              const active = severity === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value)}
                  className={cn(
                    "rounded-lg border px-3 py-3 text-sm font-medium transition",
                    s.btn,
                    active ? "ring-2 ring-offset-2 ring-foreground/40" : "opacity-80",
                  )}
                >
                  <span className="mr-1">{s.emoji}</span>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Médico relacionado</Label>
          <Input
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Tags</Label>
          <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5">
            {tags.map((t) => (
              <Badge key={t} variant="secondary" className="gap-1">
                {t}
                <button
                  type="button"
                  onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={onTagKey}
              onBlur={addTag}
              placeholder="Digite e Enter"
              className="min-w-[120px] flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Vincular à consulta</Label>
          <Select
            value={appointmentId}
            onValueChange={(v) =>
              setAppointmentId(v === "__none" ? "" : v)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Nenhuma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Nenhuma</SelectItem>
              {(apptsQ.data ?? []).map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.title} —{" "}
                  {new Date(a.scheduled_at).toLocaleDateString("pt-BR")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Documentos</Label>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground hover:bg-muted",
              dragOver && "border-primary bg-primary-soft/50",
            )}
          >
            <Upload className="h-5 w-5" />
            <span className="font-medium">
              <span className="sm:hidden">📷 Câmera · 🖼 Galeria · 📄 Arquivo</span>
              <span className="hidden sm:inline">
                Arraste arquivos ou clique para selecionar
              </span>
            </span>
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) =>
                setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])
              }
            />
          </label>
          {files.length > 0 && (
            <ul className="space-y-1 text-sm">
              {files.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5"
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate({ to: ".." as never })}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={mut.isPending}>
            {mut.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
