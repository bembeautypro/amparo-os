import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCog, Trash2, History, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { removeMember, updateMemberRole } from "./api";
import { ROLE_OPTIONS } from "./utils";
import type { FamilyRole, Member } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
  familyId: string;
  isAdmin: boolean;
};

export function MemberActionsSheet({ open, onOpenChange, member, familyId, isAdmin }: Props) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editingRole, setEditingRole] = useState(false);
  const [role, setRole] = useState<FamilyRole>(member.role);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const updateMut = useMutation({
    mutationFn: () => updateMemberRole(member.id, role, familyId, member.profile?.full_name ?? undefined),
    onSuccess: () => {
      toast.success("Papel atualizado");
      qc.invalidateQueries({ queryKey: ["members", familyId] });
      setEditingRole(false);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error("Erro ao atualizar", { description: e.message }),
  });

  const removeMut = useMutation({
    mutationFn: () => removeMember(member.id, familyId, member.profile?.full_name ?? undefined),
    onSuccess: () => {
      toast.success("Membro removido");
      qc.invalidateQueries({ queryKey: ["members", familyId] });
      setConfirmRemove(false);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error("Erro ao remover", { description: e.message }),
  });

  const name = member.profile?.full_name ?? "Membro";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>{name}</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-2">
            {isAdmin && editingRole ? (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="space-y-1.5">
                  <Label>Novo papel</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as FamilyRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setEditingRole(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={updateMut.isPending}
                    onClick={() => updateMut.mutate()}
                  >
                    {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              isAdmin && (
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12"
                  onClick={() => setEditingRole(true)}
                >
                  <UserCog className="mr-3 h-5 w-5" />
                  Alterar papel
                </Button>
              )
            )}

            <Button
              variant="ghost"
              className="w-full justify-start h-12"
              onClick={() => {
                onOpenChange(false);
                navigate({
                  to: "/familia/$familyId/membros/atividade",
                  params: { familyId },
                  search: { actor: member.user_id } as never,
                });
              }}
            >
              <History className="mr-3 h-5 w-5" />
              Ver atividade recente
            </Button>

            {isAdmin && (
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-destructive hover:text-destructive"
                onClick={() => setConfirmRemove(true)}
              >
                <Trash2 className="mr-3 h-5 w-5" />
                Remover da família
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta pessoa perderá acesso à família imediatamente. O histórico de atividade será preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                removeMut.mutate();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
