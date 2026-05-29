import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Mail, Loader2, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { acceptInvitation, getInvitationByToken } from "@/features/family/api";
import { ROLE_BADGE_CLASS, ROLE_LABEL } from "@/features/family/utils";

export const Route = createFileRoute("/convite/$token")({
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const invQ = useQuery({
    queryKey: ["invite", token],
    queryFn: () => getInvitationByToken(token),
  });

  const acceptMut = useMutation({
    mutationFn: async () => {
      if (!invQ.data || !user) throw new Error("Sessão inválida");
      await acceptInvitation(invQ.data, user.id);
    },
    onSuccess: () => {
      toast.success("Convite aceito! Bem-vindo à família.");
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => toast.error("Erro ao aceitar", { description: e.message }),
  });

  // Auto-accept after login/register redirect
  const [autoTried, setAutoTried] = useState(false);
  useEffect(() => {
    if (autoTried) return;
    if (authLoading || invQ.isLoading) return;
    if (!user || !invQ.data) return;
    if (invQ.data.status !== "pending") return;
    if (user.email && user.email.toLowerCase() !== invQ.data.email.toLowerCase()) return;
    setAutoTried(true);
    acceptMut.mutate();
  }, [authLoading, invQ.isLoading, user, invQ.data, autoTried, acceptMut]);

  if (invQ.isLoading || authLoading) {
    return (
      <AuthShell title="Verificando convite…" subtitle="Aguarde um instante.">
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AuthShell>
    );
  }

  const inv = invQ.data;
  const expired = inv && (inv.status !== "pending" || new Date(inv.expires_at) <= new Date());

  if (!inv || expired) {
    return (
      <AuthShell title="Convite expirado ou inválido" subtitle="Este link não pode mais ser usado.">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </span>
          <p className="text-sm text-muted-foreground">
            Peça ao familiar que te envie um novo convite.
          </p>
          <Button variant="outline" onClick={() => navigate({ to: "/login" })}>
            Voltar
          </Button>
        </div>
      </AuthShell>
    );
  }

  const familyName = inv.family_name ?? "uma família";
  const emailMismatch = user?.email && user.email.toLowerCase() !== inv.email.toLowerCase();

  return (
    <AuthShell
      title="Você foi convidado"
      subtitle={`Junte-se à família ${familyName} no Amparo.`}
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-muted/40 p-4 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Mail className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm text-muted-foreground">Convite para</p>
          <p className="font-medium">{inv.email}</p>
          <div className="mt-2">
            <Badge variant="outline" className={ROLE_BADGE_CLASS[inv.role]}>
              {ROLE_LABEL[inv.role]}
            </Badge>
          </div>
        </div>

        {emailMismatch && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Você está logado como <strong>{user?.email}</strong>, mas este convite foi enviado para
              <strong> {inv.email}</strong>. Saia e entre com o email correto.
            </p>
          </div>
        )}

        {/* Branch 1: logged in & matching email */}
        {user && !emailMismatch && (
          <Button
            className="w-full h-11"
            disabled={acceptMut.isPending}
            onClick={() => acceptMut.mutate()}
          >
            {acceptMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Aceitar convite
          </Button>
        )}

        {/* Branches 2 & 3: not logged in */}
        {!user && (
          <div className="space-y-2">
            <Button
              className="w-full h-11"
              onClick={() => navigate({ to: "/register", search: { invite: token } as never })}
            >
              Criar conta e aceitar
            </Button>
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={() => navigate({ to: "/login", search: { invite: token } as never })}
            >
              Entrar na minha conta e aceitar
            </Button>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
