import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Plus, Download, FileImage, FileType2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui-extras";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DOC_TYPE_LABEL: Record<string, string> = {
  prescription: "Receita",
  exam: "Exame",
  report: "Laudo",
  other: "Outro",
};

export const Route = createFileRoute("/documentos")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <DocumentsPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function DocumentsPage() {
  const { activePatient, activeFamily } = useFamilyContext();
  const newHref = activeFamily ? `/familia/${activeFamily.id}/documentos/novo` : "#";

  const { data, isLoading } = useQuery({
    queryKey: ["documents", activePatient?.id],
    enabled: !!activePatient?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("patient_id", activePatient!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function openDoc(path: string) {
    const { data, error } = await supabase.storage
      .from("patient-documents")
      .createSignedUrl(path, 60);
    if (error || !data) {
      toast.error("Não foi possível abrir o arquivo");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  const NewBtn = ({ label }: { label: string }) =>
    activeFamily ? (
      <Button asChild className="h-11 gap-2">
        <Link
          to="/familia/$familyId/documentos/novo"
          params={{ familyId: activeFamily.id }}
        >
          <Plus className="h-4 w-4" /> {label}
        </Link>
      </Button>
    ) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Documentos"
        description={
          activePatient
            ? `Receitas, exames e laudos de ${activePatient.name}.`
            : "Selecione um familiar para ver os documentos."
        }
        action={<NewBtn label="Subir documento" />}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum documento ainda"
          description="Guarde receitas, exames e laudos digitalizados em um único lugar, acessíveis a qualquer momento."
          action={<NewBtn label="Subir documento" />}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((d) => {
            const isImage = d.mime_type?.startsWith("image/");
            const Icon = isImage ? FileImage : FileType2;
            return (
              <Card
                key={d.id}
                className="group flex items-start gap-4 border-border/70 p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold leading-tight">{d.title}</p>
                    <Badge variant="secondary" className="font-normal">
                      {DOC_TYPE_LABEL[d.doc_type] ?? d.doc_type}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {d.exam_date
                      ? `Exame: ${format(parseISO(d.exam_date), "dd/MM/yyyy")}`
                      : `Enviado em ${format(parseISO(d.created_at), "dd/MM/yyyy", { locale: ptBR })}`}
                  </p>
                  {d.notes && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {d.notes}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openDoc(d.file_path)}
                  aria-label="Baixar"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
