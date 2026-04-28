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
    if (!LUXAND_TOKEN) return json(500, { error: "LUXAND_API_TOKEN not configured" });

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
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const ext = "jpg";
    const path = `${student.id}/${Date.now()}.${ext}`;

    // Upload to face-images bucket (public)
    const { error: upErr } = await supabase.storage
      .from("face-images")
      .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
    if (upErr) return json(500, { error: `Storage upload failed: ${upErr.message}` });

    const { data: pub } = supabase.storage.from("face-images").getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    // Call Luxand
    let luxandRes: Response;
    let luxandJson: any;
    if (student.luxand_person_uuid) {
      // Add another face to existing person
      const fd = new FormData();
      fd.append("photos", publicUrl);
      fd.append("store", "1");
      luxandRes = await fetch(
        `https://api.luxand.cloud/v2/person/${student.luxand_person_uuid}`,
        { method: "POST", headers: { token: LUXAND_TOKEN }, body: fd },
      );
    } else {
      const fd = new FormData();
      fd.append("name", student.full_name);
      fd.append("store", "1");
      fd.append("photos", publicUrl);
      luxandRes = await fetch("https://api.luxand.cloud/v2/person", {
        method: "POST",
        headers: { token: LUXAND_TOKEN },
        body: fd,
      });
    }

    luxandJson = await luxandRes.json().catch(() => ({}));
    if (!luxandRes.ok || luxandJson?.status === "failure") {
      const msg = luxandJson?.message || `Luxand API error (${luxandRes.status})`;
      return json(400, { error: msg, luxand: luxandJson });
    }

    const personUuid = student.luxand_person_uuid || luxandJson?.uuid || luxandJson?.id;
    if (!personUuid) return json(500, { error: "No person UUID returned by Luxand", luxand: luxandJson });

    // Update student
    const { error: updErr } = await supabase
      .from("students")
      .update({
        luxand_person_uuid: personUuid,
        face_enrolled: true,
        face_image_url: publicUrl,
      })
      .eq("id", student.id);
    if (updErr) return json(500, { error: `DB update failed: ${updErr.message}` });

    return json(200, { success: true, person_uuid: personUuid, photo_url: publicUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("luxand-enroll error:", msg);
    return json(500, { error: msg });
  }
});
