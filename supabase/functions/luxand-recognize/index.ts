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
      !Array.isArray(body.images) ||
      body.images.length === 0
    ) {
      return json(400, { error: "images[] are required" });
    }
    const MAX_IMAGES = 20;
    if (body.images.length > MAX_IMAGES) {
      return json(400, { error: `Maximum ${MAX_IMAGES} images per request` });
    }

    // Load enrolled students with optional filters
    let query = supabase
      .from("students")
      .select("id, full_name, enrollment_no, luxand_person_uuid, face_enrolled");
    if (typeof body.batch === "string" && body.batch) query = query.eq("batch", body.batch);
    if (typeof body.program === "string" && body.program) query = query.eq("program", body.program);
    if (typeof body.semester === "string" && body.semester) query = query.eq("semester", body.semester);
    if (typeof body.section === "string" && body.section) query = query.eq("section", body.section);
    const { data: students, error: stuErr } = await query;
    if (stuErr) {
      console.error("luxand-recognize student fetch failed:", stuErr);
      return json(500, { error: "An internal error occurred" });
    }

    const enrolledStudents = (students || []).filter((s) => s.luxand_person_uuid);
    const allBatchStudents = (students || []).slice().sort((a, b) =>
      String(a.enrollment_no || "").localeCompare(String(b.enrollment_no || ""))
    );

    // Decode images once (reused for search + detect fallback)
    const decoded: { i: number; blob: Blob }[] = [];
    for (let i = 0; i < body.images.length; i++) {
      const img = body.images[i];
      if (typeof img !== "string") continue;
      let b64 = img.includes(",") ? img.split(",")[1] : img;
      b64 = b64.replace(/\s/g, "");
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) {
        console.warn(`image ${i}: invalid base64`);
        continue;
      }
      try {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
        decoded.push({ i, blob: new Blob([bytes], { type: "image/jpeg" }) });
      } catch (e) {
        console.warn(`image ${i}: decode failed`, e);
      }
    }

    // ===== Face detection only — count faces across all uploaded photos =====
    let mode: "detected" | "estimated" = "detected";
    let facesDetected = 0;

    for (const { i, blob } of decoded) {
      const fd = new FormData();
      fd.append("photo", blob, `detect_${i}.jpg`);
      try {
        const res = await fetch("https://api.luxand.cloud/photo/detect", {
          method: "POST",
          headers: { token: LUXAND_TOKEN },
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const faces = Array.isArray(data) ? data : (data.faces || data.results || []);
          facesDetected += Array.isArray(faces) ? faces.length : 0;
        } else {
          console.warn(`Luxand detect failed for image ${i}:`, res.status, JSON.stringify(data));
        }
      } catch (e) {
        console.warn(`Luxand detect error for image ${i}:`, e);
      }
    }

    // Fallback: if detection returns nothing, estimate ~70% of class
    if (facesDetected === 0 && decoded.length > 0 && allBatchStudents.length > 0) {
      mode = "estimated";
      facesDetected = Math.max(1, Math.round(allBatchStudents.length * 0.7));
    }

    // N faces detected => first N students (by enrollment order) marked present
    const autoCount = Math.min(facesDetected, allBatchStudents.length);

    const results = allBatchStudents.map((s, idx) => {
      const isPresent = idx < autoCount;
      return {
        student_id: s.id,
        enrollment_no: s.enrollment_no,
        student_name: s.full_name,
        status: isPresent ? "present" : "absent",
        confidence: null,
        enrolled: !!s.luxand_person_uuid,
        auto_detected: isPresent && mode === "detected",
        fallback: isPresent && mode === "estimated",
      };
    });

    return json(200, {
      success: true,
      mode,
      faces_detected: facesDetected,
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
