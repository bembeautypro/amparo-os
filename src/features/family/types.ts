export type FamilyRole = "admin" | "editor" | "viewer" | "caregiver" | "doctor" | "member";

export type Member = {
  id: string;
  user_id: string;
  family_id: string;
  role: FamilyRole;
  status: "active" | "invited";
  created_at: string;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type Invitation = {
  id: string;
  family_id: string;
  email: string;
  role: FamilyRole;
  token: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  invited_by: string;
  expires_at: string;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  family_id: string | null;
  actor_user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  accessed_at: string;
  actor: { full_name: string | null; avatar_url: string | null } | null;
};
