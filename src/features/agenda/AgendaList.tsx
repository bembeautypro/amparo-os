import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  isToday,
  isThisWeek,
  isPast,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  List as ListIcon,
  CalendarDays,
  Plus,
  MapPin,
  User2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui-extras";
import { CalendarEmpty } from "@/components/illustrations/EmptyIllustrations";
import { cn } from "@/lib/utils";
import { fetchAppointments } from "./api";
import {
  TYPE_OPTIONS,
  type Appointment,
  type AppointmentType,
  statusLabel,
  statusBadgeClass,
  typeMeta,
} from "./types";

type Props = {
  familyId: string;
  patientId: string;
};

const FILTER_OPTIONS: Array<{ value: AppointmentType | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "consulta", label: "Consulta" },
  { value: "exame", label: "Exame" },
  { value: "retorno", label: "Retorno" },
  { value: "procedimento", label: "Procedimento" },
  { value: "vacina", label: "Vacina" },
  { value: "fisioterapia", label: "Fisioterapia" },
];

export function AgendaList({ familyId, patientId }: Props) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [filter, setFilter] = useState<AppointmentType | "all">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", patientId],
    enabled: !!patientId,
    queryFn: () => fetchAppointments(patientId),
  });

  const items = useMemo(() => {
    const all = data ?? [];
    return filter === "all" ? all : all.filter((a) => a.type === filter);
  }, [data, filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
        <Button asChild className="h-10 gap-1.5">
          <Link
            to="/familia/$familyId/agenda/novo"
            params={{ familyId }}
          >
            <Plus className="h-4 w-4" /> Novo
          </Link>
        </Button>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar")}>
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="list" className="gap-1.5">
            <ListIcon className="h-4 w-4" /> Lista
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5">
            <CalendarDays className="h-4 w-4" /> Calendário
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTER_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setFilter(o.value)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition",
              filter === o.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <EmptyState
          illustration={<CalendarEmpty />}
          title="Nenhuma consulta agendada."
          description="Cadastre consultas, exames e retornos para receber lembretes."
          action={
            <Button asChild className="h-11">
              <Link to="/familia/$familyId/agenda/novo" params={{ familyId }}>
                <Plus className="h-4 w-4" /> Agendar consulta
              </Link>
            </Button>
          }
        />
      ) : view === "list" ? (
        <ListView items={items} familyId={familyId} />
      ) : (
        <CalendarView items={items} familyId={familyId} />
      )}
    </div>
  );
}

function ListView({
  items,
  familyId,
}: {
  items: Appointment[];
  familyId: string;
}) {
  const now = new Date();
  const groups: Record<string, Appointment[]> = {
    Hoje: [],
    "Esta semana": [],
    "Próximos": [],
    Realizados: [],
  };

  for (const a of items) {
    const d = parseISO(a.scheduled_at);
    if (a.status === "done") groups["Realizados"].push(a);
    else if (isToday(d)) groups["Hoje"].push(a);
    else if (isThisWeek(d, { locale: ptBR })) groups["Esta semana"].push(a);
    else if (!isPast(d)) groups["Próximos"].push(a);
    else groups["Realizados"].push(a);
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([title, list]) =>
        list.length === 0 ? null : (
          <section key={title} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </h2>
            <div className="grid gap-2">
              {list.map((a) => (
                <AppointmentRow key={a.id} appt={a} familyId={familyId} />
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
}

function AppointmentRow({
  appt,
  familyId,
}: {
  appt: Appointment;
  familyId: string;
}) {
  const meta = typeMeta(appt.type);
  const d = parseISO(appt.scheduled_at);
  return (
    <Link
      to="/familia/$familyId/agenda/$id"
      params={{ familyId, id: appt.id }}
      className="block"
    >
      <Card
        className={cn(
          "flex items-start gap-3 border-border/70 p-4 shadow-soft transition hover:bg-muted/30",
          appt.status === "done" && "opacity-75",
        )}
      >
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-xl">
          {meta.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold leading-tight">{appt.title}</p>
            <Badge
              variant="outline"
              className={cn("font-normal", statusBadgeClass(appt.status))}
            >
              {statusLabel(appt.status)}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {format(d, "EEE, dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {appt.specialty && <span>{appt.specialty}</span>}
            {appt.doctor_name && (
              <span className="inline-flex items-center gap-1">
                <User2 className="h-3 w-3" /> {appt.doctor_name}
              </span>
            )}
            {appt.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {appt.location}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

function CalendarView({
  items,
  familyId,
}: {
  items: Appointment[];
  familyId: string;
}) {
  const [month, setMonth] = useState(() => new Date());
  const [picked, setPicked] = useState<Date | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const padStart = (start.getDay() + 7) % 7; // Sunday = 0
    const arr = eachDayOfInterval({ start, end });
    return { padStart, arr };
  }, [month]);

  const byDay = useMemo(() => {
    const m = new Map<string, Appointment[]>();
    for (const a of items) {
      const k = format(parseISO(a.scheduled_at), "yyyy-MM-dd");
      const list = m.get(k) ?? [];
      list.push(a);
      m.set(k, list);
    }
    return m;
  }, [items]);

  const pickedItems = picked
    ? byDay.get(format(picked, "yyyy-MM-dd")) ?? []
    : [];

  return (
    <Card className="border-border/70 p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMonth(subMonths(month, 1))}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="font-medium capitalize">
          {format(month, "MMMM yyyy", { locale: ptBR })}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMonth(addMonths(month, 1))}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((w, i) => (
          <div key={i} className="py-1">
            {w}
          </div>
        ))}
        {Array.from({ length: days.padStart }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.arr.map((d) => {
          const k = format(d, "yyyy-MM-dd");
          const list = byDay.get(k) ?? [];
          const isCurrentMonth = isSameMonth(d, month);
          return (
            <button
              key={k}
              onClick={() => setPicked(d)}
              className={cn(
                "relative aspect-square rounded-lg p-1 text-sm transition hover:bg-muted",
                !isCurrentMonth && "opacity-40",
                isToday(d) && "bg-primary-soft font-semibold text-primary",
              )}
            >
              {format(d, "d")}
              {list.length > 0 && (
                <div className="absolute inset-x-0 bottom-1 flex justify-center gap-0.5">
                  {list.slice(0, 3).map((a, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1 w-1 rounded-full",
                        a.status === "done" ? "bg-success" : "bg-primary",
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <Sheet
        open={!!picked}
        onOpenChange={(open) => !open && setPicked(null)}
      >
        <SheetContent side="bottom" className="max-h-[60vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-left">
              {picked &&
                format(picked, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {pickedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum compromisso neste dia.
              </p>
            ) : (
              pickedItems.map((a) => (
                <AppointmentRow key={a.id} appt={a} familyId={familyId} />
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
