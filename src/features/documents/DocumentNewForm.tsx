import { useState, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Camera, Image as ImageIcon, FileUp, X, ChevronDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  uploadDocumentFile,
  createDocument,
  fetchAppointmentsForPatient,
  fetchClinicalEventsForPatient,
} from "./api";
import { DOC_TYPES, type DocumentType } from "./types";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

type Props = {
  familyId: string;
  patientId: string;
};

export function DocumentNewForm({ familyId, patientId }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Step 2 fields
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocumentType>("exam");
  const [showMore, setShowMore] = useState(false);
  const [documentDate, setDocumentDate] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [institution, setInstitution] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [appointmentId, setAppointmentId] = useState<string>("");
  const [clinicalEventId, setClinicalEventId] = useState<string>("");

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const apptsQ = useQuery({
    queryKey: ["docs-appointments", patientId],
    enabled: !!patientId && step === 2,
    queryFn: () => fetchAppointmentsForPatient(patientId),
  });
  const eventsQ = useQuery({
    queryKey: ["docs-events", patientId],
    enabled: !!patientId && step === 2,
    queryFn: () => fetchClinicalEventsForPatient(patientId),
  });

  async function handleSelect(f: File | null) {
    if (!f) return;
    if (f.size > MAX_SIZE) {
      toast.error("Arquivo maior que 50MB");
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
    // immediate upload to bucket
    try {
      setUploading(true);
      setProgress(15);
      const r = await uploadDocumentFile({ familyId, patientId, file: f });
      setProgress(100);
      setFilePath(r.path);
      setFileMime(r.mime_type);
      setFileSize(r.file_size);
      // Suggest title from filename
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
      setStep(2);
    } catch (e) {
      toast.error((e as Error).message || "Falha ao enviar arquivo");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }

  function addTag() {
    const t = tagsInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagsInput("");
  }

  const saveM = useMutation({
    mutationFn: async () => {
      if (!filePath) throw new Error("Anexe um arquivo");
      if (!title.trim()) throw new Error("Informe o título");
      await createDocument({
        patient_id: patientId,
        title: title.trim(),
        doc_type: docType,
        file_path: filePath,
        mime_type: fileMime,
        file_size: fileSize,
        document_date: documentDate || null,
        doctor_name: doctorName.trim() || null,
        institution: institution.trim() || null,
        tags,
        expiry_date: expiryDate || null,
        appointment_id: appointmentId || null,
        clinical_event_id: clinicalEventId || null,
        notes: notes.trim() || null,
      });
    },
    onSuccess: () => {
      toast.success("Documento salvo");
      qc.invalidateQueries({ queryKey: ["documents"] });
      navigate({ to: "/familia/$familyId/documentos", params: { familyId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link to="/familia/$familyId/documentos" params={{ familyId }}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Novo documento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === 1
            ? "Anexe o arquivo (até 50MB) — PDF ou imagem."
            : "Classifique o documento para encontrá-lo depois."}
        </p>
      </div>

      {step === 1 ? (
        <Card className="border-border/70 p-6 shadow-soft">
          {/* Mobile: 3 large stacked buttons */}
          <div className="space-y-3 md:hidden">
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf,.tiff"
              className="hidden"
              onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
            />
            <UploadButton
              icon={<Camera className="h-5 w-5" />}
              label="Tirar foto com câmera"
              onClick={() => cameraRef.current?.click()}
              disabled={uploading}
            />
            <UploadButton
              icon={<ImageIcon className="h-5 w-5" />}
              label="Escolher da galeria"
              onClick={() => galleryRef.current?.click()}
              disabled={uploading}
            />
            <UploadButton
              icon={<FileUp className="h-5 w-5" />}
              label="Selecionar arquivo"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            />
          </div>

          {/* Desktop: drag & drop area */}
          <div className="hidden md:block">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf,.tiff"
              className="hidden"
              onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
            />
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleSelect(e.dataTransfer.files?.[0] ?? null);
              }}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition",
                dragOver ? "border-primary bg-primary-soft/40" : "border-border",
              )}
            >
              <FileUp className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Arraste e solte o arquivo aqui</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Imagem ou PDF até 50MB
              </p>
              <Button
                className="mt-4"
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                Selecionar arquivo
              </Button>
            </div>
          </div>

          {(uploading || progress > 0) && (
            <div className="mt-4 space-y-2">
              {file && (
                <div className="flex items-center gap-3 rounded-md border border-border p-3">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt=""
                      className="h-16 w-16 rounded object-cover"
                      style={{ maxHeight: 200 }}
                    />
                  ) : (
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">
                {uploading ? "Enviando…" : "Pronto"}
              </p>
            </div>
          )}
        </Card>
      ) : (
        <Card className="border-border/70 p-6 shadow-soft">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveM.mutate();
            }}
            className="space-y-5"
          >
            {file && (
              <div className="flex items-center gap-3 rounded-md bg-muted p-3">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt=""
                    className="h-14 w-14 rounded object-cover"
                  />
                ) : (
                  <FileText className="h-8 w-8 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {((fileSize ?? 0) / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Hemograma completo"
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                Tipo <span className="text-destructive">*</span>
              </Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.emoji} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              onClick={() => setShowMore((s) => !s)}
              className="flex items-center gap-1 text-sm font-medium text-primary"
            >
              <ChevronDown
                className={cn("h-4 w-4 transition", showMore && "rotate-180")}
              />
              {showMore ? "Ocultar detalhes" : "Adicionar mais detalhes"}
            </button>

            {showMore && (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Data do documento</Label>
                    <Input
                      type="date"
                      value={documentDate}
                      onChange={(e) => setDocumentDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Validade</Label>
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Médico / profissional</Label>
                  <Input
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Ex: Dra. Ana Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instituição / clínica</Label>
                  <Input
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Ex: Hospital São Lucas"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Digite e pressione Enter"
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      Adicionar
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((t) => (
                        <Badge
                          key={t}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => setTags(tags.filter((x) => x !== t))}
                        >
                          {t} <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vincular a consulta</Label>
                  <Select
                    value={appointmentId || "none"}
                    onValueChange={(v) => setAppointmentId(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {(apptsQ.data ?? []).map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.title} —{" "}
                          {format(parseISO(a.scheduled_at), "dd/MM/yyyy")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vincular a evento clínico</Label>
                  <Select
                    value={clinicalEventId || "none"}
                    onValueChange={(v) =>
                      setClinicalEventId(v === "none" ? "" : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {(eventsQ.data ?? []).map((ev) => (
                        <SelectItem key={ev.id} value={ev.id}>
                          {ev.title} —{" "}
                          {format(parseISO(ev.event_date), "dd/MM/yyyy")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                Voltar
              </Button>
              <Button type="submit" className="flex-1" disabled={saveM.isPending}>
                {saveM.isPending ? "Salvando…" : "Salvar documento"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

function UploadButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-border bg-background p-5 text-left transition hover:border-primary hover:bg-primary-soft/40 disabled:opacity-50"
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
        {icon}
      </span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}
