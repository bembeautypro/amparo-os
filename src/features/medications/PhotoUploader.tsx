import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  patientId: string;
  value: string | null;
  onChange: (path: string | null) => void;
};

export function PhotoUploader({ patientId, value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    if (/^https?:\/\//i.test(value)) {
      setPreviewUrl(value);
      return;
    }
    (async () => {
      const { data } = await supabase.storage
        .from("medication-photos")
        .createSignedUrl(value, 60 * 60);
      if (active) setPreviewUrl(data?.signedUrl ?? null);
    })();
    return () => {
      active = false;
    };
  }, [value]);

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${patientId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("medication-photos")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      onChange(path);
      toast.success("Foto enviada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Foto"
            className="h-32 w-32 rounded-xl border border-border object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 rounded-full bg-emergency p-1 text-emergency-foreground shadow-soft"
            aria-label="Remover foto"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
          {previewUrl ? "Trocar foto" : "Adicionar foto"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        <Camera className="mr-1 inline h-3 w-3" />
        Tire foto da caixa ou da receita para consulta rápida.
      </p>
    </div>
  );
}
