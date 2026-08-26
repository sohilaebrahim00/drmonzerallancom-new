// Supabase Edge Function (Deno) — "how many patients have subscribed, and can
// they actually get in?"
//
// NOT DEPLOYED. Deploy with `supabase functions deploy admin-subscribers`.
// Required secret: SUPABASE_SERVICE_ROLE_KEY (SUPABASE_URL is automatic).
//
// This cannot be a client query. `last_sign_in_at` lives in auth.users, which
// the browser cannot read at all — no RLS policy can grant it — and it is the
// most important column on the screen: it is the difference between "they
// bought" and "they bought and are locked out". On 26 Aug a patient paid,
// could not sign in, and the only reason anyone found out was a WhatsApp
// message. This endpoint is what turns that into a row on a list.
//
// DELIBERATELY NARROW. Everything returned is listed in the RESPONSE FIELDS
// comment below. Nothing else from auth.users leaves this function — no
// tokens, no encrypted_password, no identity payloads — and no Stripe ids,
// which the doctor does not need and which would be a needless leak into a
// browser.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

function jsonWith(cors: Record<string, string>) {
  return (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
}

/** Same predicate as admin-availability's resolveStaffUser and public.is_doctor(). */
async function resolveStaffUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_admin, role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile) return null;
  const allowed = profile.is_admin === true || profile.role === "doctor" || profile.role === "admin";
  if (!allowed) return null;

  return data.user;
}

interface SubscriptionRow {
  user_id: string;
  package_id: string;
  consultation_credit_limit: number;
  consultation_credits_used: number;
  started_at: string;
}

/**
 * RESPONSE FIELDS — the complete list, per subscriber:
 *   userId, fullName, email, packageId, creditLimit, creditsUsed,
 *   subscribedAt, lastSignInAt, hasUpcomingConsultation
 * plus totals: { totalSubscribers, neverSignedIn }.
 *
 * Raw values only. Dates go out as ISO strings and the page formats them —
 * a display string invented here would be formatted in the server's locale,
 * not the doctor's.
 *
 * One row per PATIENT, not per subscription row. A patient who buys two
 * program packages has two active rows, and the doctor asked how many
 * PEOPLE subscribed. Credits are summed across their active rows, which is
 * the same total the patient sees on their own account page (phase 2.8), so
 * the two can never disagree. packageId and subscribedAt come from their most
 * recent active purchase.
 */
serve(async (req) => {
  const CORS_HEADERS = corsHeaders(req);
  const json = jsonWith(CORS_HEADERS);
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  const staff = await resolveStaffUser(req);
  if (!staff) return json({ error: "Not authorized." }, 403);

  const { data: subs, error: subsError } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, package_id, consultation_credit_limit, consultation_credits_used, started_at")
    .eq("status", "active")
    .order("started_at", { ascending: false });
  if (subsError) return json({ error: subsError.message }, 500);

  const rows = (subs ?? []) as SubscriptionRow[];
  if (rows.length === 0) {
    return json({ subscribers: [], totals: { totalSubscribers: 0, neverSignedIn: 0 } });
  }

  // Newest first from the query, so the first row seen for a user is their
  // most recent purchase.
  const byUser = new Map<
    string,
    { packageId: string; creditLimit: number; creditsUsed: number; subscribedAt: string }
  >();
  for (const row of rows) {
    const existing = byUser.get(row.user_id);
    if (existing) {
      existing.creditLimit += row.consultation_credit_limit;
      existing.creditsUsed += row.consultation_credits_used;
      continue;
    }
    byUser.set(row.user_id, {
      packageId: row.package_id,
      creditLimit: row.consultation_credit_limit,
      creditsUsed: row.consultation_credits_used,
      subscribedAt: row.started_at,
    });
  }
  const userIds = [...byUser.keys()];

  const nowIso = new Date().toISOString();
  const [{ data: profiles }, { data: upcoming }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds),
    supabaseAdmin
      .from("consultation_requests")
      .select("user_id")
      .in("user_id", userIds)
      .in("status", ["pending", "confirmed"])
      .gte("appointment_start", nowIso),
  ]);

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id as string, (p.full_name as string | null) ?? null]),
  );
  const hasUpcoming = new Set((upcoming ?? []).map((c) => c.user_id as string));

  // Email and last_sign_in_at come from auth.users, which is why this endpoint
  // exists. Same per-user admin lookup admin-availability already uses.
  const authById = new Map<string, { email: string | null; lastSignInAt: string | null }>();
  await Promise.all(
    userIds.map(async (id) => {
      const { data } = await supabaseAdmin.auth.admin.getUserById(id);
      authById.set(id, {
        email: data.user?.email ?? null,
        // Never signed in reads as null, not as a fabricated date.
        lastSignInAt: data.user?.last_sign_in_at ?? null,
      });
    }),
  );

  const subscribers = userIds.map((id) => {
    const agg = byUser.get(id)!;
    const auth = authById.get(id);
    return {
      userId: id,
      fullName: nameById.get(id) ?? null,
      email: auth?.email ?? null,
      packageId: agg.packageId,
      creditLimit: agg.creditLimit,
      creditsUsed: agg.creditsUsed,
      subscribedAt: agg.subscribedAt,
      lastSignInAt: auth?.lastSignInAt ?? null,
      hasUpcomingConsultation: hasUpcoming.has(id),
    };
  });

  subscribers.sort((a, b) => b.subscribedAt.localeCompare(a.subscribedAt));

  return json({
    subscribers,
    totals: {
      totalSubscribers: subscribers.length,
      neverSignedIn: subscribers.filter((s) => s.lastSignInAt === null).length,
    },
  });
});
