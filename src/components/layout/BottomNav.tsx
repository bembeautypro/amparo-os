import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Pill, CalendarDays, FileText, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFamilyContext } from "@/contexts/FamilyContext";

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { activeFamily } = useFamilyContext();
  const familyId = activeFamily?.id;

  const items = [
    { to: "/dashboard", label: "Início", icon: Home, match: "/dashboard" },
    {
      to: familyId ? `/familia/${familyId}/medicamentos` : "/familia",
      label: "Remédios",
      icon: Pill,
      match: "/medicamentos",
      disabled: !familyId,
    },
    { to: "/agenda", label: "Agenda", icon: CalendarDays, match: "/agenda" },
    { to: "/documentos", label: "Documentos", icon: FileText, match: "/documentos" },
    { to: "/familia", label: "Família", icon: Users, match: "/familia" },
  ] as const;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map((item) => {
          const active = pathname.includes(item.match);
          const Icon = item.icon;
          const className = cn(
            "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
            active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            item.disabled && "pointer-events-none opacity-40",
          );
          return (
            <li key={item.label}>
              <Link to={item.to} className={className}>
                <Icon className={cn("h-5 w-5", active && "stroke-[2.4]")} aria-hidden />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
