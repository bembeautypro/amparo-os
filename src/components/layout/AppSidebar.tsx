import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, FileText, Users, User, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Início", icon: Home },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/documentos", label: "Documentos", icon: FileText },
  { to: "/familia", label: "Família", icon: Users },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function AppSidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-0",
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
      </nav>

      {!collapsed && (
        <div className="px-5 py-4 text-[11px] text-muted-foreground">
          Cuidar é um ato de amor.
        </div>
      )}
    </aside>
  );
}
