import { Link } from "@tanstack/react-router";
import { Menu, ChevronDown, Check, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { user, signOut } = useAuth();
  const { activePatient, patients, setActivePatient, activeFamily } =
    useFamilyContext();
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted">
              <Avatar className="h-9 w-9">
                <PatientAvatarImage
                  path={activePatient?.avatarUrl}
                  alt={activePatient?.name ?? ""}
                />
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
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Familiares</DropdownMenuLabel>
            {patients.length === 0 ? (
              <div className="px-2 py-2 text-xs text-muted-foreground">
                Nenhum familiar cadastrado.
              </div>
            ) : (
              patients.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => setActivePatient(p)}
                  className="gap-2"
                >
                  <Avatar className="h-7 w-7">
                    <PatientAvatarImage path={p.avatarUrl} alt={p.name} />
                    <AvatarFallback className="bg-primary-soft text-primary text-[11px] font-semibold">
                      {initials(p.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    {p.relation && (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {p.relation}
                      </p>
                    )}
                  </div>
                  {activePatient?.id === p.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/onboarding" className="gap-2">
                <Plus className="h-4 w-4" /> Adicionar familiar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/familia">Ver todos</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-2">


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full" aria-label="Conta">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarFallback className="bg-muted text-foreground text-sm font-semibold">
                    {initials(fullName)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{fullName}</DropdownMenuLabel>
              {activeFamily && (
                <DropdownMenuLabel className="pt-0 text-xs font-normal text-muted-foreground">
                  {activeFamily.name}
                </DropdownMenuLabel>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/perfil">Perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/familia">Família</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
