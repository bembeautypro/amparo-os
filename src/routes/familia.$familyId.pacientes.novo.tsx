import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { StepPatient, type StepPatientData } from "@/features/onboarding/steps/StepPatient";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/familia/$familyId/pacientes/novo")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <Page />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function Page() {
  const { familyId } = useParams({ from: "/familia/$familyId/pacientes/novo" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { setActivePatient } = useFamilyContext();
  const [loading, setLoading] = useState(false);

  async function onSubmit(data: StepPatientData) {
    setLoading(true);
    try {
      let photoPath: string | null = null;
      if (data.photoFile) {
        const ext = data.photoFile.name.split(".").pop() ?? "jpg";
        const path = `${familyId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("patient-photos")
          .upload(path, data.photoFile, { upsert: false });
        if (upErr) throw upErr;
        photoPath = path;
      }
      const { data: pat, error } = await supabase
        .from("patients")
        .insert({
          family_id: familyId,
          full_name: data.fullName,
          birth_date: data.birthDate || null,
          relation: data.relation || null,
          photo_url: photoPath,
        })
        .select("id, full_name, relation, photo_url, family_id")
        .single();
      if (error) throw error;

      setActivePatient({
        id: pat.id,
        family_id: pat.family_id,
        name: pat.full_name,
        relation: pat.relation,
        avatarUrl: pat.photo_url,
      });
      qc.invalidateQueries({ queryKey: ["patients", familyId] });
      qc.invalidateQueries({ queryKey: ["patient-counts"] });
      toast.success("Familiar adicionado");
      navigate({ to: "/familia" });
    } catch (err) {
      toast.error("Não foi possível adicionar o familiar", {
        description: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link to="/familia">
          <ArrowLeft className="h-4 w-4" /> Família
        </Link>
      </Button>
      <StepPatient onSubmit={onSubmit} loading={loading} />
    </div>
  );
}
