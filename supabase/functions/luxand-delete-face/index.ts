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
    const LUXAND_TOKEN = Deno.env.get("LUXAND_API_TOKEN");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return json(401, { error: "Unauthorized" });
    const userId = userData.user.id;

    const { data: roleRow } = await supabase
      .from("user_roles").select("role, name").eq("user_id", userId).maybeSingle();
    if (roleRow?.role !== "admin") return json(403, { error: "Forbidden" });

    const body = await req.json().catch(() => null);
    if (!body || typeof body.student_id !== "string") {
      return json(400, { error: "student_id required" });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: student } = await adminClient
      .from("students")
      .select("id, full_name, enrollment_no, luxand_person_uuid, face_image_url")
      .eq("id", body.student_id)
      .maybeSingle();
    if (!student) return json(404, { error: "Student not found" });

    const auditBase = {
      student_id: student.id,
      enrollment_no: student.enrollment_no,
      student_name: student.full_name,
      admin_user_id: userId,
      admin_name: roleRow?.name ?? null,
      luxand_person_uuid: student.luxand_person_uuid,
    };

    let luxandError: string | null = null;
    if (student.luxand_person_uuid && LUXAND_TOKEN) {
      try {
        const res = await fetch(
          `https://api.luxand.cloud/v2/person/${student.luxand_person_uuid}`,
          { method: "DELETE", headers: { token: LUXAND_TOKEN } },
        );
        if (!res.ok && res.status !== 404) {
          const t = await res.text().catch(() => "");
          luxandError = `Luxand ${res.status}: ${t.slice(0, 200)}`;
        }
      } catch (e) {
        luxandError = (e as Error).message;
      }
    }

    if (student.face_image_url) {
      await adminClient.storage.from("face-images").remove([student.face_image_url]);
    }

    await adminClient.from("students").update({
      luxand_person_uuid: null,
      face_enrolled: false,
      face_image_url: null,
      enrollment_status: "not_enrolled",
      enrollment_error: null,
      enrollment_synced_at: null,
    }).eq("id", student.id);

    await adminClient.from("face_audit_log").insert({
      ...auditBase,
      action: luxandError ? "remove_failed" : "remove",
      error_message: luxandError,
    });

    if (luxandError) return json(200, { success: true, warning: luxandError });
    return json(200, { success: true });
  } catch (e) {
    console.error("luxand-delete-face error:", e);
    return json(500, { error: "An internal error occurred" });
  }
});
