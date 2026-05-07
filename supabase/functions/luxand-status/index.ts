import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return json(401, { error: "Unauthorized" });

    const { data: roleRow } = await supabase
      .from("user_roles").select("role").eq("user_id", userData.user.id).maybeSingle();
    if (roleRow?.role !== "admin") return json(403, { error: "Forbidden" });

    const LUXAND_TOKEN = Deno.env.get("LUXAND_API_TOKEN");
    if (!LUXAND_TOKEN) {
      return json(200, { configured: false, ok: false, message: "LUXAND_API_TOKEN not set" });
    }

    const start = Date.now();
    const res = await fetch("https://api.luxand.cloud/v2/person?limit=1", {
      headers: { token: LUXAND_TOKEN },
    });
    const elapsed = Date.now() - start;
    const text = await res.text();
    let body: any = null;
    try { body = JSON.parse(text); } catch { /* ignore */ }

    if (!res.ok) {
      return json(200, {
        configured: true,
        ok: false,
        message: body?.message || `Luxand returned ${res.status}`,
        latency_ms: elapsed,
      });
    }

    const count = Array.isArray(body) ? body.length : (body?.count ?? null);
    return json(200, {
      configured: true,
      ok: true,
      message: "Connected to Luxand Cloud",
      latency_ms: elapsed,
      person_count: count,
    });
  } catch (e) {
    console.error("luxand-status error:", e);
    return json(500, { ok: false, message: "An internal error occurred" });
  }
});
