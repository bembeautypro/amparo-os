import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const online = useOnlineStatus();
  const queryClient = useQueryClient();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      void queryClient.invalidateQueries();
    }
  }, [online, queryClient]);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-16 z-20 flex items-center gap-2 border-b border-warn/30 bg-warn-soft px-4 py-2 text-sm text-warn-foreground"
    >
      <WifiOff className="h-4 w-4 flex-shrink-0 text-warn" aria-hidden />
      <span className="leading-tight">
        Sem conexão — exibindo dados salvos. Alterações serão sincronizadas ao
        reconectar.
      </span>
    </div>
  );
}
