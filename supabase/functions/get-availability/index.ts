// Supabase Edge Function (Deno) — returns real, computed bookable
// consultation slots. Public (no membership required): visitors can see
// what times exist before deciding to join, per the product requirement
// that consultation information is viewable without an active membership
// — only *confirming* a booking requires one (see create-consultation).
//
// NOT DEPLOYED. Deploy with `supabase functions deploy get-availability`.
// Required secret: SUPABASE_SERVICE_ROLE_KEY (SUPABASE_URL is automatic).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";
import { generateAvailableSlots } from "../_shared/availability.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

serve(async (req) => {
  const CORS_HEADERS = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  let daysAhead = 21;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body.daysAhead === "number" && body.daysAhead > 0 && body.daysAhead <= 60) {
      daysAhead = body.daysAhead;
    }
  } catch {
    // Use default.
  }

  try {
    const slots = await generateAvailableSlots(supabaseAdmin, daysAhead);
    return new Response(JSON.stringify({ slots }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[get-availability] Failed to compute slots:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: "Could not load availability right now." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
