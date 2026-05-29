import { useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Camera, CalendarIcon, Loader2 } from "lucide-react";

export type StepPatientData = {
  fullName: string;
  birthDate: string; // ISO YYYY-MM-DD
  relation: string;
  photoFile: File | null;
};

export function StepPatient({
  onSubmit,
  loading,
}: {
  onSubmit: (data: StepPatientData) => void;
  loading: boolean;
}) {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [relation, setRelation] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const valid = fullName.trim().length >= 2;

  function handleFile(f: File | null) {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      alert("Foto deve ter no máximo 5MB.");
      return;
    }
    setPhotoFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid)
          onSubmit({
            fullName: fullName.trim(),
            birthDate: birthDate ? format(birthDate, "yyyy-MM-dd") : "",
            relation: relation.trim(),
            photoFile,
          });
      }}
      className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
    >
      <h1 className="text-2xl font-semibold tracking-tight">
        Quem você quer organizar primeiro?
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Você pode adicionar mais familiares depois.
      </p>

      <div className="mt-8 flex flex-col items-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative"
        >
          <Avatar className="h-24 w-24 border-2 border-dashed border-border bg-muted">
            {preview && <AvatarImage src={preview} alt="Foto do familiar" />}
            <AvatarFallback className="bg-muted text-muted-foreground">
              <Camera className="h-7 w-7" />
            </AvatarFallback>
          </Avatar>
          <span className="absolute inset-x-0 -bottom-7 text-center text-xs font-medium text-primary">
            {preview ? "Trocar foto" : "Adicionar foto"}
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="mt-12 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="full-name">Nome completo</Label>
          <Input
            id="full-name"
            placeholder="Ex: Maria Aparecida Silva"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={120}
            className="h-11"
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="birth">Data de nascimento</Label>
            <Input
              id="birth"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kinship">Grau de parentesco</Label>
            <Input
              id="kinship"
              placeholder="Ex: Mãe, Pai, Avó"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              maxLength={60}
              className="h-11"
            />
          </div>
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
