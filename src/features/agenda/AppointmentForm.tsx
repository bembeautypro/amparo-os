import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { uploadDocumentFile } from "@/features/documents/api";
import { fetchDoneAppointments } from "./api";
import { TYPE_OPTIONS, type Appointment, type AppointmentType } from "./types";

type Props = {
  familyId: string;
  patientId: string;
  initial?: Appointment | null;
  defaultType?: AppointmentType;
  parentAppointmentId?: string | null;
};

export function AppointmentForm({
  familyId,
  patientId,
  initial,
  defaultType,
  parentAppointmentId,
}: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [type, setType] = useState<AppointmentType>(
    initial?.type ?? defaultType ?? "consulta",
  );
  const [parentId, setParentId] = useState<string | "">(
    initial?.parent_appointment_id ?? parentAppointmentId ?? "",
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const initialDate = initial?.scheduled_at
    ? new Date(initial.scheduled_at)
    : null;
  const [date, setDate] = useState(
    initialDate ? initialDate.toISOString().slice(0, 10) : "",
  );
  const [time, setTime] = useState(
    initialDate
      ? initialDate.toTimeString().slice(0, 5)
      : "",
  );
  const [doctor, setDoctor] = useState(initial?.doctor_name ?? "");
  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [mapUrl, setMapUrl] = useState(initial?.map_url ?? "");
  const [responsibleId, setResponsibleId] = useState<string | "">(
    initial?.responsible_user_id ?? "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [files, setFiles] = useState<File[]>([]);

  const doneApptsQ = useQuery({
    queryKey: ["appointments", "done", patientId],
    enabled: type === "retorno" && !!patientId,
    queryFn: () => fetchDoneAppointments(patientId),
  });

  const membersQ = useQuery({
    queryKey: ["family-members", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("user_id, relation")
        .eq("family_id", familyId)
        .eq("status", "active");
      if (error) throw error;
      return data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Informe o título");
      if (!date || !time) throw new Error("Informe data e horário");

      const scheduled = new Date(`${date}T${time}:00`);
      const payload = {
        patient_id: patientId,
        type,
        title: title.trim(),
        scheduled_at: scheduled.toISOString(),
        doctor_name: doctor.trim() || null,
        specialty: specialty.trim() || null,
        location: location.trim() || null,
        address: address.trim() || null,
        map_url: mapUrl.trim() || null,
        responsible_user_id: responsibleId || null,
        notes: notes.trim() || null,
        parent_appointment_id: type === "retorno" ? parentId || null : null,
      };

      let apptId: string;
      if (initial) {
        const { error } = await supabase
          .from("appointments")
          .update(payload)
          .eq("id", initial.id);
        if (error) throw error;
        apptId = initial.id;
      } else {
        const { data, error } = await supabase
          .from("appointments")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        apptId = data.id;
      }

      // Upload attachments using the standardized helper
      // (path convention: {familyId}/{patientId}/{uuid}.{ext})
      for (const file of files) {
        if (file.size > 15 * 1024 * 1024) continue;
        const uploaded = await uploadDocumentFile({ familyId, patientId, file });
        const { error: docErr } = await supabase.from("documents").insert({
          patient_id: patientId,
          appointment_id: apptId,
          title: file.name,
          doc_type: "other",
          file_path: uploaded.path,
          mime_type: uploaded.mime_type,
          file_size: uploaded.file_size,
        });
        if (docErr) throw docErr;
      }

      return apptId;
    },
    onSuccess: (apptId) => {
      toast.success(initial ? "Compromisso atualizado" : "Compromisso criado");
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["documents"] });
      navigate({
        to: "/familia/$familyId/agenda/$id",
        params: { familyId, id: apptId },
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
          mutation.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as AppointmentType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.icon} {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {type === "retorno" && (
          <div className="space-y-1.5">
            <Label>Retorno de qual consulta?</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a consulta de origem" />
              </SelectTrigger>
              <SelectContent>
                {(doneApptsQ.data ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title} — {new Date(a.scheduled_at).toLocaleDateString("pt-BR")}
                  </SelectItem>
                ))}
                {(doneApptsQ.data ?? []).length === 0 && (
                  <SelectItem value="__none" disabled>
                    Nenhuma consulta realizada
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Título *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Data *</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Horário *</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Médico / Profissional</Label>
            <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Especialidade</Label>
            <Input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Local</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Endereço</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Link do mapa</Label>
          <Input
            type="url"
            placeholder="https://maps.google.com/..."
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Responsável por acompanhar</Label>
          <Select
            value={responsibleId}
            onValueChange={(v) => setResponsibleId(v === "__none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ninguém atribuído" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Ninguém atribuído</SelectItem>
              {(membersQ.data ?? []).map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.relation ?? "Membro"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Notas</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Documentos anexos</Label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground hover:bg-muted">
            <Upload className="h-4 w-4" />
            Anexar arquivos (PDF, imagens)
            <input
              type="file"
              multiple
              className="hidden"
              accept="application/pdf,image/*"
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
            onClick={() =>
              navigate({
                to: "/familia/$familyId/agenda",
                params: { familyId },
              })
            }
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
