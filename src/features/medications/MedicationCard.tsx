import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, MoreVertical } from "lucide-react";
import { startOfDay, endOfDay, format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  fetchTodayLogsForMedication,
  markDoseTaken,
} from "./api";
import { MedicationActionsSheet } from "./MedicationActionsSheet";
import { MedicationPhoto } from "./MedicationPhoto";
import { parseSchedule, scheduledForToday } from "./utils";
import type { Medication, MedicationStatus } from "./types";

const STATUS_STYLES: Record<MedicationStatus, string> = {
  active: "bg-success/15 text-success",
  paused: "bg-warn/15 text-warn",
  ended: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<MedicationStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  ended: "Encerrado",
  archived: "Arquivado",
};

export function MedicationCard({
  medication,
  familyId,
}: {
  medication: Medication;
  familyId: string;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const qc = useQueryClient();
  const schedule = parseSchedule(medication.schedule);

  const dayStart = startOfDay(new Date());
  const dayEnd = endOfDay(new Date());

  const logsQ = useQuery({
    queryKey: [
      "med-today-logs",
      medication.id,
      format(dayStart, "yyyy-MM-dd"),
    ],
    enabled: medication.status === "active" && schedule.length > 0,
    queryFn: () =>
      fetchTodayLogsForMedication(medication.id, dayStart, dayEnd),
  });

  const takenTimes = new Set(
    (logsQ.data ?? [])
      .filter((l) => l.status === "taken")
      .map((l) => format(new Date(l.scheduled_for), "HH:mm")),
  );

  const sortedTimes = [...schedule]
    .map((s) => s.time)
    .sort((a, b) => a.localeCompare(b));
  const nextTime = sortedTimes.find((t) => !takenTimes.has(t)) ?? null;

  const checkDose = useMutation({
    mutationFn: (time: string) =>
      markDoseTaken({
        medicationId: medication.id,
        patientId: medication.patient_id,
        scheduledFor: scheduledForToday(time),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["med-today-logs", medication.id] });
      qc.invalidateQueries({ queryKey: ["dash"] });
      toast.success("Dose registrada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <Card className="relative border-border/70 p-5 shadow-soft">
        <div className="flex items-start gap-4">
          <MedicationPhoto
            path={medication.photo_url}
            className="h-14 w-14 shrink-0"
            rounded="xl"
          />
          <div className="min-w-0 flex-1 pr-8">
            <p className="truncate font-semibold leading-tight">
              {medication.name}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
              {medication.dosage && <span>{medication.dosage}</span>}
              {medication.frequency && <span>· {medication.frequency}</span>}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Badge
                variant="secondary"
                className={cn("rounded-full", STATUS_STYLES[medication.status])}
              >
                {STATUS_LABEL[medication.status]}
              </Badge>
              {sortedTimes.length === 0 ? (
                medication.status === "active" && (
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-warn/15 text-warn"
                  >
                    Sem horário
                  </Badge>
                )
              ) : (
                sortedTimes.map((t) => {
                  const taken = takenTimes.has(t);
                  return (
                    <Badge
                      key={t}
                      variant="secondary"
                      className={cn(
                        "rounded-full font-medium",
                        taken
                          ? "bg-success/15 text-success"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {taken && <Check className="mr-1 h-3 w-3" />}
                      {t}
                    </Badge>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="button"
            aria-label="Ações do medicamento"
            onClick={() => setSheetOpen(true)}
            className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        {medication.status === "active" && nextTime && (
          <Button
            type="button"
            className="mt-4 h-11 w-full gap-2"
            disabled={checkDose.isPending}
            onClick={() => checkDose.mutate(nextTime)}
          >
            <Check className="h-4 w-4" /> Marcar {nextTime} como tomado
          </Button>
        )}
      </Card>

      <MedicationActionsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        medication={medication}
        familyId={familyId}
      />
    </>
  );
}
