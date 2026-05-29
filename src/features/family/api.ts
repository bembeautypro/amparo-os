import { supabase } from "@/integrations/supabase/client";
import type { ActivityLog, FamilyRole, Invitation, Member } from "./types";

export async function listMembers(familyId: string): Promise<Member[]> {
  const { data: members, error } = await supabase
    .from("family_members")
    .select("id, user_id, family_id, role, status, created_at")
    .eq("family_id", familyId)
    .eq("status", "active")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const userIds = (members ?? []).map((m) => m.user_id);
  let profilesMap: Record<string, { id: string; full_name: string | null; avatar_url: string | null }> = {};
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);
    profilesMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  }
  return (members ?? []).map((m) => ({
    ...(m as Member),
    profile: profilesMap[m.user_id] ?? null,
  }));
}

export async function listPendingInvitations(familyId: string): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("family_id", familyId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Invitation[];
}

export async function createInvitation(input: {
  familyId: string;
  email: string;
  role: FamilyRole;
  invitedBy: string;
}): Promise<Invitation> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from("invitations")
    .insert({
      family_id: input.familyId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      invited_by: input.invitedBy,
      expires_at: expiresAt,
    })
    .select("*")
    .single();
  if (error) throw error;
  await logActivity(input.familyId, "invitation_created", { email: input.email, role: input.role });
  return data as Invitation;
}

export async function resendInvitation(inv: Invitation): Promise<Invitation> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from("invitations")
    .update({ expires_at: expiresAt })
    .eq("id", inv.id)
    .select("*")
    .single();
  if (error) throw error;
  await logActivity(inv.family_id, "invitation_resent", { email: inv.email });
  return data as Invitation;
}

export async function cancelInvitation(inv: Invitation) {
  const { error } = await supabase
    .from("invitations")
    .update({ status: "cancelled" })
    .eq("id", inv.id);
  if (error) throw error;
  await logActivity(inv.family_id, "invitation_cancelled", { email: inv.email });
}

export async function updateMemberRole(memberId: string, role: FamilyRole, familyId: string, targetName?: string) {
  const { error } = await supabase
    .from("family_members")
    .update({ role })
    .eq("id", memberId);
  if (error) throw error;
  await logActivity(familyId, "member_role_changed", { target_name: targetName, role });
}

export async function removeMember(memberId: string, familyId: string, targetName?: string) {
  const { error } = await supabase
    .from("family_members")
    .delete()
    .eq("id", memberId);
  if (error) throw error;
  await logActivity(familyId, "member_removed", { target_name: targetName });
}

export async function logActivity(familyId: string, action: string, details?: Record<string, unknown>) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from("access_logs").insert({
    family_id: familyId,
    actor_user_id: auth.user.id,
    action,
    details: details ?? null,
  });
}

export async function listActivity(opts: {
  familyId: string;
  page: number;
  pageSize: number;
  actorId?: string;
  action?: string;
}): Promise<{ items: ActivityLog[]; hasMore: boolean }> {
  let q = supabase
    .from("access_logs")
    .select("id, family_id, actor_user_id, action, details, accessed_at")
    .eq("family_id", opts.familyId)
    .order("accessed_at", { ascending: false });
  if (opts.actorId) q = q.eq("actor_user_id", opts.actorId);
  if (opts.action) q = q.eq("action", opts.action);
  const from = opts.page * opts.pageSize;
  const to = from + opts.pageSize;
  q = q.range(from, to);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as Omit<ActivityLog, "actor">[];
  const hasMore = rows.length > opts.pageSize;
  const trimmed = rows.slice(0, opts.pageSize);
  const actorIds = Array.from(new Set(trimmed.map((r) => r.actor_user_id).filter(Boolean))) as string[];
  let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
  if (actorIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", actorIds);
    profilesMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  }
  return {
    hasMore,
    items: trimmed.map((r) => ({
      ...(r as ActivityLog),
      actor: r.actor_user_id ? profilesMap[r.actor_user_id] ?? null : null,
      details: (r.details ?? null) as Record<string, unknown> | null,
    })),
  };
}

export async function getInvitationByToken(token: string): Promise<
  | (Invitation & { family_name: string | null })
  | null
> {
  const { data, error } = await supabase
    .from("invitations")
    .select("*, families(name)")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const family = (data as { families?: { name: string | null } | null }).families ?? null;
  return { ...(data as Invitation), family_name: family?.name ?? null };
}

export async function acceptInvitation(inv: Invitation, userId: string) {
  // Insert membership
  const { error: insErr } = await supabase.from("family_members").insert({
    family_id: inv.family_id,
    user_id: userId,
    role: inv.role,
    status: "active",
  });
  if (insErr && !insErr.message.toLowerCase().includes("duplicate")) {
    throw insErr;
  }
  const { error: updErr } = await supabase
    .from("invitations")
    .update({ status: "accepted", accepted_by: userId, accepted_at: new Date().toISOString() })
    .eq("id", inv.id);
  if (updErr) throw updErr;
  await logActivity(inv.family_id, "invitation_accepted", { email: inv.email });
}

export function buildInviteUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/convite/${token}`;
}
