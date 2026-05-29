import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, PauseCircle, StopCircle, ClipboardList } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { updateMedicationStatus } from "./api";
import type { Medication } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication: Medication;
  familyId: string;
};

export function MedicationActionsSheet({
  open,
  onOpenChange,
  medication,
  familyId,
}: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmEnd, setConfirmEnd] = useState(false);

  const updateStatus = useMutation({
    mutationFn: (status: "paused" | "ended" | "active") =>
      updateMedicationStatus(medication.id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications"] });
      qc.invalidateQueries({ queryKey: ["medication", medication.id] });
      qc.invalidateQueries({ queryKey: ["dash"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    danger?: boolean;
  }[] = [
    {
      icon: Pencil,
      label: "Editar",
      onClick: () => {
        onOpenChange(false);
        navigate({
          to: "/familia/$familyId/medicamentos/$medId/editar",
          params: { familyId, medId: medication.id },
        });
      },
    },
    {
      icon: ClipboardList,
      label: "Ver histórico completo",
      onClick: () => {
        onOpenChange(false);
        navigate({
          to: "/familia/$familyId/medicamentos/$medId",
          params: { familyId, medId: medication.id },
        });
      },
    },
  ];

  if (medication.status === "active") {
    items.push({
      icon: PauseCircle,
      label: "Pausar",
      onClick: () => {
        updateStatus.mutate("paused");
        toast.success("Medicamento pausado");
      },
    });
  } else if (medication.status === "paused") {
    items.push({
      icon: PauseCircle,
      label: "Retomar",
      onClick: () => {
        updateStatus.mutate("active");
        toast.success("Medicamento reativado");
      },
    });
  }

  if (medication.status !== "ended") {
    items.push({
      icon: StopCircle,
      label: "Encerrar",
      danger: true,
      onClick: () => setConfirmEnd(true),
    });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle className="truncate">{medication.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid gap-1.5">
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <button
                  key={it.label}
                  onClick={it.onClick}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-muted ${
                    it.danger ? "text-emergency" : ""
                  }`}
                >
                  <Icon className="h-5 w-5" /> {it.label}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar {medication.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              O histórico de tomadas e alterações será preservado. Você poderá
              consultar este medicamento na aba "Encerrados".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emergency text-emergency-foreground hover:bg-emergency/90"
              onClick={() => {
                updateStatus.mutate("ended");
                setConfirmEnd(false);
                toast.success("Medicamento encerrado");
              }}
            >
              Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
