import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Download,
  Edit,
  Trash2,
  ExternalLink,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchDocument,
  getSignedDocUrl,
  softDeleteDocument,
  updateDocument,
} from "./api";
import { DOC_TYPES, DOC_TYPE_EMOJI, DOC_TYPE_LABEL, type DocumentType } from "./types";

type Props = { familyId: string; id: string };

export function DocumentDetail({ familyId, id }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const docQ = useQuery({
    queryKey: ["document", id],
    queryFn: () => fetchDocument(id),
  });

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocumentType>("other");
  const [documentDate, setDocumentDate] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [institution, setInstitution] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!docQ.data) return;
    const d = docQ.data;
    setTitle(d.title);
    setDocType(d.doc_type);
    setDocumentDate(d.document_date ?? "");
    setDoctorName(d.doctor_name ?? "");
    setInstitution(d.institution ?? "");
    setExpiryDate(d.expiry_date ?? "");
    setNotes(d.notes ?? "");
    getSignedDocUrl(d.file_path, 3600)
      .then(setSignedUrl)
      .catch(() => toast.error("Falha ao gerar URL do arquivo"));
  }, [docQ.data]);

  const roleQ = useQuery({
    queryKey: ["my-family-role", familyId, user?.id],
    enabled: !!user?.id && !!familyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("family_members")
        .select("role")
        .eq("family_id", familyId)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data?.role as string | undefined;
    },
  });
  const isAdmin = roleQ.data === "admin";

  const saveM = useMutation({
    mutationFn: async () => {
      await updateDocument(id, {
        title: title.trim(),
        doc_type: docType,
        document_date: documentDate || null,
        doctor_name: doctorName.trim() || null,
        institution: institution.trim() || null,
        expiry_date: expiryDate || null,
        notes: notes.trim() || null,
      });
    },
    onSuccess: () => {
      toast.success("Documento atualizado");
      qc.invalidateQueries({ queryKey: ["document", id] });
      qc.invalidateQueries({ queryKey: ["documents"] });
      setEditing(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: () => softDeleteDocument(id),
    onSuccess: () => {
      toast.success("Documento excluído");
      qc.invalidateQueries({ queryKey: ["documents"] });
      navigate({ to: "/familia/$familyId/documentos", params: { familyId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleDownload() {
    if (!docQ.data) return;
    try {
      const url = await getSignedDocUrl(docQ.data.file_path, 60);
      const a = document.createElement("a");
      a.href = url;
      a.download = docQ.data.title;
      a.target = "_blank";
      a.click();
    } catch {
      toast.error("Falha ao baixar");
    }
  }

  if (docQ.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }
  if (!docQ.data) {
    return <p className="text-sm text-muted-foreground">Documento não encontrado.</p>;
  }
  const d = docQ.data;
  const isImage = d.mime_type?.startsWith("image/");
  const isPdf = d.mime_type === "application/pdf";

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link to="/familia/$familyId/documentos" params={{ familyId }}>
          <ArrowLeft className="h-4 w-4" /> Documentos
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {d.title}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="font-normal">
            {DOC_TYPE_EMOJI[d.doc_type]} {DOC_TYPE_LABEL[d.doc_type]}
          </Badge>
          <span>·</span>
          <span>
            {format(parseISO(d.created_at), "dd MMM yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Viewer */}
      <Card className="overflow-hidden border-border/70 shadow-soft">
        {signedUrl ? (
          isImage ? (
            <div className="grid place-items-center bg-muted">
              <img
                src={signedUrl}
                alt={d.title}
                className="max-h-[70vh] w-auto touch-pinch-zoom"
                style={{ touchAction: "pinch-zoom" }}
              />
            </div>
          ) : isPdf ? (
            <div className="bg-muted">
              {!pdfError ? (
                <object
                  data={signedUrl}
                  type="application/pdf"
                  className="h-[70vh] w-full"
                  onError={() => setPdfError(true)}
                >
                  <div className="grid place-items-center p-12 text-center">
                    <FileText className="mb-3 h-12 w-12 text-muted-foreground" />
                    <Button onClick={() => window.open(signedUrl, "_blank")}>
                      <ExternalLink className="mr-1.5 h-4 w-4" /> Abrir PDF
                    </Button>
                  </div>
                </object>
              ) : (
                <div className="grid place-items-center p-12">
                  <Button onClick={() => window.open(signedUrl, "_blank")}>
                    <ExternalLink className="mr-1.5 h-4 w-4" /> Abrir PDF
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid place-items-center p-12">
              <Button onClick={() => window.open(signedUrl, "_blank")}>
                <ExternalLink className="mr-1.5 h-4 w-4" /> Abrir arquivo
              </Button>
            </div>
          )
        ) : (
          <div className="h-64 animate-pulse bg-muted" />
        )}
      </Card>

      {/* Metadata */}
      <Card className="border-border/70 p-6 shadow-soft">
        {!editing ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <Meta label="Data do documento" value={d.document_date ? format(parseISO(d.document_date), "dd/MM/yyyy") : "—"} />
            <Meta label="Validade" value={d.expiry_date ? format(parseISO(d.expiry_date), "dd/MM/yyyy") : "—"} />
            <Meta label="Médico" value={d.doctor_name ?? "—"} />
            <Meta label="Instituição" value={d.institution ?? "—"} />
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-muted-foreground">Tags</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {d.tags.length === 0 ? (
                  <span className="text-sm">—</span>
                ) : (
                  d.tags.map((t) => (
                    <Badge key={t} variant="outline" className="font-normal">
                      {t}
                    </Badge>
                  ))
                )}
              </dd>
            </div>
            {d.notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">Observações</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm">{d.notes}</dd>
              </div>
            )}
          </dl>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveM.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
                <SelectTrigger>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Data do documento</Label>
                <Input type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Validade</Label>
                <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Médico</Label>
              <Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Instituição</Label>
              <Input value={institution} onChange={(e) => setInstitution(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveM.isPending}>
                {saveM.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Actions footer */}
      <div className="fixed inset-x-0 bottom-[72px] z-20 border-t border-border bg-background/95 p-3 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-end gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-1.5 h-4 w-4" /> Baixar
          </Button>
          {!editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit className="mr-1.5 h-4 w-4" /> Editar dados
            </Button>
          )}
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-1.5 h-4 w-4" /> Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação pode ser revertida por um administrador. O arquivo permanece guardado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteM.mutate()}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}
