import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { History, ShieldAlert } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader, EmptyState } from "@/components/ui-extras";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { listActivity, listMembers } from "@/features/family/api";
import { ACTION_LABEL, describeAction, relativeTime } from "@/features/family/utils";

type SearchParams = { actor?: string };

export const Route = createFileRoute("/familia/$familyId/membros/atividade")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    actor: typeof search.actor === "string" ? search.actor : undefined,
  }),
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <ActivityPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

const PAGE_SIZE = 20;

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function ActivityPage() {
  const { familyId } = Route.useParams();
  const { actor } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [action, setAction] = useState<string>("all");
  const [actorFilter, setActorFilter] = useState<string>(actor ?? "all");

  const membersQ = useQuery({
    queryKey: ["members", familyId],
    queryFn: () => listMembers(familyId),
  });
  const myMember = (membersQ.data ?? []).find((m) => m.user_id === user?.id);
  const isMember = !!myMember;

  const logsQ = useInfiniteQuery({
    queryKey: ["activity", familyId, actorFilter, action],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listActivity({
        familyId,
        page: pageParam as number,
        pageSize: PAGE_SIZE,
        actorId: actorFilter !== "all" ? actorFilter : undefined,
        action: action !== "all" ? action : undefined,
      }),
    getNextPageParam: (last, all) => (last.hasMore ? all.length : undefined),
    enabled: isMember,
  });

  if (membersQ.isLoading) {
    return <Card className="p-6 text-sm text-muted-foreground">Carregando…</Card>;
  }

  if (!isMember) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Acesso restrito"
        description="Você não é membro desta família."
      />
    );
  }

  const items = (logsQ.data?.pages ?? []).flatMap((p) => p.items);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Atividade da família"
        description="Histórico de ações realizadas pelos membros."
        action={
          <Button variant="outline" onClick={() => navigate({ to: "/familia/$familyId/membros", params: { familyId } })}>
            Voltar
          </Button>
        }
      />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Membro</Label>
            <Select
              value={actorFilter}
              onValueChange={(v) => {
                setActorFilter(v);
                navigate({
                  to: "/familia/$familyId/membros/atividade",
                  params: { familyId },
                  search: v !== "all" ? { actor: v } : {},
                  replace: true,
                });
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os membros</SelectItem>
                {(membersQ.data ?? []).map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.profile?.full_name ?? "Sem nome"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ação</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {Object.entries(ACTION_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {logsQ.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">Carregando…</Card>
      ) : items.length === 0 ? (
        <EmptyState icon={History} title="Sem atividade" description="Nenhuma ação registrada com esses filtros." />
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <Card key={it.id} className="flex items-start gap-3 p-3">
              <Avatar className="h-9 w-9">
                {it.actor?.avatar_url && (
                  <AvatarImage src={it.actor.avatar_url} alt={it.actor.full_name ?? ""} />
                )}
                <AvatarFallback>{initials(it.actor?.full_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{it.actor?.full_name ?? "Alguém"}</span>{" "}
                  <span className="text-muted-foreground">{describeAction(it.action, it.details)}</span>
                </p>
                <p className="text-xs text-muted-foreground">{relativeTime(it.accessed_at)}</p>
              </div>
            </Card>
          ))}
          {logsQ.hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => logsQ.fetchNextPage()}
                disabled={logsQ.isFetchingNextPage}
              >
                {logsQ.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
