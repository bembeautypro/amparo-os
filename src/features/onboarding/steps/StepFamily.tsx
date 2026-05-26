import { useState } from "react";
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
import { Loader2 } from "lucide-react";

export type MemberRelation = "child" | "spouse" | "caregiver" | "other";

export type StepFamilyData = {
  name: string;
  relation: MemberRelation;
};

const RELATIONS: { value: MemberRelation; label: string }[] = [
  { value: "child", label: "Filho(a)" },
  { value: "spouse", label: "Cônjuge" },
  { value: "caregiver", label: "Cuidador(a)" },
  { value: "other", label: "Outro" },
];

export function StepFamily({
  initial,
  onSubmit,
  loading,
}: {
  initial?: StepFamilyData;
  onSubmit: (data: StepFamilyData) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [relation, setRelation] = useState<MemberRelation>(initial?.relation ?? "child");
  const valid = name.trim().length >= 2;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit({ name: name.trim(), relation });
      }}
      className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
    >
      <h1 className="text-2xl font-semibold tracking-tight">Crie sua família</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Uma família agrupa todas as pessoas que vocês cuidam juntos.
      </p>

      <div className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="family-name">Nome da família</Label>
          <Input
            id="family-name"
            placeholder="Ex: Família Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11"
            maxLength={80}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="relation">Seu papel</Label>
          <Select value={relation} onValueChange={(v) => setRelation(v as MemberRelation)}>
            <SelectTrigger id="relation" className="h-11">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!valid || loading}
        className="mt-8 h-12 w-full text-base"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Continuar
      </Button>
    </form>
  );
}
