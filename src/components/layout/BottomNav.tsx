import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Pill, CalendarDays, FileText, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFamilyContext } from "@/contexts/FamilyContext";

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { activeFamily } = useFamilyContext();
  const familyId = activeFamily?.id;

  const medsActive = pathname.includes("/medicamentos");
  const itemBase =
    "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        <li>
          <Link
            to="/dashboard"
            className={cn(
              itemBase,
              pathname === "/dashboard" || pathname.startsWith("/dashboard/")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Home className="h-5 w-5" aria-hidden />
            <span>Início</span>
          </Link>
        </li>
        <li>
          {familyId ? (
            <Link
              to="/familia/$familyId/medicamentos"
              params={{ familyId }}
              className={cn(
                itemBase,
                medsActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Pill className="h-5 w-5" aria-hidden />
              <span>Remédios</span>
            </Link>
          ) : (
            <span className={cn(itemBase, "text-muted-foreground opacity-40")}>
              <Pill className="h-5 w-5" aria-hidden />
              <span>Remédios</span>
            </span>
          )}
        </li>
        <li>
          <Link
            to="/agenda"
            className={cn(
              itemBase,
              pathname.startsWith("/agenda")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CalendarDays className="h-5 w-5" aria-hidden />
            <span>Agenda</span>
          </Link>
        </li>
        <li>
          <Link
            to="/documentos"
            className={cn(
              itemBase,
              pathname.startsWith("/documentos")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <FileText className="h-5 w-5" aria-hidden />
            <span>Documentos</span>
          </Link>
        </li>
        <li>
          <Link
            to="/familia"
            className={cn(
              itemBase,
              pathname === "/familia" || pathname.startsWith("/familia/")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Users className="h-5 w-5" aria-hidden />
            <span>Família</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
