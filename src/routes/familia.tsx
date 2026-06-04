import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Pill,
  CalendarDays,
  FileText,
  AlertTriangle,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PatientAvatarImage } from "@/components/PatientAvatarImage";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState, PageHeader } from "@/components/ui-extras";
import { useFamilyContext, type Patient } from "@/contexts/FamilyContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/familia")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <FamilyPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function FamilyPage() {
  const { activeFamily, patients, setActivePatient, activePatient } =
    useFamilyContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState<Patient | null>(null);

  const { data: counts } = useQuery({
    queryKey: ["patient-counts", activeFamily?.id, patients.map((p) => p.id).join(",")],
    enabled: patients.length > 0,
    queryFn: async () => {
      const ids = patients.map((p) => p.id);
      const [meds, appts, docs, allergies] = await Promise.all([
        supabase.from("medications").select("patient_id").in("patient_id", ids),
        supabase.from("appointments").select("patient_id").in("patient_id", ids),
        supabase.from("documents").select("patient_id").in("patient_id", ids),
        supabase.from("patient_allergies").select("patient_id").in("patient_id", ids),
      ]);
      const tally = (rows: { patient_id: string }[] | null) =>
        (rows ?? []).reduce<Record<string, number>>(
          (acc, r) => ((acc[r.patient_id] = (acc[r.patient_id] ?? 0) + 1), acc),
          {},
        );
      return {
        meds: tally(meds.data),
        appts: tally(appts.data),
        docs: tally(docs.data),
        allergies: tally(allergies.data),
      };
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (p: Patient) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("patients")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: u.user?.id ?? null,
        })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: (_, p) => {
      toast.success("Familiar removido");
      if (activePatient?.id === p.id) setActivePatient(null);
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient-counts"] });
      setConfirmDelete(null);
    },
    onError: (e: Error) =>
      toast.error("Não foi possível remover", { description: e.message }),
  });

  const AddPatientBtn = activeFamily ? (
    <Button asChild className="h-11">
      <Link
        to="/familia/$familyId/pacientes/novo"
        params={{ familyId: activeFamily.id }}
      >
        Adicionar familiar
      </Link>
    </Button>
  ) : (
    <Button asChild className="h-11">
      <Link to="/onboarding">Iniciar onboarding</Link>
    </Button>
  );

  if (!activeFamily) {
    return (
      <EmptyState
        icon={Users}
        title="Crie sua família"
        description="Comece adicionando familiares para organizar a saúde de todos juntos."
        action={AddPatientBtn}
      />
    );
  }

  function go(p: Patient, to: "/familia/$familyId/medicamentos" | "/familia/$familyId/agenda/novo" | "/familia/$familyId/documentos/novo") {
    setActivePatient(p);
    if (!activeFamily) return;
    navigate({ to, params: { familyId: activeFamily.id } });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={activeFamily.name}
        description="Familiares sob seu cuidado e atalhos rápidos."
        action={AddPatientBtn}
      />

      {patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum familiar cadastrado"
          description="Adicione um familiar para começar a registrar medicamentos, consultas e documentos."
          action={AddPatientBtn}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {patients.map((p) => {
            const active = activePatient?.id === p.id;
            return (
              <Card
                key={p.id}
                className={`border-border/70 p-5 shadow-soft transition-all ${active ? "ring-2 ring-primary/40" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <PatientAvatarImage path={p.avatarUrl} alt={p.name} />
                    <AvatarFallback className="bg-primary-soft text-primary text-base font-semibold">
                      {p.name
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.name}</p>
                    {p.relation && (
                      <p className="text-sm text-muted-foreground">{p.relation}</p>
                    )}
                  </div>
                  {active ? (
                    <Badge className="bg-primary text-primary-foreground">Ativo</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActivePatient(p)}
                    >
                      Selecionar
                    </Button>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                  <Stat icon={Pill} value={counts?.meds[p.id] ?? 0} label="Remédios" />
                  <Stat
                    icon={CalendarDays}
                    value={counts?.appts[p.id] ?? 0}
                    label="Consultas"
                  />
                  <Stat icon={FileText} value={counts?.docs[p.id] ?? 0} label="Docs" />
                  <Stat
                    icon={AlertTriangle}
                    value={counts?.allergies[p.id] ?? 0}
                    label="Alergias"
                  />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5"
                    onClick={() => go(p, "/familia/$familyId/medicamentos")}
                  >
                    <Pill className="h-3.5 w-3.5" /> Medicamentos
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5"
                    onClick={() => go(p, "/familia/$familyId/agenda/novo")}
                  >
                    <Plus className="h-3.5 w-3.5" /> Consulta
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5"
                    onClick={() => go(p, "/familia/$familyId/documentos/novo")}
                  >
                    <Plus className="h-3.5 w-3.5" /> Documento
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => setConfirmDelete(p)}
                    aria-label={`Remover ${p.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remover
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remover {confirmDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Todos os dados clínicos vinculados (medicamentos, consultas,
              documentos, eventos) também serão removidos. Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (confirmDelete) deleteMut.mutate(confirmDelete);
              }}
            >
              {deleteMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Pill;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-lg bg-muted/60 px-2 py-2.5">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
      <p className="mt-1 text-base font-semibold leading-none">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
