import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Users, Mail, RefreshCw, X, Loader2, History } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader, EmptyState } from "@/components/ui-extras";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  listMembers,
  listPendingInvitations,
  resendInvitation,
  cancelInvitation,
} from "@/features/family/api";
import { InviteDialog } from "@/features/family/InviteDialog";
import { MemberActionsSheet } from "@/features/family/MemberActionsSheet";
import { ROLE_BADGE_CLASS, ROLE_LABEL } from "@/features/family/utils";
import type { Member, Invitation } from "@/features/family/types";

export const Route = createFileRoute("/familia/$familyId/membros")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <MembersPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function MembersPage() {
  const { familyId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const familyQ = useQuery({
    queryKey: ["family", familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("families")
        .select("id, name")
        .eq("id", familyId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const membersQ = useQuery({
    queryKey: ["members", familyId],
    queryFn: () => listMembers(familyId),
  });

  const invitesQ = useQuery({
    queryKey: ["invitations", familyId],
    queryFn: () => listPendingInvitations(familyId),
  });

  const myMember = (membersQ.data ?? []).find((m) => m.user_id === user?.id);
  const isAdmin = myMember?.role === "admin";

  const resendMut = useMutation({
    mutationFn: (inv: Invitation) => resendInvitation(inv),
    onSuccess: () => {
      toast.success("Convite reenviado");
      qc.invalidateQueries({ queryKey: ["invitations", familyId] });
    },
    onError: (e: Error) => toast.error("Erro", { description: e.message }),
  });

  const cancelMut = useMutation({
    mutationFn: (inv: Invitation) => cancelInvitation(inv),
    onSuccess: () => {
      toast.success("Convite cancelado");
      qc.invalidateQueries({ queryKey: ["invitations", familyId] });
    },
    onError: (e: Error) => toast.error("Erro", { description: e.message }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Família"
        description={familyQ.data?.name ?? undefined}
        action={
          isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link
                  to="/familia/$familyId/membros/atividade"
                  params={{ familyId }}
                >
                  <History className="mr-2 h-4 w-4" /> Atividade
                </Link>
              </Button>
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Convidar pessoa
              </Button>
            </div>
          )
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Membros ativos
        </h2>
        {membersQ.isLoading ? (
          <Card className="p-6 text-sm text-muted-foreground">Carregando…</Card>
        ) : (membersQ.data ?? []).length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sem membros ainda"
            description="Convide pessoas para participar do cuidado."
          />
        ) : (
          <div className="space-y-2">
            {(membersQ.data ?? []).map((m) => (
              <Card
                key={m.id}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/40 transition"
                onClick={() => setSelectedMember(m)}
              >
                <Avatar className="h-11 w-11">
                  {m.profile?.avatar_url && (
                    <AvatarImage src={m.profile.avatar_url} alt={m.profile.full_name ?? ""} />
                  )}
                  <AvatarFallback>{initials(m.profile?.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {m.profile?.full_name ?? "Sem nome"}
                    {m.user_id === user?.id && (
                      <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.status === "active" ? "Ativo" : "Convidado"}
                  </p>
                </div>
                <Badge variant="outline" className={ROLE_BADGE_CLASS[m.role]}>
                  {ROLE_LABEL[m.role]}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Convites pendentes
        </h2>
        {invitesQ.isLoading ? (
          <Card className="p-6 text-sm text-muted-foreground">Carregando…</Card>
        ) : (invitesQ.data ?? []).length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground text-center">
            Nenhum convite pendente.
          </Card>
        ) : (
          <div className="space-y-2">
            {(invitesQ.data ?? []).map((inv) => (
              <Card key={inv.id} className="p-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{inv.email}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className={ROLE_BADGE_CLASS[inv.role]}>
                        {ROLE_LABEL[inv.role]}
                      </Badge>
                      <span>
                        expira {new Date(inv.expires_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={resendMut.isPending}
                      onClick={() => resendMut.mutate(inv)}
                    >
                      {resendMut.isPending ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-3 w-3" />
                      )}
                      Reenviar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => cancelMut.mutate(inv)}
                    >
                      <X className="mr-2 h-3 w-3" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {familyQ.data && (
        <InviteDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          familyId={familyId}
          familyName={familyQ.data.name}
        />
      )}

      {selectedMember && (
        <MemberActionsSheet
          open={!!selectedMember}
          onOpenChange={(o) => !o && setSelectedMember(null)}
          member={selectedMember}
          familyId={familyId}
          isAdmin={!!isAdmin}
        />
      )}
    </div>
  );
}
