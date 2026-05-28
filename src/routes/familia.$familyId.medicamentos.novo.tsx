import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/familia/$familyId/medicamentos/novo")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <NewMedicationPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function NewMedicationPage() {
  const { familyId } = useParams({ from: "/familia/$familyId/medicamentos/novo" });
  const { activePatient, patients } = useFamilyContext();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [patientId, setPatientId] = useState(activePatient?.id ?? "");
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error("Selecione um familiar");
      if (!name.trim()) throw new Error("Informe o nome do medicamento");
      const { error } = await supabase.from("medications").insert({
        patient_id: patientId,
        name: name.trim(),
        dosage: dosage.trim() || null,
        frequency: frequency.trim() || null,
        notes: notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Medicamento adicionado");
      qc.invalidateQueries({ queryKey: ["medications"] });
      navigate({ to: `/familia/${familyId}/medicamentos` });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
        <Link to={`/familia/${familyId}/medicamentos`}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Novo medicamento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre dose, frequência e observações importantes.
        </p>
      </div>

      <Card className="border-border/70 p-6 shadow-soft">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-5"
        >
          <Field label="Familiar">
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Nome do medicamento" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Losartana"
              className="h-11"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Dose">
              <Input
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="50mg"
                className="h-11"
              />
            </Field>
            <Field label="Frequência">
              <Input
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="1x ao dia, 8h"
                className="h-11"
              />
            </Field>
          </div>

          <Field label="Observações">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tomar em jejum, evitar com álcool, etc."
              rows={3}
            />
          </Field>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => navigate({ to: `/familia/${familyId}/medicamentos` })}
            >
              Cancelar
            </Button>
            <Button type="submit" className="h-11" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando…" : "Salvar medicamento"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-emergency">*</span>}
      </Label>
      {children}
    </div>
  );
}
