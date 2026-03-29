import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AZURE_KEY = Deno.env.get("AZURE_FACE_API_KEY")!;
const AZURE_ENDPOINT = Deno.env.get("AZURE_FACE_API_ENDPOINT")!;
const PERSON_GROUP_ID = "eduvista-students";
const CONFIDENCE_THRESHOLD = 0.7;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const formData = await req.formData();
    const subject = formData.get("subject") as string;
    const images: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image") && value instanceof File) {
        images.push(value);
      }
    }

    if (!subject || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing subject or images" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Collect all detected faceIds across images
    const allFaceIds: string[] = [];
    const faceIdToImage: Record<string, number> = {};

    for (let i = 0; i < images.length; i++) {
      const imageBytes = await images[i].arrayBuffer();

      // Detect faces
      const detectRes = await fetch(
        `${AZURE_ENDPOINT}/face/v1.0/detect?returnFaceId=true&recognitionModel=recognition_04&detectionModel=detection_03`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": AZURE_KEY,
            "Content-Type": "application/octet-stream",
          },
          body: imageBytes,
        }
      );
      const faces = await detectRes.json();
      if (!detectRes.ok) {
        console.error("Detect error:", faces);
        continue;
      }

      for (const face of faces) {
        if (face.faceId) {
          allFaceIds.push(face.faceId);
          faceIdToImage[face.faceId] = i;
        }
      }
    }

    if (allFaceIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No faces detected in any image" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Identify faces in batches of 10 (Azure limit)
    const matchedPersonIds = new Map<string, number>(); // personId -> best confidence

    for (let i = 0; i < allFaceIds.length; i += 10) {
      const batch = allFaceIds.slice(i, i + 10);
      const identifyRes = await fetch(
        `${AZURE_ENDPOINT}/face/v1.0/identify`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": AZURE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personGroupId: PERSON_GROUP_ID,
            faceIds: batch,
            maxNumOfCandidatesReturned: 1,
            confidenceThreshold: CONFIDENCE_THRESHOLD,
          }),
        }
      );
      const identifyResults = await identifyRes.json();
      if (!identifyRes.ok) {
        console.error("Identify error:", identifyResults);
        continue;
      }

      for (const result of identifyResults) {
        if (result.candidates && result.candidates.length > 0) {
          const candidate = result.candidates[0];
          const existing = matchedPersonIds.get(candidate.personId);
          if (!existing || candidate.confidence > existing) {
            matchedPersonIds.set(candidate.personId, candidate.confidence);
          }
        }
      }
    }

    // Fetch all students
    const { data: allStudents } = await supabase
      .from("students")
      .select("id, enrollment_no, full_name, azure_person_id");

    const students = allStudents || [];

    // Build results: match by azure_person_id
    const results = students.map((s) => {
      const confidence = s.azure_person_id
        ? matchedPersonIds.get(s.azure_person_id) ?? null
        : null;
      return {
        student_id: s.id,
        enrollment_no: s.enrollment_no,
        student_name: s.full_name,
        status: confidence !== null ? "present" : "absent",
        confidence: confidence !== null ? Math.round(confidence * 100) / 100 : null,
      };
    });

    return new Response(JSON.stringify({
      subject,
      faculty_id: user.id,
      total_detected: allFaceIds.length,
      total_matched: matchedPersonIds.size,
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("recognize-faces error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
