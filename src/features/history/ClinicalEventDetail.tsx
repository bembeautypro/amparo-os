import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Edit, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchClinicalEvent,
  fetchEventDocuments,
  fetchProfile,
  getSignedDocUrl,
} from "./api";
import { severityMeta, typeMeta } from "./types";

type Props = { familyId: string; eventId: string };

export function ClinicalEventDetail({ familyId, eventId }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const eventQ = useQuery({
    queryKey: ["clinical_event", eventId],
    queryFn: () => fetchClinicalEvent(eventId),
  });
  const docsQ = useQuery({
    queryKey: ["event-docs", eventId],
    queryFn: () => fetchEventDocuments(eventId),
  });

  const authorId = eventQ.data?.created_by;
  const profileQ = useQuery({
    queryKey: ["profile", authorId],
    enabled: !!authorId,
    queryFn: () => fetchProfile(authorId!),
  });

  // role check — admin via family_members
  const roleQ = useQuery({
    queryKey: ["my-family-role", familyId, user?.id],
    enabled: !!user?.id && !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("role")
        .eq("family_id", familyId)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.role ?? null;
    },
  });

  if (eventQ.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }
  if (!eventQ.data) {
    return <p className="text-sm text-muted-foreground">Não encontrado.</p>;
  }
  const e = eventQ.data;
  const t = typeMeta(e.type);
  const s = severityMeta(e.severity);
  const canEdit = roleQ.data === "admin" || roleQ.data === "caregiver";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1.5"
          onClick={() =>
            navigate({
              to: "/familia/$familyId/historico",
              params: { familyId },
            })
          }
        >
          <ArrowLeft className="h-4 w-4" /> Histórico
        </Button>
        {canEdit && (
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link
              to="/familia/$familyId/historico/$id/editar"
              params={{ familyId, id: e.id }}
            >
              <Edit className="h-4 w-4" /> Editar
            </Link>
          </Button>
        )}
      </div>

      <Card
        className={cn("space-y-4 border-border/70 p-5 shadow-soft", s.accent)}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "grid h-12 w-12 place-items-center rounded-xl text-2xl",
              t.color,
            )}
          >
            {t.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold leading-tight">{e.title}</h1>
              <Badge variant="outline" className={s.badge}>
                {s.emoji} {s.label}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground capitalize">
              {format(parseISO(e.event_date), "EEEE, dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Tipo" value={`${t.icon} ${t.label}`} />
          {e.doctor_name && (
            <Field label="Médico relacionado" value={e.doctor_name} />
          )}
        </div>

        {e.description && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              Descrição
            </p>
            <p className="whitespace-pre-wrap text-sm">{e.description}</p>
          </div>
        )}

        {e.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {e.tags.map((tg) => (
              <Badge key={tg} variant="secondary">
                {tg}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <Card className="border-border/70 p-5 shadow-soft">
        <h2 className="mb-3 text-sm font-semibold">Documentos vinculados</h2>
        {docsQ.isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : (docsQ.data ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum documento.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(docsQ.data ?? []).map((d) => (
              <DocCard
                key={d.id}
                file_path={d.file_path}
                title={d.title}
                mime={d.mime_type}
              />
            ))}
          </div>
        )}
      </Card>

      <p className="px-1 text-xs text-muted-foreground">
        Registrado por{" "}
        <span className="font-medium text-foreground">
          {profileQ.data?.full_name ?? "—"}
        </span>{" "}
        em{" "}
        {format(parseISO(e.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}

function DocCard({
  file_path,
  title,
  mime,
}: {
  file_path: string;
  title: string;
  mime: string | null;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = mime?.startsWith("image/");

  useEffect(() => {
    if (!isImage) return;
    let active = true;
    getSignedDocUrl(file_path, 120).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [file_path, isImage]);

  const open = async () => {
    const u = url ?? (await getSignedDocUrl(file_path, 120));
    window.open(u, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={open}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background text-left transition hover:shadow-soft"
    >
      <div className="grid aspect-square w-full place-items-center bg-muted">
        {isImage && url ? (
          <img src={url} alt={title} className="h-full w-full object-cover" />
        ) : (
          <FileText className="h-10 w-10 text-muted-foreground" />
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-xs font-medium">{title}</p>
      </div>
    </button>
  );
}
