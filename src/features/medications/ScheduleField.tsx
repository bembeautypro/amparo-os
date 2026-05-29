import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FREQ_OPTIONS, type FreqValue, type ScheduleEntry } from "./types";

type Props = {
  frequency: FreqValue | "";
  schedule: ScheduleEntry[];
  freqOther: string;
  onScheduleChange: (s: ScheduleEntry[]) => void;
  onFreqOtherChange: (s: string) => void;
};

const DEFAULT_TIMES: Record<number, string[]> = {
  1: ["08:00"],
  2: ["08:00", "20:00"],
  3: ["08:00", "14:00", "20:00"],
  4: ["06:00", "12:00", "18:00", "00:00"],
};

export function defaultsForSlots(slots: number): ScheduleEntry[] {
  const t = DEFAULT_TIMES[slots] ?? [];
  return t.map((time) => ({ time }));
}

export function ScheduleField({
  frequency,
  schedule,
  freqOther,
  onScheduleChange,
  onFreqOtherChange,
}: Props) {
  if (!frequency) return null;
  const def = FREQ_OPTIONS.find((f) => f.value === frequency);
  if (!def) return null;

  if (def.slots === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem horário fixo — você poderá registrar a tomada quando ocorrer.
      </p>
    );
  }

  if (def.slots === -1) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Descreva o padrão</Label>
        <Textarea
          value={freqOther}
          onChange={(e) => onFreqOtherChange(e.target.value)}
          placeholder="Ex: 1 comprimido a cada 8 horas, por 7 dias"
          rows={3}
        />
      </div>
    );
  }

  const items = Array.from({ length: def.slots }).map(
    (_, i) => schedule[i] ?? { time: DEFAULT_TIMES[def.slots]?.[i] ?? "08:00" },
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((entry, idx) => (
        <div key={idx} className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Horário {idx + 1}
          </Label>
          <Input
            type="time"
            value={entry.time}
            onChange={(e) => {
              const next = [...items];
              next[idx] = { time: e.target.value };
              onScheduleChange(next);
            }}
            className="h-11"
          />
        </div>
      ))}
    </div>
  );
}
