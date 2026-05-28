import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui-extras";
import { LogOut, Mail, Users } from "lucide-react";

export const Route = createFileRoute("/perfil")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <ProfilePage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const { families, activeFamily, setActiveFamily } = useFamilyContext();
  const navigate = useNavigate();
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login" });
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Perfil" description="Sua conta e famílias gerenciadas." />

      <Card className="border-border/70 p-6 shadow-soft">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary-soft text-primary text-lg font-semibold">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{fullName}</p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> {user?.email}
            </p>
          </div>
        </div>
      </Card>

      <Card className="border-border/70 p-6 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4 text-primary" />
          Minhas famílias
        </div>
        <div className="mt-4 space-y-2">
          {families.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma família ainda.</p>
          ) : (
            families.map((f) => {
              const active = activeFamily?.id === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFamily(f)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    active
                      ? "border-primary/40 bg-primary-soft text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <span className="font-medium">{f.name}</span>
                  {active && <span className="text-xs font-semibold">Ativa</span>}
                </button>
              );
            })
          )}
        </div>
      </Card>

      <Button
        variant="outline"
        className="h-11 w-full gap-2 sm:w-auto"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4" /> Sair da conta
      </Button>
    </div>
  );
}
