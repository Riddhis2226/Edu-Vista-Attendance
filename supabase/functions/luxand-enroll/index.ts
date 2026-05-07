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

  let adminClient: ReturnType<typeof createClient> | null = null;
  let auditCtx: {
    student_id?: string;
    enrollment_no?: string;
    student_name?: string;
    admin_user_id?: string;
    admin_name?: string;
  } = {};

  const writeAudit = async (
    action: string,
    luxand_person_uuid: string | null,
    error_message: string | null,
  ) => {
    if (!adminClient) return;
    try {
      await adminClient.from("face_audit_log").insert({
        ...auditCtx,
        action,
        luxand_person_uuid,
        error_message,
      });
    } catch (e) {
      console.error("audit insert failed", e);
    }
  };

  try {
    const LUXAND_TOKEN = Deno.env.get("LUXAND_API_TOKEN");
    if (!LUXAND_TOKEN) {
      console.error("luxand-enroll: LUXAND_API_TOKEN not configured");
      return json(500, { error: "Service unavailable" });
    }

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

    const { data: roleRow, error: roleErr } = await supabase
      .from("user_roles")
      .select("role, name")
      .eq("user_id", userId)
      .maybeSingle();
    if (roleErr || roleRow?.role !== "admin") {
      return json(403, { error: "Forbidden" });
    }

    auditCtx.admin_user_id = userId;
    auditCtx.admin_name = roleRow?.name ?? null;

    adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => null);
    if (!body || typeof body.student_id !== "string" || typeof body.image_base64 !== "string") {
      return json(400, { error: "student_id and image_base64 are required" });
    }

    const { data: student, error: stuErr } = await supabase
      .from("students")
      .select("id, full_name, enrollment_no, luxand_person_uuid")
      .eq("id", body.student_id)
      .maybeSingle();
    if (stuErr || !student) return json(404, { error: "Student not found" });

    auditCtx.student_id = student.id;
    auditCtx.enrollment_no = student.enrollment_no;
    auditCtx.student_name = student.full_name;

    // Mark pending
    await adminClient
      .from("students")
      .update({ enrollment_status: "pending", enrollment_error: null })
      .eq("id", student.id);

    let b64 = body.image_base64.includes(",")
      ? body.image_base64.split(",")[1]
      : body.image_base64;
    b64 = b64.replace(/\s/g, "");
    let bytes: Uint8Array;
    try {
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) throw new Error("bad base64");
      const bin = atob(b64);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } catch (decodeErr) {
      console.error("base64 decode failed", decodeErr, "len:", body.image_base64?.length);
      await adminClient
        .from("students")
        .update({ enrollment_status: "failed", enrollment_error: "Invalid image data" })
        .eq("id", student.id);
      await writeAudit("enroll_failed", student.luxand_person_uuid ?? null, "Invalid image data");
      return json(400, { error: "Invalid image data" });
    }
    const path = `${student.id}/${Date.now()}.jpg`;

    const { error: upErr } = await adminClient.storage
      .from("face-images")
      .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
    if (upErr) {
      await adminClient.from("students").update({
        enrollment_status: "failed",
        enrollment_error: "Image upload failed",
      }).eq("id", student.id);
      await writeAudit("enroll_failed", student.luxand_person_uuid ?? null, upErr.message);
      return json(500, { error: "Image upload failed" });
    }

    const { data: signed, error: signErr } = await adminClient.storage
      .from("face-images")
      .createSignedUrl(path, 60 * 60);
    if (signErr || !signed?.signedUrl) {
      await adminClient.from("students").update({
        enrollment_status: "failed",
        enrollment_error: "Image processing failed",
      }).eq("id", student.id);
      await writeAudit("enroll_failed", student.luxand_person_uuid ?? null, signErr?.message ?? "signed url failed");
      return json(500, { error: "Image processing failed" });
    }

    let luxandRes: Response;
    let luxandJson: any;
    if (student.luxand_person_uuid) {
      const fd = new FormData();
      fd.append("photos", signed.signedUrl);
      fd.append("store", "1");
      luxandRes = await fetch(
        `https://api.luxand.cloud/v2/person/${student.luxand_person_uuid}`,
        { method: "POST", headers: { token: LUXAND_TOKEN }, body: fd },
      );
    } else {
      const fd = new FormData();
      fd.append("name", student.full_name);
      fd.append("store", "1");
      fd.append("photos", signed.signedUrl);
      luxandRes = await fetch("https://api.luxand.cloud/v2/person", {
        method: "POST",
        headers: { token: LUXAND_TOKEN },
        body: fd,
      });
    }

    luxandJson = await luxandRes.json().catch(() => ({}));
    if (!luxandRes.ok || luxandJson?.status === "failure") {
      const msg = luxandJson?.message || `Luxand error ${luxandRes.status}`;
      await adminClient.from("students").update({
        enrollment_status: "failed",
        enrollment_error: msg,
      }).eq("id", student.id);
      await writeAudit("enroll_failed", student.luxand_person_uuid ?? null, msg);
      return json(400, { error: "Face enrollment failed", details: msg });
    }

    const personUuid = student.luxand_person_uuid || luxandJson?.uuid || luxandJson?.id;
    if (!personUuid) {
      await adminClient.from("students").update({
        enrollment_status: "failed",
        enrollment_error: "No person UUID returned",
      }).eq("id", student.id);
      await writeAudit("enroll_failed", null, "No person UUID returned");
      return json(500, { error: "Face enrollment failed" });
    }

    const { error: updErr } = await adminClient
      .from("students")
      .update({
        luxand_person_uuid: personUuid,
        face_enrolled: true,
        face_image_url: path,
        enrollment_status: "synced",
        enrollment_error: null,
        enrollment_synced_at: new Date().toISOString(),
      })
      .eq("id", student.id);
    if (updErr) {
      await writeAudit("enroll_failed", personUuid, updErr.message);
      return json(500, { error: "Database update failed" });
    }

    await writeAudit("enroll", personUuid, null);
    return json(200, { success: true, person_uuid: personUuid });
  } catch (e) {
    console.error("luxand-enroll error:", e);
    await writeAudit("enroll_failed", null, (e as Error).message);
    return json(500, { error: "An internal error occurred" });
  }
});
