import { supabase } from "@/integrations/supabase/client";

export type UserProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
};

export async function fetchMyProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, phone")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as UserProfile | null;
}

export async function updateMyProfile(
  userId: string,
  patch: Partial<Pick<UserProfile, "full_name" | "phone" | "avatar_url">>,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId);
  if (error) throw error;
}

export type SoleAdminFamily = { familyId: string; familyName: string };

/**
 * Lists families where the current user is admin AND is the only admin.
 * Used to block account deletion when the user must transfer ownership first.
 */
export async function fetchSoleAdminFamilies(
  userId: string,
): Promise<SoleAdminFamily[]> {
  const { data: myAdminRows, error } = await supabase
    .from("family_members")
    .select("family_id, families:family_id(name)")
    .eq("user_id", userId)
    .eq("role", "admin")
    .eq("status", "active");
  if (error) throw error;

  const sole: SoleAdminFamily[] = [];
  for (const row of myAdminRows ?? []) {
    const { count, error: countErr } = await supabase
      .from("family_members")
      .select("id", { count: "exact", head: true })
      .eq("family_id", row.family_id)
      .eq("role", "admin")
      .eq("status", "active")
      .neq("user_id", userId);
    if (countErr) throw countErr;
    if ((count ?? 0) === 0) {
      const fam = (row as unknown as { families: { name: string } | null }).families;
      sole.push({
        familyId: row.family_id as string,
        familyName: fam?.name ?? "Família",
      });
    }
  }
  return sole;
}

export async function uploadProfilePhoto(
  userId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("profile-photos")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) throw upErr;
  return path;
}

export async function getProfilePhotoUrl(
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from("profile-photos")
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data?.signedUrl ?? null;
}
