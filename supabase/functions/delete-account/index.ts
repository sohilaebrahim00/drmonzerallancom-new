// Supabase Edge Function (Deno) — real account deletion.
//
// A client can never delete its own auth.users row directly (Supabase Auth
// has no client-safe "delete myself" RPC — deleting an auth user requires
// the service_role key, by design). This function is the one place that
// key is used for this specific purpose: verify the caller's own JWT
// (never trust a userId in the request body), then call the Auth Admin API
// to delete exactly that verified user.
//
// Deleting the auth.users row cascades through every foreign key added in
// this project with `on delete cascade` (profiles, body_profiles,
// meal_logs, activity_logs, step_logs, weight_logs, friendships,
// conversation_participants, messages, daily_targets, doctor_patient_relationships
// where this user is the patient, etc. — see supabase/schema.sql and
// supabase/PHASE_G_SOCIAL_NUTRITION_MIGRATION.sql for the exact FK list) —
// so this one call is sufficient, not a manual per-table delete loop.
//
// NOT DEPLOYED. Deploy with `supabase functions deploy delete-account`.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { CORS_HEADERS } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Not signed in." }), {
      status: 401,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.slice("Bearer ".length);
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Not signed in." }), {
      status: 401,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // Doctor/admin accounts are never self-deletable through this path —
  // deleting a practicing doctor's account would silently orphan every
  // active patient relationship and program. Requires a manual admin
  // decision instead (documented, not a code TODO left unhandled).
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profile?.role === "doctor" || profile?.role === "admin") {
    return new Response(
      JSON.stringify({ error: "Doctor/admin accounts require manual deletion — contact support." }),
      { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
  if (deleteError) {
    console.error("[delete-account] deletion failed:", deleteError);
    return new Response(JSON.stringify({ error: "Could not delete account. Please try again." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
