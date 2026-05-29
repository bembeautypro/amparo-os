import { Link } from "@tanstack/react-router";
import {
  FileText,
  FileImage,
  Stethoscope,
  ClipboardList,
  Receipt,
  Upload,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortDate } from "@/lib/dates";
import { useRecentDocuments } from "@/features/dashboard/hooks/useDashboardQueries";

function iconFor(type: string) {
  switch (type) {
    case "exam":
    case "exam_result":
      return ClipboardList;
    case "prescription":
      return Receipt;
    case "report":
      return Stethoscope;
    case "image":
      return FileImage;
    default:
      return FileText;
  }
}

export function DocumentsRecentCard({
  patientId,
  familyId,
}: {
  patientId: string;
  familyId: string;
}) {
  const q = useRecentDocuments(patientId, 3);

  return (
    <Card
      aria-labelledby="card-docs-title"
      className="border-border/70 p-5 shadow-soft"
    >
      <header className="flex items-center justify-between">
        <h2 id="card-docs-title" className="text-base font-semibold">
          Documentos
        </h2>
        <Link
          to="/documentos"
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver todos
        </Link>
      </header>

      <div className="mt-4 space-y-2">
        {q.isPending ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : q.data && q.data.length > 0 ? (
          q.data.map((d) => {
            const Icon = iconFor(d.doc_type);
            return (
              <div
                key={d.id}
                className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatShortDate(d.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-muted/30 p-5 text-center">
            <FileText className="h-7 w-7 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhum documento enviado
            </p>
            <Button asChild size="sm" className="mt-3 h-9">
              <Link
                to="/familia/$familyId/documentos/novo"
                params={{ familyId }}
              >
                <Upload className="mr-1.5 h-4 w-4" /> Subir documento
              </Link>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
