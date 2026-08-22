// Supabase Edge Function (Deno) — admin-only doctor availability management
// and appointment schedule view. Every request is checked against
// profiles.is_admin server-side; this is never exposed to ordinary members.
//
// NOT DEPLOYED. Deploy with `supabase functions deploy admin-availability`.
// Required secret: SUPABASE_SERVICE_ROLE_KEY (SUPABASE_URL is automatic).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const PACKAGE_NAMES: Record<string, string> = { basic: "Basic", premium: "Premium", "vip-elite": "VIP Elite" };

async function resolveAdminUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile?.is_admin) return null;

  return data.user;
}

// Curried so the per-request CORS headers (which now depend on the caller's
// Origin) can be bound once inside the handler without touching any of the
// 17 json(...) call sites below.
function jsonWith(cors: Record<string, string>) {
  return (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
}

interface RequestBody {
  action: string;
  [key: string]: unknown;
}

serve(async (req) => {
  const CORS_HEADERS = corsHeaders(req);
  const json = jsonWith(CORS_HEADERS);
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });

  const admin = await resolveAdminUser(req);
  if (!admin) {
    return json({ error: "Not authorized." }, 403);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  switch (body.action) {
    case "list-availability": {
      const { data, error } = await supabaseAdmin
        .from("doctor_availability")
        .select("*")
        .order("day_of_week", { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json({ availability: data });
    }

    case "update-availability": {
      const { id, isActive, startTime, endTime, slotDurationMinutes } = body as {
        id: string;
        isActive?: boolean;
        startTime?: string;
        endTime?: string;
        slotDurationMinutes?: number;
      };
      if (!id) return json({ error: "id is required." }, 400);
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (typeof isActive === "boolean") patch.is_active = isActive;
      if (typeof startTime === "string") patch.start_time = startTime;
      if (typeof endTime === "string") patch.end_time = endTime;
      if (typeof slotDurationMinutes === "number" && slotDurationMinutes > 0) {
        patch.slot_duration_minutes = slotDurationMinutes;
      }
      const { data, error } = await supabaseAdmin
        .from("doctor_availability")
        .update(patch)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      return json({ availability: data });
    }

    case "list-exceptions": {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabaseAdmin
        .from("availability_exceptions")
        .select("*")
        .gte("date", today)
        .order("date", { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json({ exceptions: data });
    }

    case "create-exception": {
      const { date, type, startTime, endTime, reason, isAvailable } = body as {
        date: string;
        type: string;
        startTime?: string;
        endTime?: string;
        reason?: string;
        isAvailable: boolean;
      };
      if (!date || !type) return json({ error: "date and type are required." }, 400);
      const { data, error } = await supabaseAdmin
        .from("availability_exceptions")
        .insert({
          date,
          type,
          start_time: startTime || null,
          end_time: endTime || null,
          reason: (reason ?? "").slice(0, 300) || null,
          is_available: Boolean(isAvailable),
        })
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      return json({ exception: data });
    }

    case "delete-exception": {
      const { id } = body as { id: string };
      if (!id) return json({ error: "id is required." }, 400);
      const { error } = await supabaseAdmin.from("availability_exceptions").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    case "list-appointments": {
      const range = (body as { range?: string }).range ?? "upcoming";
      const now = new Date();
      let fromIso = now.toISOString();
      let toIso: string | null = null;
      if (range === "today") {
        const end = new Date(now);
        end.setUTCHours(23, 59, 59, 999);
        toIso = end.toISOString();
      } else if (range === "week") {
        const end = new Date(now.getTime() + 7 * 86_400_000);
        toIso = end.toISOString();
      }

      let query = supabaseAdmin
        .from("consultation_requests")
        .select("id, user_id, appointment_start, appointment_end, status, consultation_type, google_meet_url")
        .in("status", ["pending", "confirmed", "rescheduled"])
        .gte("appointment_start", fromIso)
        .order("appointment_start", { ascending: true });
      if (toIso) query = query.lte("appointment_start", toIso);

      const { data: appointments, error } = await query;
      if (error) return json({ error: error.message }, 500);

      const userIds = Array.from(new Set((appointments ?? []).map((a) => a.user_id)));
      const [profilesRes, subsRes] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
        supabaseAdmin
          .from("subscriptions")
          .select("user_id, package_id")
          .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"])
          .eq("status", "active"),
      ]);
      const nameById = new Map((profilesRes.data ?? []).map((p) => [p.id, p.full_name as string | null]));
      const packageById = new Map((subsRes.data ?? []).map((s) => [s.user_id, s.package_id as string]));

      const emailById = new Map<string, string>();
      await Promise.all(
        userIds.map(async (id) => {
          const { data } = await supabaseAdmin.auth.admin.getUserById(id);
          if (data.user?.email) emailById.set(id, data.user.email);
        }),
      );

      const enriched = (appointments ?? []).map((a) => ({
        id: a.id,
        appointmentStart: a.appointment_start,
        appointmentEnd: a.appointment_end,
        status: a.status,
        consultationType: a.consultation_type,
        meetUrl: a.google_meet_url,
        clientName: nameById.get(a.user_id) ?? "Member",
        clientEmail: emailById.get(a.user_id) ?? null,
        packageName: PACKAGE_NAMES[packageById.get(a.user_id) ?? ""] ?? packageById.get(a.user_id) ?? null,
      }));

      return json({ appointments: enriched });
    }

    default:
      return json({ error: "Unknown action." }, 400);
  }
});
