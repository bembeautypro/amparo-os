import { Link } from "@tanstack/react-router";
import { Menu, PhoneCall, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyContext } from "@/contexts/FamilyContext";

function initials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function AppHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user } = useAuth();
  const { activePatient } = useFamilyContext();
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  return (
    <header
      className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex"
          onClick={onToggleSidebar}
          aria-label="Alternar menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <button className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary-soft text-primary text-sm font-semibold">
              {initials(activePatient?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
              Cuidando de
            </p>
            <p className="flex items-center gap-1 truncate text-sm font-semibold">
              {activePatient?.name ?? "Selecionar"}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </p>
          </div>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <Button
            asChild
            className="h-10 gap-2 rounded-full bg-emergency px-3 text-emergency-foreground shadow-soft hover:bg-emergency/90 sm:px-4"
          >
            <Link to="/dashboard">
              <PhoneCall className="h-4 w-4" />
              <span className="hidden sm:inline">Emergência</span>
            </Link>
          </Button>

          <Avatar className="h-10 w-10 border border-border">
            <AvatarFallback className="bg-muted text-foreground text-sm font-semibold">
              {initials(fullName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
