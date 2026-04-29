// Public, unauthenticated demo endpoint for the landing page.
// Calls Luxand's photo/search/v2 with a provided image URL and returns
// only non-identifying face detection data (count, bounding boxes,
// per-face match probability). No database access. No PII returned.

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

// Naive in-memory rate limit per IP (best-effort; resets on cold start)
const hits = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const now = Date.now();
    const cur = hits.get(ip);
    if (!cur || now - cur.ts > WINDOW_MS) {
      hits.set(ip, { count: 1, ts: now });
    } else {
      cur.count += 1;
      if (cur.count > MAX_PER_WINDOW) {
        return json(429, { error: "Too many demo requests. Please wait a minute." });
      }
    }

    const LUXAND_TOKEN = Deno.env.get("LUXAND_API_TOKEN");
    if (!LUXAND_TOKEN) return json(500, { error: "LUXAND_API_TOKEN not configured" });

    const body = await req.json().catch(() => null);
    const imageUrl: string | undefined = body?.image_url;
    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith("https://")) {
      return json(400, { error: "image_url (https) is required" });
    }

    const t0 = Date.now();
    const fd = new FormData();
    fd.append("photo", imageUrl);

    const res = await fetch("https://api.luxand.cloud/photo/search/v2", {
      method: "POST",
      headers: { token: LUXAND_TOKEN },
      body: fd,
    });

    const data = await res.json().catch(() => ({}));
    const latency_ms = Date.now() - t0;

    if (!res.ok) {
      return json(res.status, { error: "Luxand request failed", details: data, latency_ms });
    }

    const faces = Array.isArray(data) ? data : (data?.faces || []);
    // Strip any identifying info — return only counts, boxes, probability buckets
    const sanitized = faces.map((f: any, idx: number) => ({
      index: idx,
      probability: typeof f?.probability === "number" ? f.probability : null,
      rectangle: f?.rectangle
        ? {
            left: f.rectangle.left,
            top: f.rectangle.top,
            right: f.rectangle.right,
            bottom: f.rectangle.bottom,
          }
        : null,
      // Whether Luxand recognized this face against ITS demo collection (not ours)
      recognized: !!f?.uuid,
    }));

    return json(200, {
      success: true,
      provider: "Luxand Cloud",
      latency_ms,
      face_count: sanitized.length,
      faces: sanitized,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("luxand-demo error:", msg);
    return json(500, { error: msg });
  }
});
