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

export const Route = createFileRoute("/familia/$familyId/agenda/novo")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <NewAppointmentPage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function NewAppointmentPage() {
  const { familyId } = useParams({ from: "/familia/$familyId/agenda/novo" });
  const { activePatient, patients } = useFamilyContext();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [patientId, setPatientId] = useState(activePatient?.id ?? "");
  const [title, setTitle] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [doctor, setDoctor] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error("Selecione um familiar");
      if (!title.trim()) throw new Error("Informe o título da consulta");
      if (!date || !time) throw new Error("Informe data e hora");
      const scheduled_at = new Date(`${date}T${time}`).toISOString();
      const { error } = await supabase.from("appointments").insert({
        patient_id: patientId,
        title: title.trim(),
        specialty: specialty.trim() || null,
        doctor_name: doctor.trim() || null,
        location: location.trim() || null,
        scheduled_at,
        notes: notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Consulta agendada");
      qc.invalidateQueries({ queryKey: ["appointments"] });
      navigate({ to: "/agenda" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
        <Link to="/agenda">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Nova consulta
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre uma consulta, exame ou retorno.
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

          <Field label="Título" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Consulta cardiologista"
              className="h-11"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Especialidade">
              <Input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Cardiologia"
                className="h-11"
              />
            </Field>
            <Field label="Médico(a)">
              <Input
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                placeholder="Dr(a). Nome"
                className="h-11"
              />
            </Field>
          </div>

          <Field label="Local">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Hospital, endereço ou link"
              className="h-11"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Data" required>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11"
              />
            </Field>
            <Field label="Hora" required>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11"
              />
            </Field>
          </div>

          <Field label="Observações">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Levar exames, jejum, etc."
              rows={3}
            />
          </Field>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => navigate({ to: "/agenda" })}
            >
              Cancelar
            </Button>
            <Button type="submit" className="h-11" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando…" : "Salvar consulta"}
            </Button>
          </div>
        </form>
      </Card>

      {/* familyId reserved for future scoping */}
      <input type="hidden" value={familyId} readOnly />
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
