import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Deletes the authenticated user's account.
 * Cascade FK relations on profile / family_members handle cleanup.
 * Server-side guard: re-checks sole-admin status to prevent client tampering.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    // Re-verify the user is not the sole admin of any family
    const { data: adminFamilies, error: famErr } = await supabaseAdmin
      .from("family_members")
      .select("family_id, families:family_id(name)")
      .eq("user_id", userId)
      .eq("role", "admin")
      .eq("status", "active");

    if (famErr) throw new Error(famErr.message);

    for (const row of adminFamilies ?? []) {
      const { count, error: countErr } = await supabaseAdmin
        .from("family_members")
        .select("id", { count: "exact", head: true })
        .eq("family_id", row.family_id)
        .eq("role", "admin")
        .eq("status", "active")
        .neq("user_id", userId);
      if (countErr) throw new Error(countErr.message);
      if ((count ?? 0) === 0) {
        const famName =
          (row as unknown as { families: { name: string } | null }).families
            ?.name ?? "uma família";
        throw new Error(
          `Você ainda é o único administrador de "${famName}". Promova outro membro antes de excluir sua conta.`,
        );
      }
    }

    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delErr) throw new Error(delErr.message);

    return { success: true };
  });
