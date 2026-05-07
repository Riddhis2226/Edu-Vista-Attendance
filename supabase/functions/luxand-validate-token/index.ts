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

// Admin-only: validates a candidate Luxand token by calling Luxand with it.
// Returns ok/error so the admin can decide whether to save it as a project secret
// (rotation itself happens via the Lovable Cloud secrets UI — tokens are never
// stored in the database or in client code).
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

    const body = await req.json().catch(() => null);
    const candidate = body?.token;
    if (typeof candidate !== "string" || candidate.length < 10) {
      return json(400, { error: "Invalid token" });
    }

    const res = await fetch("https://api.luxand.cloud/v2/person?limit=1", {
      headers: { token: candidate },
    });
    const text = await res.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* ignore */ }

    if (!res.ok) {
      return json(200, {
        valid: false,
        message: parsed?.message || `Luxand returned ${res.status}`,
      });
    }
    return json(200, { valid: true, message: "Token is valid" });
  } catch (e) {
    return json(500, { error: (e as Error).message });
  }
});
