import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  CheckCircle2,
  Edit,
  FileText,
  MapPin,
  RotateCw,
  User2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  fetchAppointment,
  fetchAppointmentDocuments,
  markAppointmentDone,
} from "./api";
import {
  typeMeta,
  statusBadgeClass,
  statusLabel,
  type ClinicalEvent,
} from "./types";

const EVENT_TYPES: Array<{ value: ClinicalEvent["type"]; label: string }> = [
  { value: "consultation", label: "Consulta" },
  { value: "exam_result", label: "Resultado de exame" },
  { value: "procedure", label: "Procedimento" },
  { value: "diagnosis", label: "Diagnóstico" },
  { value: "vaccination", label: "Vacinação" },
  { value: "hospitalization", label: "Internação" },
  { value: "other", label: "Outro" },
];

type Props = {
  familyId: string;
  appointmentId: string;
};

export function AppointmentDetail({ familyId, appointmentId }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);

  const apptQ = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: () => fetchAppointment(appointmentId),
  });
  const docsQ = useQuery({
    queryKey: ["appointment-docs", appointmentId],
    queryFn: () => fetchAppointmentDocuments(appointmentId),
  });

  const doneMut = useMutation({
    mutationFn: async () => {
      if (!apptQ.data) throw new Error("Compromisso não encontrado");
      return markAppointmentDone(apptQ.data);
    },
    onSuccess: () => {
      toast.success("Consulta registrada no histórico ✓");
      qc.invalidateQueries({ queryKey: ["appointment", appointmentId] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      setConfirmOpen(false);
      setShowBanner(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (apptQ.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }
  if (!apptQ.data) {
    return <p className="text-sm text-muted-foreground">Não encontrado.</p>;
  }
  const a = apptQ.data;
  const meta = typeMeta(a.type);
  const d = parseISO(a.scheduled_at);

  const openMap = () => {
    if (a.map_url) {
      window.open(a.map_url, "_blank", "noopener,noreferrer");
    } else if (a.address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.address)}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
          <Link to="/familia/$familyId/agenda" params={{ familyId }}>
            <ArrowLeft className="h-4 w-4" /> Agenda
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link
            to="/familia/$familyId/agenda/$id/editar"
            params={{ familyId, id: a.id }}
          >
            <Edit className="h-4 w-4" /> Editar
          </Link>
        </Button>
      </div>

      <Card className="space-y-3 border-border/70 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-2xl">
            {meta.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold leading-tight">{a.title}</h1>
              <Badge
                variant="outline"
                className={statusBadgeClass(a.status)}
              >
                {statusLabel(a.status)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground capitalize">
              {format(d, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          {a.specialty && <Field label="Especialidade" value={a.specialty} />}
          {a.doctor_name && (
            <Field
              label="Profissional"
              value={a.doctor_name}
              icon={<User2 className="h-3.5 w-3.5" />}
            />
          )}
          {a.location && <Field label="Local" value={a.location} />}
          {a.address && (
            <Field
              label="Endereço"
              value={
                <button
                  onClick={openMap}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <MapPin className="h-3.5 w-3.5" /> {a.address}
                </button>
              }
            />
          )}
        </div>

        {a.notes && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              Notas
            </p>
            <p className="whitespace-pre-wrap text-sm">{a.notes}</p>
          </div>
        )}
      </Card>

      <Card className="border-border/70 p-5 shadow-soft">
        <h2 className="mb-3 text-sm font-semibold">Documentos anexos</h2>
        {docsQ.isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : (docsQ.data ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum documento anexado.</p>
        ) : (
          <ul className="space-y-1.5">
            {(docsQ.data ?? []).map((doc) => (
              <DocLink key={doc.id} doc={doc} />
            ))}
          </ul>
        )}
      </Card>

      {showBanner && (
        <Card className="flex items-start justify-between gap-3 border-primary/30 bg-primary-soft p-4 shadow-soft">
          <div className="flex-1">
            <p className="text-sm font-medium">
              Quer registrar as orientações médicas desta consulta?
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Você pode anotar agora ou depois.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setShowEventForm(true)}>
                Registrar agora
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowBanner(false)}
              >
                Agora não
              </Button>
            </div>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </Card>
      )}

      {showEventForm && (
        <ClinicalEventInlineForm
          patientId={a.patient_id}
          appointmentId={a.id}
          defaultTitle={a.title}
          onDone={() => {
            setShowEventForm(false);
            setShowBanner(false);
          }}
        />
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {a.status !== "done" && (
          <Button
            className="h-12 gap-2"
            onClick={() => setConfirmOpen(true)}
          >
            <CheckCircle2 className="h-4 w-4" />
            Marcar como realizado
          </Button>
        )}
        <Button
          variant="outline"
          className="h-12 gap-2"
          onClick={() =>
            navigate({
              to: "/familia/$familyId/agenda/novo",
              params: { familyId },
              search: { type: "retorno", parent: a.id },
            })
          }
        >
          <RotateCw className="h-4 w-4" /> Agendar retorno
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como realizado?</AlertDialogTitle>
            <AlertDialogDescription>
              Marcar “{a.title}” como realizado registrará esta consulta no
              histórico clínico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                doneMut.mutate();
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 flex items-center gap-1">
        {icon}
        <span>{value}</span>
      </div>
    </div>
  );
}

function DocLink({
  doc,
}: {
  doc: { id: string; title: string; file_path: string; mime_type: string | null };
}) {
  const open = async () => {
    const { data, error } = await supabase.storage
      .from("patient-documents")
      .createSignedUrl(doc.file_path, 60);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };
  return (
    <li>
      <button
        onClick={open}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
      >
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="truncate">{doc.title}</span>
      </button>
    </li>
  );
}

function ClinicalEventInlineForm({
  patientId,
  appointmentId,
  defaultTitle,
  onDone,
}: {
  patientId: string;
  appointmentId: string;
  defaultTitle: string;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(defaultTitle);
  const [type, setType] = useState<ClinicalEvent["type"]>("consultation");
  const [description, setDescription] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("clinical_events").insert({
        patient_id: patientId,
        appointment_id: appointmentId,
        type,
        title: title.trim(),
        description: description.trim() || null,
        created_by: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evento clínico registrado");
      qc.invalidateQueries({ queryKey: ["clinical_events"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="space-y-3 border-border/70 p-5 shadow-soft">
      <h3 className="text-sm font-semibold">Registrar evento clínico</h3>
      <div className="space-y-1.5">
        <Label>Tipo</Label>
        <Select value={type} onValueChange={(v) => setType(v as ClinicalEvent["type"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Título</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Orientações / Descrição</Label>
        <Textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="O que o médico disse, recomendações, próximos passos…"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onDone}>
          Cancelar
        </Button>
        <Button
          className="flex-1"
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
        >
          {mut.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </Card>
  );
}
