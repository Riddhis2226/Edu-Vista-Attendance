// Admin-only endpoint to create a new faculty user.
// Uses the service role key so the request never exposes admin credentials to the browser.
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

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json(401, { error: "Unauthorized" });

    // Confirm caller is an admin
    const { data: roleRow, error: roleErr } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (roleErr || roleRow?.role !== "admin") return json(403, { error: "Forbidden" });

    // Parse + validate input
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!name || name.length < 2 || name.length > 120) return json(400, { error: "Invalid name" });
    if (!isEmail(email) || email.length > 254) return json(400, { error: "Invalid email" });
    if (password.length < 8 || password.length > 128) {
      return json(400, { error: "Password must be 8–128 characters" });
    }

    // Create the user with the service-role key (admin context)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip confirmation; admin is provisioning the account
      user_metadata: { name },
    });
    if (createErr || !created?.user) {
      console.error("admin-create-faculty createUser failed:", createErr);
      const msg = createErr?.message?.toLowerCase().includes("already")
        ? "An account with that email already exists"
        : "Failed to create faculty account";
      return json(400, { error: msg });
    }

    // Trigger creates the user_roles row defaulting to faculty. The name from
    // raw_user_meta_data is used by the trigger; ensure the row reflects it.
    const { error: upsertErr } = await adminClient
      .from("user_roles")
      .update({ name })
      .eq("user_id", created.user.id);
    if (upsertErr) console.error("admin-create-faculty role name update failed:", upsertErr);

    return json(200, { success: true, user_id: created.user.id });
  } catch (e) {
    console.error("admin-create-faculty error:", e);
    return json(500, { error: "An internal error occurred" });
  }
});
