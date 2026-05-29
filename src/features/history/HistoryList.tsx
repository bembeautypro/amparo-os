import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Filter, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui-extras";
import { HistoryEmpty } from "@/components/illustrations/EmptyIllustrations";
import { cn } from "@/lib/utils";
import {
  fetchClinicalEvents,
  fetchEventDocuments,
  getSignedDocUrl,
  type HistoryFilters,
} from "./api";
import {
  SEVERITY_META,
  TYPE_META,
  severityMeta,
  typeMeta,
  type ClinicalEvent,
  type ClinicalEventType,
  type Severity,
} from "./types";

type Props = {
  familyId: string;
  patientId: string;
};

export function HistoryList({ familyId, patientId }: Props) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [types, setTypes] = useState<ClinicalEventType[]>([]);
  const [severities, setSeverities] = useState<Severity[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Debounce search input → 300ms
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filters: HistoryFilters = useMemo(
    () => ({ search, types, severities, from: from || undefined, to: to || undefined }),
    [search, types, severities, from, to],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["clinical_events", patientId, filters],
    enabled: !!patientId,
    queryFn: () => fetchClinicalEvents(patientId, filters),
  });

  const events = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Histórico clínico</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou descrição"
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
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left">Filtros</SheetTitle>
            </SheetHeader>
            <div className="space-y-5 py-4">
              <section className="space-y-2">
                <p className="text-sm font-semibold">Por tipo</p>
                <div className="grid grid-cols-2 gap-2">
                  {TYPE_META.map((t) => (
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
                        {t.icon} {t.label}
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="space-y-2">
                <p className="text-sm font-semibold">Por gravidade</p>
                <div className="grid grid-cols-2 gap-2">
                  {SEVERITY_META.map((s) => (
                    <label
                      key={s.value}
                      className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={severities.includes(s.value)}
                        onCheckedChange={(c) =>
                          setSeverities((prev) =>
                            c
                              ? [...prev, s.value]
                              : prev.filter((x) => x !== s.value),
                          )
                        }
                      />
                      <span>
                        {s.emoji} {s.label}
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
                    <Input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Até</Label>
                    <Input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                    />
                  </div>
                </div>
              </section>
            </div>
            <SheetFooter className="gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setTypes([]);
                  setSeverities([]);
                  setFrom("");
                  setTo("");
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
      ) : events.length === 0 ? (
        <EmptyState
          illustration={<HistoryEmpty />}
          title="Nenhum evento clínico registrado."
          description="Registre consultas, exames, crises ou observações para construir o histórico."
          action={
            <Button asChild className="h-11">
              <Link
                to="/familia/$familyId/historico/novo"
                params={{ familyId }}
              >
                <Plus className="h-4 w-4" /> Registrar primeiro evento
              </Link>
            </Button>
          }
        />
      ) : (
        <Timeline events={events} familyId={familyId} />
      )}

      <Link
        to="/familia/$familyId/historico/novo"
        params={{ familyId }}
        className="fixed right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:opacity-90"
        style={{ bottom: "72px" }}
        aria-label="Novo evento clínico"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}

function Timeline({
  events,
  familyId,
}: {
  events: ClinicalEvent[];
  familyId: string;
}) {
  return (
    <ol className="space-y-3">
      {events.map((e) => (
        <TimelineItem key={e.id} event={e} familyId={familyId} />
      ))}
    </ol>
  );
}

function TimelineItem({
  event,
  familyId,
}: {
  event: ClinicalEvent;
  familyId: string;
}) {
  const t = typeMeta(event.type);
  const s = severityMeta(event.severity);
  const d = parseISO(event.event_date);
  const docsQ = useQuery({
    queryKey: ["event-docs", event.id],
    queryFn: () => fetchEventDocuments(event.id),
  });

  return (
    <li className="flex gap-3">
      <div className="w-12 shrink-0 pt-1 text-right">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          {format(d, "MMM", { locale: ptBR })}
        </p>
        <p className="text-lg font-bold leading-none text-foreground">
          {format(d, "dd")}
        </p>
      </div>
      <Link
        to="/familia/$familyId/historico/$id"
        params={{ familyId, id: event.id }}
        className="block flex-1"
      >
        <Card
          className={cn(
            "flex items-start gap-3 border-border/70 p-4 shadow-soft transition hover:bg-muted/30",
            s.accent,
          )}
        >
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg",
              t.color,
            )}
          >
            {t.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold leading-tight">{event.title}</p>
              <Badge variant="outline" className={cn("font-normal", s.badge)}>
                {s.label}
              </Badge>
            </div>
            {event.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {event.description}
              </p>
            )}
            {(docsQ.data ?? []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(docsQ.data ?? []).slice(0, 4).map((doc) => (
                  <DocThumb
                    key={doc.id}
                    file_path={doc.file_path}
                    title={doc.title}
                    mime={doc.mime_type}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      </Link>
    </li>
  );
}

function DocThumb({
  file_path,
  title,
  mime,
}: {
  file_path: string;
  title: string;
  mime: string | null;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = mime?.startsWith("image/");
  useEffect(() => {
    if (!isImage) return;
    let active = true;
    getSignedDocUrl(file_path, 60).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [file_path, isImage]);

  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const u = url ?? (await getSignedDocUrl(file_path, 60));
        window.open(u, "_blank", "noopener,noreferrer");
      }}
      className="grid h-12 w-12 place-items-center overflow-hidden rounded-md border border-border bg-muted text-[10px] text-muted-foreground"
      title={title}
    >
      {isImage && url ? (
        <img src={url} alt={title} className="h-full w-full object-cover" />
      ) : (
        <span>PDF</span>
      )}
    </button>
  );
}
