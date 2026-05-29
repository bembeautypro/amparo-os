import { AvatarImage } from "@/components/ui/avatar";
import { useSignedPhotoUrl } from "@/hooks/useSignedPhotoUrl";

/**
 * Resolves a patient-photos object path to a signed URL and renders it
 * inside the shadcn Avatar slot. Returns null while loading or on error,
 * so the surrounding <Avatar> falls back to <AvatarFallback>.
 */
export function PatientAvatarImage({
  path,
  alt,
}: {
  path: string | null | undefined;
  alt: string;
}) {
  const { data: url } = useSignedPhotoUrl(path);
  if (!url) return null;
  return <AvatarImage src={url} alt={alt} />;
}
