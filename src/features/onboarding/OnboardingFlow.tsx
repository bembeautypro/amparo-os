import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepWelcome } from "./steps/StepWelcome";
import { StepFamily, type StepFamilyData } from "./steps/StepFamily";
import { StepPatient, type StepPatientData } from "./steps/StepPatient";
import { StepCritical, type StepCriticalData } from "./steps/StepCritical";
import { StepFirstAction } from "./steps/StepFirstAction";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TOTAL_STEPS = 5;

export function OnboardingFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [familyData, setFamilyData] = useState<StepFamilyData | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);

  function back() {
    if (step > 1) setStep((s) => s - 1);
  }

  // --- Step 2: criar família + family_member ---
  async function submitFamily(data: StepFamilyData) {
    if (!user) return;
    setLoading(true);
    try {
      const { data: fam, error: famErr } = await supabase
        .from("families")
        .insert({ name: data.name, created_by: user.id })
        .select("id")
        .single();
      if (famErr) throw famErr;

      const { error: memErr } = await supabase.from("family_members").insert({
        family_id: fam.id,
        user_id: user.id,
        role: "admin",
        relation: data.relation,
        status: "active",
      });
      if (memErr) throw memErr;

      setFamilyData(data);
      setFamilyId(fam.id);
      setStep(3);
    } catch (err: any) {
      toast.error("Não foi possível criar a família", { description: err.message });
    } finally {
      setLoading(false);
    }
  }

  // --- Step 3: criar paciente (+ upload foto) ---
  async function submitPatient(data: StepPatientData) {
    if (!user || !familyId) return;
    setLoading(true);
    try {
      let photoUrl: string | null = null;

      if (data.photoFile) {
        const ext = data.photoFile.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("patient-photos")
          .upload(path, data.photoFile, { upsert: false });
        if (upErr) throw upErr;
        photoUrl = supabase.storage.from("patient-photos").getPublicUrl(path).data.publicUrl;
      }

      const { data: pat, error } = await supabase
        .from("patients")
        .insert({
          family_id: familyId,
          full_name: data.fullName,
          birth_date: data.birthDate || null,
          relation: data.relation || null,
          photo_url: photoUrl,
        })
        .select("id")
        .single();
      if (error) throw error;

      setPatientId(pat.id);
      setStep(4);
    } catch (err: any) {
      toast.error("Não foi possível adicionar o familiar", { description: err.message });
    } finally {
      setLoading(false);
    }
  }

  // --- Step 4: dados críticos ---
  async function submitCritical(data: StepCriticalData) {
    if (!patientId) return;
    setLoading(true);
    try {
      const { error: upErr } = await supabase
        .from("patients")
        .update({
          blood_type: (data.bloodType || null) as
            | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "unknown" | null,
          insurance_name: data.insuranceName || null,
          insurance_number: data.insuranceNumber || null,
        })
        .eq("id", patientId);
      if (upErr) throw upErr;

      if (data.allergies.length) {
        const { error } = await supabase.from("patient_allergies").insert(
          data.allergies.map((name) => ({
            patient_id: patientId,
            name,
            severity: "high" as const,
          })),
        );
        if (error) throw error;
      }

      if (data.conditions.length) {
        const { error } = await supabase.from("patient_conditions").insert(
          data.conditions.map((name) => ({ patient_id: patientId, name })),
        );
        if (error) throw error;
      }

      if (data.emergencyName.trim() && data.emergencyPhone.trim()) {
        const { error } = await supabase.from("emergency_contacts").insert({
          patient_id: patientId,
          name: data.emergencyName.trim(),
          phone: data.emergencyPhone.trim(),
        });
        if (error) throw error;
      }

      setStep(5);
    } catch (err: any) {
      toast.error("Não foi possível salvar", { description: err.message });
    } finally {
      setLoading(false);
    }
  }

  function finish(target: string) {
    toast.success("Tudo pronto!", { description: "Bem-vindo ao Amparo." });
    navigate({ to: target });
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={back}
            disabled={step === 1 || loading}
            aria-label="Voltar"
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Heart className="h-4 w-4" fill="currentColor" />
            </span>
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Passo {step} de {TOTAL_STEPS}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((step / TOTAL_STEPS) * 100)}%
                </p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          {step === 1 && <StepWelcome onNext={() => setStep(2)} />}
          {step === 2 && (
            <StepFamily
              initial={familyData ?? undefined}
              onSubmit={submitFamily}
              loading={loading}
            />
          )}
          {step === 3 && <StepPatient onSubmit={submitPatient} loading={loading} />}
          {step === 4 && (
            <StepCritical onSubmit={submitCritical} loading={loading} />
          )}
          {step === 5 && familyId && (
            <StepFirstAction familyId={familyId} onChoose={finish} />
          )}
        </div>
      </main>
    </div>
  );
}
