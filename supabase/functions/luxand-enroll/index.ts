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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json(401, { error: "Unauthorized" });

    const userId = claimsData.claims.sub as string;

    // Admin-only: enrollment writes biometric data and must not be available to faculty.
    const { data: roleRow, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (roleErr || roleRow?.role !== "admin") {
      return json(403, { error: "Forbidden" });
    }

    // Use a service-role client for storage uploads (bucket is now private and admin-only)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => null);
    if (!body || typeof body.student_id !== "string" || typeof body.image_base64 !== "string") {
      return json(400, { error: "student_id and image_base64 are required" });
    }

    // Load student
    const { data: student, error: stuErr } = await supabase
      .from("students")
      .select("id, full_name, luxand_person_uuid")
      .eq("id", body.student_id)
      .maybeSingle();
    if (stuErr || !student) return json(404, { error: "Student not found" });

    // Decode base64 → bytes
    const b64 = body.image_base64.includes(",")
      ? body.image_base64.split(",")[1]
      : body.image_base64;
    let bytes: Uint8Array;
    try {
      bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    } catch {
      return json(400, { error: "Invalid image data" });
    }
    const ext = "jpg";
    const path = `${student.id}/${Date.now()}.${ext}`;

    // Upload to face-images bucket (private)
    const { error: upErr } = await adminClient.storage
      .from("face-images")
      .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
    if (upErr) {
      console.error("luxand-enroll storage upload failed:", upErr);
      return json(500, { error: "Image upload failed" });
    }

    // Generate a short-lived signed URL so Luxand can fetch the private image (1 hour)
    const { data: signed, error: signErr } = await adminClient.storage
      .from("face-images")
      .createSignedUrl(path, 60 * 60);
    if (signErr || !signed?.signedUrl) {
      console.error("luxand-enroll signed url failed:", signErr);
      return json(500, { error: "Image processing failed" });
    }
    const imageUrlForLuxand = signed.signedUrl;

    // Call Luxand
    let luxandRes: Response;
    let luxandJson: any;
    if (student.luxand_person_uuid) {
      const fd = new FormData();
      fd.append("photos", imageUrlForLuxand);
      fd.append("store", "1");
      luxandRes = await fetch(
        `https://api.luxand.cloud/v2/person/${student.luxand_person_uuid}`,
        { method: "POST", headers: { token: LUXAND_TOKEN }, body: fd },
      );
    } else {
      const fd = new FormData();
      fd.append("name", student.full_name);
      fd.append("store", "1");
      fd.append("photos", imageUrlForLuxand);
      luxandRes = await fetch("https://api.luxand.cloud/v2/person", {
        method: "POST",
        headers: { token: LUXAND_TOKEN },
        body: fd,
      });
    }

    luxandJson = await luxandRes.json().catch(() => ({}));
    if (!luxandRes.ok || luxandJson?.status === "failure") {
      console.error("luxand-enroll Luxand API error:", luxandRes.status, luxandJson);
      return json(400, { error: "Face enrollment failed. Please try again." });
    }

    const personUuid = student.luxand_person_uuid || luxandJson?.uuid || luxandJson?.id;
    if (!personUuid) {
      console.error("luxand-enroll: no person UUID returned", luxandJson);
      return json(500, { error: "Face enrollment failed. Please try again." });
    }

    // Update student — store the storage path (not a public URL) since the bucket is private
    const { error: updErr } = await supabase
      .from("students")
      .update({
        luxand_person_uuid: personUuid,
        face_enrolled: true,
        face_image_url: path,
      })
      .eq("id", student.id);
    if (updErr) {
      console.error("luxand-enroll DB update failed:", updErr);
      return json(500, { error: "Database update failed" });
    }

    return json(200, { success: true, person_uuid: personUuid });
  } catch (e) {
    console.error("luxand-enroll error:", e);
    return json(500, { error: "An internal error occurred" });
  }
});
