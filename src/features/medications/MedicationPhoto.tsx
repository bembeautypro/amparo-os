import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pill, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function useMedicationPhotoUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["med-photo", path],
    enabled: !!path,
    staleTime: 55 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    queryFn: async () => {
      if (!path) return null;
      if (/^https?:\/\//i.test(path)) return path;
      const { data, error } = await supabase.storage
        .from("medication-photos")
        .createSignedUrl(path, 60 * 60);
      if (error) throw error;
      return data?.signedUrl ?? null;
    },
  });
}

type Props = {
  path: string | null | undefined;
  className?: string;
  rounded?: "lg" | "xl" | "full";
  alt?: string;
  zoomable?: boolean;
  fallback?: React.ReactNode;
};

const roundedMap = {
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export function MedicationPhoto({
  path,
  className,
  rounded = "xl",
  alt = "Foto da caixa do medicamento",
  zoomable = false,
  fallback,
}: Props) {
  const [open, setOpen] = useState(false);
  const { data: url, isPending } = useMedicationPhotoUrl(path);

  const base = cn(
    "overflow-hidden border border-border bg-muted",
    roundedMap[rounded],
    className,
  );

  if (!path) {
    return (
      <div className={cn(base, "grid place-items-center text-muted-foreground")}>
        {fallback ?? <Pill className="h-1/2 w-1/2 opacity-60" />}
      </div>
    );
  }

  if (isPending || !url) {
    return <Skeleton className={cn(base, "animate-pulse")} />;
  }

  const img = (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className={cn("h-full w-full object-cover", zoomable && "cursor-zoom-in")}
    />
  );

  return (
    <>
      <div className={base} onClick={zoomable ? () => setOpen(true) : undefined}>
        {img}
      </div>
      {zoomable && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-1.5 text-foreground shadow-soft backdrop-blur"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={url}
              alt={alt}
              className="max-h-[85vh] w-full object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
