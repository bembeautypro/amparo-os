import { toast as sonnerToast } from "sonner";

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Algo deu errado. Tente novamente.";
}

export function toastSuccess(message: string, description?: string) {
  sonnerToast.success(message, { description, duration: 3000 });
}

export function toastError(err: unknown, retry?: () => void) {
  const msg = messageOf(err);
  sonnerToast.error(msg, {
    duration: 5000,
    action: retry
      ? {
          label: "Tentar novamente",
          onClick: () => retry(),
        }
      : undefined,
  });
}

export function toastInfo(message: string, description?: string) {
  sonnerToast(message, { description });
}

export { sonnerToast as toast };
