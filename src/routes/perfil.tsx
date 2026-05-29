import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Camera,
  LogOut,
  Mail,
  Trash2,
  Users,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { PageHeader } from "@/components/ui-extras";
import { LoadingButton } from "@/components/LoadingButton";
import { toastSuccess, toastError } from "@/lib/toast";
import {
  fetchMyProfile,
  fetchSoleAdminFamilies,
  getProfilePhotoUrl,
  updateMyProfile,
  uploadProfilePhoto,
} from "@/features/profile/api";
import { deleteMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/perfil")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <ProfilePage />
      </AppLayout>
    </ProtectedRoute>
  ),
});

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function ProfilePage() {
  const { user, signOut } = useAuth();
  const { families, activeFamily, setActiveFamily } = useFamilyContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const userId = user?.id ?? "";

  const profileQ = useQuery({
    queryKey: ["my-profile", userId],
    queryFn: () => fetchMyProfile(userId),
    enabled: !!userId,
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profileQ.data) {
      setFullName(profileQ.data.full_name ?? "");
      setPhone(profileQ.data.phone ?? "");
      void getProfilePhotoUrl(profileQ.data.avatar_url).then(setPhotoUrl);
    }
  }, [profileQ.data]);

  const saveMutation = useMutation({
    mutationFn: (vars: { full_name: string; phone: string }) =>
      updateMyProfile(userId, vars),
    onSuccess: () => {
      toastSuccess("Perfil atualizado.");
      void queryClient.invalidateQueries({ queryKey: ["my-profile", userId] });
    },
    onError: (err) => toastError(err, () => saveMutation.mutate({ full_name: fullName, phone })),
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => uploadProfilePhoto(userId, file),
    onSuccess: async (path) => {
      await updateMyProfile(userId, { avatar_url: path });
      toastSuccess("Foto atualizada.");
      const signed = await getProfilePhotoUrl(path);
      setPhotoUrl(signed);
      void queryClient.invalidateQueries({ queryKey: ["my-profile", userId] });
    },
    onError: (err) => toastError(err),
  });

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) photoMutation.mutate(file);
    e.target.value = "";
  }

  const display = fullName || user?.email || "";
  const initials = initialsOf(display) || "U";

  return (
    <div className="space-y-8">
      <PageHeader title="Perfil" description="Sua conta e dados pessoais." />

      {/* Foto + nome/contato */}
      <Card className="border-border/70 p-6 shadow-soft">
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <div className="relative">
            <Avatar className="h-24 w-24">
              {photoUrl && <AvatarImage src={photoUrl} alt={display} />}
              <AvatarFallback className="bg-primary-soft text-primary text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full border-border bg-card shadow-soft"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoMutation.isPending}
              aria-label="Alterar foto de perfil"
            >
              <Camera className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <div className="grid w-full gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="profile-name">Nome completo</Label>
              <Input
                id="profile-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome"
                className="h-11"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="profile-email">Email</Label>
              <div className="flex h-11 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" aria-hidden />
                <span className="truncate">{user?.email}</span>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="profile-phone">Telefone</Label>
              <Input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-0000"
                className="h-11"
                inputMode="tel"
              />
            </div>

            <div className="flex justify-end">
              <LoadingButton
                loading={saveMutation.isPending}
                loadingText="Salvando..."
                onClick={() =>
                  saveMutation.mutate({ full_name: fullName.trim(), phone: phone.trim() })
                }
                className="h-11"
              >
                Salvar alterações
              </LoadingButton>
            </div>
          </div>
        </div>
      </Card>

      {/* Famílias */}
      <Card className="border-border/70 p-6 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4 text-primary" />
          Minhas famílias
        </div>
        <div className="mt-4 space-y-2">
          {families.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma família ainda.</p>
          ) : (
            families.map((f) => {
              const active = activeFamily?.id === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFamily(f)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    active
                      ? "border-primary/40 bg-primary-soft text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <span className="font-medium">{f.name}</span>
                  {active && <span className="text-xs font-semibold">Ativa</span>}
                </button>
              );
            })
          )}
        </div>
      </Card>

      {/* Ações de conta */}
      <div className="space-y-3">
        <SignOutSection onSignOut={async () => {
          await signOut();
          navigate({ to: "/login" });
        }} />

        <DeleteAccountSection
          userId={userId}
          userEmail={user?.email ?? ""}
          onDeleted={async () => {
            await signOut();
            navigate({ to: "/login" });
          }}
        />
      </div>
    </div>
  );
}

function SignOutSection({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        className="h-11 w-full gap-2 sm:w-auto"
        onClick={() => setOpen(true)}
      >
        <LogOut className="h-4 w-4" /> Sair da conta
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Você precisará fazer login novamente para acessar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              onClick={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  await onSignOut();
                } finally {
                  setLoading(false);
                }
              }}
            >
              Sim, sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DeleteAccountSection({
  userId,
  userEmail,
  onDeleted,
}: {
  userId: string;
  userEmail: string;
  onDeleted: () => Promise<void>;
}) {
  const soleAdminQ = useQuery({
    queryKey: ["sole-admin-families", userId],
    queryFn: () => fetchSoleAdminFamilies(userId),
    enabled: !!userId,
  });
  const deleteFn = useServerFn(deleteMyAccount);

  const [confirm1Open, setConfirm1Open] = useState(false);
  const [confirm2Open, setConfirm2Open] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  const deleteMutation = useMutation({
    mutationFn: () => deleteFn(),
    onSuccess: async () => {
      toastSuccess("Conta excluída.");
      await onDeleted();
    },
    onError: (err) => toastError(err, () => deleteMutation.mutate()),
  });

  if (soleAdminQ.isLoading) {
    return (
      <div className="h-11 w-full animate-pulse rounded-md bg-muted/40 sm:w-64" />
    );
  }

  const blockingFamilies = soleAdminQ.data ?? [];
  if (blockingFamilies.length > 0) {
    return (
      <Card className="border-warn/30 bg-warn-soft p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warn" aria-hidden />
          <div className="min-w-0 space-y-3">
            <div>
              <p className="text-sm font-semibold text-warn-foreground">
                Você é o único administrador de {blockingFamilies.length === 1 ? "uma família" : `${blockingFamilies.length} famílias`}.
              </p>
              <p className="mt-1 text-sm text-warn-foreground/80">
                Promova outro membro a admin antes de excluir sua conta:
              </p>
              <ul className="mt-2 space-y-1 text-sm font-medium text-warn-foreground">
                {blockingFamilies.map((f) => (
                  <li key={f.familyId}>• {f.familyName}</li>
                ))}
              </ul>
            </div>
            <Button asChild variant="outline" className="h-10 border-warn/40 bg-card">
              <Link
                to="/familia/$familyId/membros"
                params={{ familyId: blockingFamilies[0].familyId }}
              >
                Gerenciar família
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        className="h-11 w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
        onClick={() => setConfirm1Open(true)}
      >
        <Trash2 className="h-4 w-4" /> Excluir minha conta
      </Button>

      {/* 1ª confirmação */}
      <AlertDialog open={confirm1Open} onOpenChange={setConfirm1Open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                setConfirm1Open(false);
                setEmailInput("");
                setConfirm2Open(true);
              }}
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 2ª confirmação: digitar email */}
      <AlertDialog open={confirm2Open} onOpenChange={(o) => !deleteMutation.isPending && setConfirm2Open(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirme com seu email</AlertDialogTitle>
            <AlertDialogDescription>
              Digite <strong>{userEmail}</strong> para confirmar a exclusão da conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-1.5 py-2">
            <Label htmlFor="delete-confirm-email">Email</Label>
            <Input
              id="delete-confirm-email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={userEmail}
              autoComplete="off"
              className="h-11"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                emailInput.trim().toLowerCase() !== userEmail.toLowerCase() ||
                deleteMutation.isPending
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate();
              }}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Sim, excluir minha conta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
