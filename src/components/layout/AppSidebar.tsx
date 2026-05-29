import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Pill, CalendarDays, FileText, Users, User, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFamilyContext } from "@/contexts/FamilyContext";

export function AppSidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { activeFamily } = useFamilyContext();
  const familyId = activeFamily?.id;

  const items = [
    { to: "/dashboard", label: "Início", icon: Home, match: "/dashboard" },
    {
      to: familyId ? `/familia/${familyId}/medicamentos` : "/familia",
      label: "Medicamentos",
      icon: Pill,
      match: "/medicamentos",
      disabled: !familyId,
    },
    { to: "/agenda", label: "Agenda", icon: CalendarDays, match: "/agenda" },
    { to: "/documentos", label: "Documentos", icon: FileText, match: "/documentos" },
    { to: "/familia", label: "Família", icon: Users, match: "/familia" },
  ] as const;

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 border-r border-border bg-sidebar transition-[width] duration-200 md:flex md:flex-col",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
          <Heart className="h-5 w-5" fill="currentColor" />
        </span>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-base font-semibold tracking-tight">Amparo</p>
            <p className="text-[11px] text-muted-foreground">Saúde da família</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = pathname.includes(item.match);
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-0",
                    item.disabled && "pointer-events-none opacity-40",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 border-t border-border pt-4">
          <Link
            to="/perfil"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/perfil")
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
            title={collapsed ? "Perfil" : undefined}
          >
            <User className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Perfil</span>}
          </Link>
        </div>
      </nav>

      {!collapsed && (
        <div className="px-5 py-4 text-[11px] text-muted-foreground">
          Cuidar é um ato de amor.
        </div>
      )}
    </aside>
  );
}
