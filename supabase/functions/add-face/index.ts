import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AZURE_KEY = Deno.env.get("AZURE_FACE_API_KEY")!;
const AZURE_ENDPOINT = Deno.env.get("AZURE_FACE_API_ENDPOINT")!;
const PERSON_GROUP_ID = "eduvista-students";

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: authError } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const studentId = formData.get("student_id") as string;
    const enrollmentNo = formData.get("enrollment_no") as string;
    const fullName = formData.get("full_name") as string;
    const imageFile = formData.get("image") as File;

    if (!studentId || !enrollmentNo || !imageFile) {
      return new Response(
        JSON.stringify({ error: "Missing student_id, enrollment_no, or image" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Ensure PersonGroup exists (ignore 409 if already exists)
    const pgRes = await fetch(
      `${AZURE_ENDPOINT}/face/v1.0/persongroups/${PERSON_GROUP_ID}`,
      {
        method: "PUT",
        headers: { "Ocp-Apim-Subscription-Key": AZURE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "EduVista Students", recognitionModel: "recognition_04" }),
      }
    );
    if (!pgRes.ok && pgRes.status !== 409) {
      const pgErr = await pgRes.text();
      console.error("PersonGroup create error:", pgErr);
    } else {
      await pgRes.text();
    }

    // 2. Check if student already has an azure_person_id
    const { data: student } = await supabase
      .from("students")
      .select("azure_person_id")
      .eq("id", studentId)
      .single();

    let personId = student?.azure_person_id;

    if (!personId) {
      // 3. Create Person in PersonGroup
      const createRes = await fetch(
        `${AZURE_ENDPOINT}/face/v1.0/persongroups/${PERSON_GROUP_ID}/persons`,
        {
          method: "POST",
          headers: { "Ocp-Apim-Subscription-Key": AZURE_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ name: fullName, userData: enrollmentNo }),
        }
      );
      const createBody = await createRes.json();
      if (!createRes.ok) {
        return new Response(JSON.stringify({ error: "Failed to create Azure Person", details: createBody }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      personId = createBody.personId;
    }

    // 4. Add face to Person
    const imageBytes = await imageFile.arrayBuffer();
    const addFaceRes = await fetch(
      `${AZURE_ENDPOINT}/face/v1.0/persongroups/${PERSON_GROUP_ID}/persons/${personId}/persistedFaces?detectionModel=detection_03`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_KEY,
          "Content-Type": "application/octet-stream",
        },
        body: imageBytes,
      }
    );
    const addFaceBody = await addFaceRes.json();
    if (!addFaceRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to add face", details: addFaceBody }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Upload image to Supabase Storage
    const path = `students/${enrollmentNo}/${Date.now()}.jpg`;
    const { error: uploadErr } = await supabase.storage
      .from("face-images")
      .upload(path, new Uint8Array(imageBytes), { contentType: "image/jpeg" });

    if (uploadErr) {
      console.error("Storage upload error:", uploadErr);
    }

    const { data: urlData } = supabase.storage.from("face-images").getPublicUrl(path);

    // 6. Update student record
    await supabase
      .from("students")
      .update({
        azure_person_id: personId,
        face_image_url: urlData.publicUrl,
        face_enrolled: true,
      })
      .eq("id", studentId);

    return new Response(
      JSON.stringify({ personId, faceId: addFaceBody.persistedFaceId, imageUrl: urlData.publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("add-face error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
