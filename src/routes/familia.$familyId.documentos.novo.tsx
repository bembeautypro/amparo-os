import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useFamilyContext } from "@/contexts/FamilyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/familia/$familyId/documentos/novo")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <NewDocumentPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function NewDocumentPage() {
  const { familyId } = useParams({ from: "/familia/$familyId/documentos/novo" });
  const { activePatient, patients } = useFamilyContext();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [patientId, setPatientId] = useState(activePatient?.id ?? "");
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<"prescription" | "exam" | "report" | "other">(
    "exam",
  );
  const [examDate, setExamDate] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error("Selecione um familiar");
      if (!title.trim()) throw new Error("Informe o título");
      if (!file) throw new Error("Anexe um arquivo");
      if (file.size > 15 * 1024 * 1024) throw new Error("Arquivo maior que 15MB");

      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${patientId}/${Date.now()}_${safeName}`;
      const up = await supabase.storage
        .from("patient-documents")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;

      const { error } = await supabase.from("documents").insert({
        patient_id: patientId,
        title: title.trim(),
        doc_type: docType,
        file_path: path,
        mime_type: file.type,
        file_size: file.size,
        exam_date: examDate || null,
        notes: notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento enviado");
      qc.invalidateQueries({ queryKey: ["documents"] });
      navigate({ to: "/documentos" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
        <Link to="/documentos">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Novo documento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suba receitas, exames ou laudos. Aceita PDF e imagens até 15MB.
        </p>
      </div>

      <Card className="border-border/70 p-6 shadow-soft">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-5"
        >
          <Field label="Familiar">
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Título" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Hemograma completo"
              className="h-11"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Tipo">
              <Select
                value={docType}
                onValueChange={(v) => setDocType(v as typeof docType)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prescription">Receita</SelectItem>
                  <SelectItem value="exam">Exame</SelectItem>
                  <SelectItem value="report">Laudo</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Data do exame">
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="h-11"
              />
            </Field>
          </div>

          <Field label="Arquivo" required>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 px-6 py-8 text-center transition-colors hover:border-primary/40 hover:bg-primary-soft/30">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">
                {file ? file.name : "Clique para selecionar"}
              </span>
              <span className="text-xs text-muted-foreground">PDF, JPG, PNG até 15MB</span>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          </Field>

          <Field label="Observações">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Resultado, observações do médico, etc."
              rows={3}
            />
          </Field>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => navigate({ to: "/documentos" })}
            >
              Cancelar
            </Button>
            <Button type="submit" className="h-11" disabled={mutation.isPending}>
              {mutation.isPending ? "Enviando…" : "Subir documento"}
            </Button>
          </div>
        </form>
      </Card>

      <input type="hidden" value={familyId} readOnly />
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
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
