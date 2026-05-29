import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Pill, CalendarPlus, Upload, ClipboardList } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function QuickActionsFab({ familyId }: { familyId: string }) {
  const [open, setOpen] = useState(false);

  const actions = [
    {
      icon: Pill,
      label: "Novo medicamento",
      to: "/familia/$familyId/medicamentos/novo" as const,
    },
    {
      icon: CalendarPlus,
      label: "Nova consulta",
      to: "/familia/$familyId/agenda/novo" as const,
    },
    {
      icon: Upload,
      label: "Subir documento",
      to: "/familia/$familyId/documentos/novo" as const,
    },
    {
      icon: ClipboardList,
      label: "Novo evento clínico",
      to: "/familia/$familyId/documentos/novo" as const,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Adicionar"
          className="fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-card transition-transform hover:scale-105 active:scale-95 lg:hidden"
          style={{ bottom: "calc(72px + env(safe-area-inset-bottom))" }}
        >
          <Plus className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl pb-[calc(env(safe-area-inset-bottom)+1rem)]"
      >
        <SheetHeader>
          <SheetTitle>O que você quer registrar?</SheetTitle>
        </SheetHeader>
        <div className="mt-4 grid gap-2">
          {actions.map(({ icon: Icon, label, to }) => (
            <Link
              key={label}
              to={to}
              params={{ familyId }}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
