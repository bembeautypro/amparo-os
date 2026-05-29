import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, MessageCircle, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useAuth } from "@/contexts/AuthContext";
import { buildInviteUrl, createInvitation } from "./api";
import { ROLE_OPTIONS } from "./utils";
import type { FamilyRole, Invitation } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  familyName: string;
};

export function InviteDialog({ open, onOpenChange, familyId, familyName }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<FamilyRole>("viewer");
  const [created, setCreated] = useState<Invitation | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      createInvitation({ familyId, email, role, invitedBy: user!.id }),
    onSuccess: (inv) => {
      qc.invalidateQueries({ queryKey: ["invitations", familyId] });
      setCreated(inv);
    },
    onError: (e: Error) =>
      toast.error("Não foi possível criar o convite", { description: e.message }),
  });

  function handleClose(o: boolean) {
    if (!o) {
      setEmail("");
      setRole("viewer");
      setCreated(null);
    }
    onOpenChange(o);
  }

  const url = created ? buildInviteUrl(created.token) : "";
  const waText = `Você foi convidado para o Amparo${familyName ? ` (família ${familyName})` : ""}: ${url}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{created ? "Convite criado" : "Convidar pessoa"}</DialogTitle>
          <DialogDescription>
            {created
              ? "Compartilhe o link com a pessoa convidada. Ele expira em 7 dias."
              : "Envie um convite por email para adicionar alguém à família."}
          </DialogDescription>
        </DialogHeader>

        {!created ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.includes("@")) return toast.error("Informe um email válido.");
              mut.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="pessoa@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Papel</Label>
              <Select value={role} onValueChange={(v) => setRole(v as FamilyRole)}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={mut.isPending} className="w-full">
                {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Enviar convite
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm break-all">
              {url}
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(url);
                toast.success("Link copiado!");
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar link
            </Button>
            <Button asChild className="w-full">
              <a href={waHref} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                Compartilhar no WhatsApp
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
