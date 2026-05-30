// Edge function: log-emergency-access
// Validates emergency token, returns aggregated patient data (service_role,
// bypassing RLS so anon visitors can read the public emergency page) and
// records the access in access_logs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const { token } = await req.json().catch(() => ({}));
    if (!token || typeof token !== "string") {
      return json({ error: "Missing token" }, 400);
    }

    // Validate token
    const { data: link, error: linkErr } = await supabase
      .from("emergency_links")
      .select("id, patient_id, expires_at, is_active, created_at, access_count")
      .eq("token", token)
      .maybeSingle();

    if (linkErr) throw linkErr;
    if (
      !link ||
      !link.is_active ||
      (link.expires_at && new Date(link.expires_at) <= new Date())
    ) {
      return json({ error: "invalid_or_expired" }, 404);
    }

    // Load aggregated patient data in parallel
    const patientId = link.patient_id;
    const [patient, allergies, conditions, contacts, meds] = await Promise.all([
      supabase
        .from("patients")
        .select(
          "id, full_name, birth_date, blood_type, photo_url, insurance_name, insurance_number, preferred_hospital",
        )
        .eq("id", patientId)
        .maybeSingle(),
      supabase
        .from("patient_allergies")
        .select("id, name, severity")
        .eq("patient_id", patientId)
        .order("severity", { ascending: false }),
      supabase
        .from("patient_conditions")
        .select("id, name, status")
        .eq("patient_id", patientId)
        .eq("status", "active"),
      supabase
        .from("emergency_contacts")
        .select("id, name, phone, relation, priority")
        .eq("patient_id", patientId)
        .order("priority", { ascending: true }),
      supabase
        .from("medications")
        .select("id, name, dosage, frequency")
        .eq("patient_id", patientId)
        .eq("status", "active"),
    ]);

    // Generate a short-lived signed URL for the patient's photo so the
    // public emergency page can render the real picture (bucket is private).
    let photo_signed_url: string | null = null;
    if (patient.data?.photo_url) {
      const { data: signed } = await supabase.storage
        .from("patient-photos")
        .createSignedUrl(patient.data.photo_url, 3600);
      photo_signed_url = signed?.signedUrl ?? null;
    }

    // Log access + bump counters (best-effort)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      null;
    const ua = req.headers.get("user-agent") ?? null;

    await Promise.all([
      supabase.from("access_logs").insert({
        emergency_link_id: link.id,
        patient_id: patientId,
        action: "emergency_view",
        ip,
        user_agent: ua,
      }),
      supabase
        .from("emergency_links")
        .update({
          access_count: (link.access_count ?? 0) + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq("id", link.id),
    ]);

    return json({
      link: {
        created_at: link.created_at,
        expires_at: link.expires_at,
      },
      patient: patient.data
        ? { ...patient.data, photo_signed_url }
        : null,
      allergies: allergies.data ?? [],
      conditions: conditions.data ?? [],
      contacts: contacts.data ?? [],
      medications: meds.data ?? [],
    });
  } catch (e) {
    console.error("log-emergency-access error", e);
    return json({ error: "internal_error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
