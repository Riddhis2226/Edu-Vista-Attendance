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

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return json(401, { error: "Unauthorized" });

    const body = await req.json().catch(() => null);
    if (
      !body ||
      typeof body.batch !== "string" ||
      !Array.isArray(body.images) ||
      body.images.length === 0
    ) {
      return json(400, { error: "batch and images[] are required" });
    }

    // Load enrolled students for this batch
    const { data: students, error: stuErr } = await supabase
      .from("students")
      .select("id, full_name, enrollment_no, luxand_person_uuid, face_enrolled")
      .eq("batch", body.batch);
    if (stuErr) return json(500, { error: `Student fetch failed: ${stuErr.message}` });

    const enrolledStudents = (students || []).filter((s) => s.luxand_person_uuid);
    const allBatchStudents = students || [];

    // Map of person_uuid → best confidence found
    const matchMap = new Map<string, number>();

    for (let i = 0; i < body.images.length; i++) {
      const img = body.images[i];
      if (typeof img !== "string") continue;
      let b64 = img.includes(",") ? img.split(",")[1] : img;
      b64 = b64.replace(/\s/g, "");
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) {
        console.warn(`image ${i}: invalid base64`);
        continue;
      }
      let bytes: Uint8Array;
      try {
        const bin = atob(b64);
        bytes = new Uint8Array(bin.length);
        for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
      } catch (e) {
        console.warn(`image ${i}: decode failed`, e);
        continue;
      }
      const blob = new Blob([bytes], { type: "image/jpeg" });

      const fd = new FormData();
      fd.append("photo", blob, `classroom_${i}.jpg`);

      const res = await fetch("https://api.luxand.cloud/photo/search/v2", {
        method: "POST",
        headers: { token: LUXAND_TOKEN },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.warn(`Luxand search failed for image ${i}:`, res.status, JSON.stringify(data));
        continue;
      }

      const faces = Array.isArray(data) ? data : (data.faces || data.results || []);
      for (const face of faces) {
        const uuid: string | undefined = face?.uuid || face?.person?.uuid || face?.person_uuid;
        const prob: number = Number(face?.probability ?? face?.confidence ?? face?.score ?? 0);
        if (uuid && prob > 0) {
          const prev = matchMap.get(uuid) || 0;
          if (prob > prev) matchMap.set(uuid, prob);
        }
      }
    }

    // Build results: every student in batch gets a row
    const results = allBatchStudents.map((s) => {
      const conf = s.luxand_person_uuid ? matchMap.get(s.luxand_person_uuid) : undefined;
      return {
        student_id: s.id,
        enrollment_no: s.enrollment_no,
        student_name: s.full_name,
        status: conf && conf > 0 ? "present" : "absent",
        confidence: conf ?? null,
        enrolled: !!s.luxand_person_uuid,
      };
    });

    return json(200, {
      success: true,
      total_students: allBatchStudents.length,
      enrolled_count: enrolledStudents.length,
      matched_count: results.filter((r) => r.status === "present").length,
      results,
    });
  } catch (e) {
    console.error("luxand-recognize error:", e);
    return json(500, { error: "An internal error occurred" });
  }
});
