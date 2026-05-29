import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Pill, CalendarDays, FileText, Users, User, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFamilyContext } from "@/contexts/FamilyContext";

export function AppSidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { activeFamily } = useFamilyContext();
  const familyId = activeFamily?.id;

  const linkClass = (active: boolean, disabled = false) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      active
        ? "bg-sidebar-accent text-sidebar-foreground"
        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      collapsed && "justify-center px-0",
      disabled && "pointer-events-none opacity-40",
    );


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
          <li>
            <Link
              to="/dashboard"
              className={linkClass(
                pathname === "/dashboard" || pathname.startsWith("/dashboard/"),
              )}
              title={collapsed ? "Início" : undefined}
            >
              <Home className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Início</span>}
            </Link>
          </li>
          <li>
            {familyId ? (
              <Link
                to="/familia/$familyId/medicamentos"
                params={{ familyId }}
                className={linkClass(pathname.includes("/medicamentos"))}
                title={collapsed ? "Medicamentos" : undefined}
              >
                <Pill className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Medicamentos</span>}
              </Link>
            ) : (
              <span
                className={linkClass(false, true)}
                title={collapsed ? "Medicamentos" : undefined}
              >
                <Pill className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Medicamentos</span>}
              </span>
            )}
          </li>
          <li>
            <Link
              to="/agenda"
              className={linkClass(pathname.startsWith("/agenda"))}
              title={collapsed ? "Agenda" : undefined}
            >
              <CalendarDays className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Agenda</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/documentos"
              className={linkClass(pathname.startsWith("/documentos"))}
              title={collapsed ? "Documentos" : undefined}
            >
              <FileText className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Documentos</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/familia"
              className={linkClass(
                pathname === "/familia" || pathname.startsWith("/familia/"),
              )}
              title={collapsed ? "Família" : undefined}
            >
              <Users className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Família</span>}
            </Link>
          </li>
        </ul>

        <div className="mt-4 border-t border-border pt-4">
          <Link
            to="/perfil"
            className={linkClass(pathname.startsWith("/perfil"))}
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
