import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve a patient-photos object PATH (e.g. "family-uuid/file.jpg") to a
 * short-lived signed URL. The bucket is private; we never expose public URLs.
 *
 * Accepts legacy full URLs too — if `pathOrUrl` already starts with "http",
 * it is returned as-is so old data keeps rendering until re-uploaded.
 */
export function useSignedPhotoUrl(pathOrUrl: string | null | undefined) {
  return useQuery({
    queryKey: ["patient-photo-url", pathOrUrl],
    enabled: !!pathOrUrl,
    staleTime: 1000 * 60 * 30, // 30 min (signed URL expires in 1h)
    queryFn: async () => {
      if (!pathOrUrl) return null;
      if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

      const { data, error } = await supabase.storage
        .from("patient-photos")
        .createSignedUrl(pathOrUrl, 60 * 60); // 1h

      if (error) return null;
      return data.signedUrl;
    },
  });
}
