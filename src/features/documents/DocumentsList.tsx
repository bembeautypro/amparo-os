import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Filter,
  Search,
  Plus,
  LayoutGrid,
  List as ListIcon,
  FileText,
  FileImage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui-extras";
import { DocsEmpty } from "@/components/illustrations/EmptyIllustrations";
import { cn } from "@/lib/utils";
import { fetchDocuments, getSignedDocUrl } from "./api";
import { DOC_TYPES, DOC_TYPE_LABEL, DOC_TYPE_EMOJI, type DocumentType, type DocumentFilters, type Document } from "./types";

type Props = { familyId: string; patientId: string };

export function DocumentsList({ familyId, patientId }: Props) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [doctorOrInst, setDoctorOrInst] = useState("");

  // Debounce search 300ms
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filters: DocumentFilters = useMemo(
    () => ({
      search,
      types,
      from: from || undefined,
      to: to || undefined,
      doctorOrInstitution: doctorOrInst || undefined,
    }),
    [search, types, from, to, doctorOrInst],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["documents", patientId, filters],
    enabled: !!patientId,
    queryFn: () => fetchDocuments(patientId, filters),
  });

  const docs = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Documentos</h1>
        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
          <button
            onClick={() => setView("list")}
            aria-label="Lista"
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full transition",
              view === "list" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            <ListIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("grid")}
            aria-label="Grade"
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full transition",
              view === "grid" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, médico, instituição ou tag"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-11 pl-9"
          />
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-11 gap-1.5">
              <Filter className="h-4 w-4" /> Filtrar
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left">Filtros</SheetTitle>
            </SheetHeader>
            <div className="space-y-5 py-4">
              <section className="space-y-2">
                <p className="text-sm font-semibold">Por tipo</p>
                <div className="grid grid-cols-2 gap-2">
                  {DOC_TYPES.map((t) => (
                    <label
                      key={t.value}
                      className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={types.includes(t.value)}
                        onCheckedChange={(c) =>
                          setTypes((prev) =>
                            c ? [...prev, t.value] : prev.filter((x) => x !== t.value),
                          )
                        }
                      />
                      <span className="truncate">
                        {t.emoji} {t.label}
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="space-y-2">
                <p className="text-sm font-semibold">Por período</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">De</Label>
                    <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Até</Label>
                    <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <p className="text-sm font-semibold">Médico ou instituição</p>
                <Input
                  placeholder="Ex: Dra. Ana ou Hospital São Lucas"
                  value={doctorOrInst}
                  onChange={(e) => setDoctorOrInst(e.target.value)}
                />
              </section>
            </div>
            <SheetFooter className="gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setTypes([]);
                  setFrom("");
                  setTo("");
                  setDoctorOrInst("");
                }}
              >
                Limpar
              </Button>
              <Button className="flex-1" onClick={() => setSheetOpen(false)}>
                Aplicar filtros
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : docs.length === 0 ? (
        <EmptyState
          illustration={<DocsEmpty />}
          title="Sua biblioteca está vazia. Suba o primeiro documento."
          description="Guarde receitas, exames, laudos e carteirinhas em um lugar só."
          action={
            <Button asChild className="h-11">
              <Link to="/familia/$familyId/documentos/novo" params={{ familyId }}>
                <Plus className="mr-1 h-4 w-4" /> Subir agora
              </Link>
            </Button>
          }
        />
      ) : view === "list" ? (
        <div className="space-y-2">
          {docs.map((d) => (
            <DocListItem key={d.id} doc={d} familyId={familyId} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {docs.map((d) => (
            <DocGridCard key={d.id} doc={d} familyId={familyId} />
          ))}
        </div>
      )}

      <Link
        to="/familia/$familyId/documentos/novo"
        params={{ familyId }}
        aria-label="Subir documento"
        className="fixed bottom-[88px] right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-card transition hover:scale-105 md:bottom-8"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}

function DocListItem({ doc, familyId }: { doc: Document; familyId: string }) {
  const isImage = doc.mime_type?.startsWith("image/");
  const Icon = isImage ? FileImage : FileText;
  return (
    <Link
      to="/familia/$familyId/documentos/$id"
      params={{ familyId, id: doc.id }}
      className="block"
    >
      <Card className="flex items-center gap-3 border-border/70 p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold leading-tight">{doc.title}</p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {doc.document_date
              ? format(parseISO(doc.document_date), "dd MMM yyyy", { locale: ptBR })
              : format(parseISO(doc.created_at), "dd MMM yyyy", { locale: ptBR })}
            {doc.doctor_name ? ` · ${doc.doctor_name}` : ""}
          </p>
        </div>
        <Badge variant="secondary" className="font-normal">
          {DOC_TYPE_EMOJI[doc.doc_type]} {DOC_TYPE_LABEL[doc.doc_type]}
        </Badge>
      </Card>
    </Link>
  );
}

function DocGridCard({ doc, familyId }: { doc: Document; familyId: string }) {
  const [thumb, setThumb] = useState<string | null>(null);
  const isImage = doc.mime_type?.startsWith("image/");

  useEffect(() => {
    let cancelled = false;
    if (isImage) {
      getSignedDocUrl(doc.file_path, 3600)
        .then((u) => !cancelled && setThumb(u))
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [doc.file_path, isImage]);

  return (
    <Link
      to="/familia/$familyId/documentos/$id"
      params={{ familyId, id: doc.id }}
      className="group"
    >
      <Card className="overflow-hidden border-border/70 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
        <div className="grid aspect-[4/3] place-items-center bg-muted">
          {isImage && thumb ? (
            <img src={thumb} alt={doc.title} className="h-full w-full object-cover" />
          ) : (
            <FileText className="h-10 w-10 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1 p-3">
          <p className="line-clamp-1 text-sm font-semibold">{doc.title}</p>
          <p className="text-xs text-muted-foreground">
            {DOC_TYPE_EMOJI[doc.doc_type]} {DOC_TYPE_LABEL[doc.doc_type]}
          </p>
        </div>
      </Card>
    </Link>
  );
}
