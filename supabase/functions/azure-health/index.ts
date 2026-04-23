const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const KEY = Deno.env.get("AZURE_FACE_API_KEY");
  const EP = Deno.env.get("AZURE_FACE_API_ENDPOINT");

  const out: any = {
    key_present: !!KEY,
    endpoint_present: !!EP,
    endpoint: EP || null,
  };

  if (!KEY || !EP) {
    return new Response(JSON.stringify({ ok: false, ...out, error: "Missing AZURE secrets" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const r = await fetch(`${EP.replace(/\/$/, "")}/face/v1.0/persongroups/eduvista-students`, {
      headers: { "Ocp-Apim-Subscription-Key": KEY },
    });
    const body = await r.text();
    out.persongroup_status = r.status;
    out.persongroup_body = body.slice(0, 500);
    out.ok = r.ok || r.status === 404; // 404 = group not yet created, but auth works
  } catch (e: any) {
    out.ok = false;
    out.fetch_error = e.message;
  }

  return new Response(JSON.stringify(out, null, 2), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
