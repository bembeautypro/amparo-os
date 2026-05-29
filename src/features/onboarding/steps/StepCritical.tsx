import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2, X } from "lucide-react";

const BLOOD_TYPES = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
  { value: "unknown", label: "Não sei" },
] as const;

export type StepCriticalData = {
  bloodType: string;
  allergies: string[];
  conditions: string[];
  insuranceName: string;
  insuranceNumber: string;
  emergencyName: string;
  emergencyPhone: string;
};

export function StepCritical({
  onSubmit,
  loading,
}: {
  onSubmit: (data: StepCriticalData) => void;
  loading: boolean;
}) {
  const [bloodType, setBloodType] = useState<string>("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [insuranceName, setInsuranceName] = useState("");
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          bloodType,
          allergies,
          conditions,
          insuranceName: insuranceName.trim(),
          insuranceNumber: insuranceNumber.trim(),
          emergencyName: emergencyName.trim(),
          emergencyPhone: emergencyPhone.trim(),
        });
      }}
      className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
    >
      <h1 className="text-2xl font-semibold tracking-tight">
        Preencha o essencial para emergências
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Esses dados aparecem na Central de Emergência. Você pode adicionar agora
        ou depois.
      </p>

      <div className="mt-8 space-y-8">
        {/* === Para emergências === */}
        <section className="space-y-5">
          <SectionDivider title="Para emergências" />

          <div className="space-y-1.5">
            <Label htmlFor="blood">Tipo sanguíneo</Label>
            <Select value={bloodType} onValueChange={setBloodType}>
              <SelectTrigger id="blood" className="h-11">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_TYPES.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TagsField
            label="Alergias conhecidas"
            critical
            placeholder="Ex: Penicilina, AAS, amendoim..."
            values={allergies}
            onChange={setAllergies}
          />

          <TagsField
            label="Condições médicas"
            placeholder="Ex: Hipertensão, Diabetes tipo 2..."
            values={conditions}
            onChange={setConditions}
          />
        </section>

        {/* === Convênio === */}
        <section className="space-y-5">
          <SectionDivider title="Convênio" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ins-name">Nome do convênio</Label>
              <Input
                id="ins-name"
                placeholder="Ex: Unimed"
                value={insuranceName}
                onChange={(e) => setInsuranceName(e.target.value)}
                maxLength={80}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ins-number">Número da carteirinha</Label>
              <Input
                id="ins-number"
                placeholder="0000 0000 0000 0000"
                value={insuranceNumber}
                onChange={(e) => setInsuranceNumber(e.target.value)}
                maxLength={60}
                className="h-11"
              />
            </div>
          </div>
        </section>

        {/* === Contato de emergência === */}
        <section className="space-y-5">
          <SectionDivider title="Contato de emergência" critical />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="em-name">Nome do contato</Label>
              <Input
                id="em-name"
                placeholder="Ex: Maria Silva"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                maxLength={80}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="em-phone">Telefone</Label>
              <Input
                id="em-phone"
                placeholder="(11) 90000-0000"
                type="tel"
                inputMode="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(maskPhoneBR(e.target.value))}
                maxLength={16}
                className="h-11"
              />
            </div>
          </div>
        </section>
      </div>

      <Button type="submit" disabled={loading} className="mt-8 h-12 w-full text-base">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Continuar
      </Button>
    </form>
  );
}

function SectionDivider({ title, critical }: { title: string; critical?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
      {critical && <CriticalBadge />}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function maskPhoneBR(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function CriticalBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emergency-soft px-2 py-0.5 text-[11px] font-medium text-emergency">
      <AlertCircle className="h-3 w-3" /> Importante para emergências
    </span>
  );
}

function TagsField({
  label,
  placeholder,
  values,
  onChange,
  critical,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (v: string[]) => void;
  critical?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function add(text: string) {
    const t = text.trim();
    if (!t) return;
    if (values.some((v) => v.toLowerCase() === t.toLowerCase())) return;
    if (t.length > 60) return;
    onChange([...values, t]);
    setDraft("");
  }
  function remove(i: number) {
    onChange(values.filter((_, idx) => idx !== i));
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && values.length) {
      remove(values.length - 1);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        {critical && <CriticalBadge />}
      </div>
      <div className="min-h-11 rounded-md border border-input bg-background px-2 py-1.5 transition-shadow focus-within:ring-2 focus-within:ring-ring/40">
        <div className="flex flex-wrap items-center gap-1.5">
          {values.map((v, i) => (
            <Badge
              key={`${v}-${i}`}
              variant="secondary"
              className="gap-1 bg-primary-soft px-2 py-1 text-primary"
            >
              {v}
              <button
                type="button"
                onClick={() => remove(i)}
                className="hover:opacity-70"
                aria-label={`Remover ${v}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            onBlur={() => add(draft)}
            placeholder={values.length === 0 ? placeholder : ""}
            className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
            maxLength={60}
          />
        </div>
      </div>
    </div>
  );
}
