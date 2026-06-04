import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PatientProfile } from "@/features/patient/PatientProfile";
import { supabase } from "@/integrations/supabase/client";
import { useFamilyContext } from "@/contexts/FamilyContext";

export const Route = createFileRoute(
  "/familia/$familyId/pacientes/$patientId",
)({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <Page />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function Page() {
  const { familyId, patientId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { setActivePatient } = useFamilyContext();
  const [open, setOpen] = useState(false);

  const remove = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("patients")
        .update({ deleted_at: new Date().toISOString(), deleted_by: u.user?.id ?? null })
        .eq("id", patientId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Familiar removido");
      setActivePatient(null);
      await qc.invalidateQueries({ queryKey: ["patients"] });
      navigate({ to: "/familia" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/familia">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
              Remover
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover este familiar?</AlertDialogTitle>
              <AlertDialogDescription>
                O perfil será arquivado. Os dados clínicos permanecem no histórico mas o familiar deixa de aparecer nas listas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => remove.mutate()}
                disabled={remove.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Perfil do familiar</h1>
      <PatientProfile familyId={familyId} patientId={patientId} />
    </div>
  );
}
