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
    if (!LUXAND_TOKEN) {
      console.error("luxand-demo: LUXAND_API_TOKEN not configured");
      return json(500, { error: "Service unavailable" });
    }

    const body = await req.json().catch(() => null);
    const imageUrl: string | undefined = body?.image_url;
    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith("https://")) {
      return json(400, { error: "image_url (https) is required" });
    }
    const ALLOWED_HOSTS = new Set([
      "images.unsplash.com",
      "upload.wikimedia.org",
      "plus.unsplash.com",
    ]);
    let parsedUrl: URL;
    try { parsedUrl = new URL(imageUrl); } catch { return json(400, { error: "Invalid image_url" }); }
    if (!ALLOWED_HOSTS.has(parsedUrl.hostname)) {
      return json(400, { error: "Image host not allowed" });
    }

    const t0 = Date.now();

    // Luxand's photo URL parser breaks on query strings (especially with `&`).
    // Fetch the image ourselves and forward the raw bytes.
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return json(400, { error: `Could not fetch image (HTTP ${imgRes.status})` });
    }
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const imgBuf = await imgRes.arrayBuffer();
    const blob = new Blob([imgBuf], { type: contentType });

    const fd = new FormData();
    fd.append("photo", blob, "demo.jpg");

    const res = await fetch("https://api.luxand.cloud/photo/detect", {
      method: "POST",
      headers: { token: LUXAND_TOKEN },
      body: fd,
    });

    const data = await res.json().catch(() => ({}));
    const latency_ms = Date.now() - t0;

    if (!res.ok) {
      console.error("luxand-demo: Luxand request failed", res.status, data);
      return json(502, { error: "Demo temporarily unavailable. Please try again.", latency_ms });
    }

    const faces = Array.isArray(data) ? data : (data?.faces || []);
    // Strip any identifying info — return only counts, boxes, probability buckets
    const sanitized = faces.map((f: any, idx: number) => {
      const rect = f?.rectangle || f?.bbox || f?.box;
      return {
        index: idx,
        probability: typeof f?.probability === "number"
          ? f.probability
          : (typeof f?.confidence === "number" ? f.confidence : null),
        rectangle: rect
          ? {
              left: rect.left ?? rect.x ?? rect.x1,
              top: rect.top ?? rect.y ?? rect.y1,
              right: rect.right ?? rect.x2 ?? ((rect.x ?? 0) + (rect.width ?? 0)),
              bottom: rect.bottom ?? rect.y2 ?? ((rect.y ?? 0) + (rect.height ?? 0)),
            }
          : null,
        recognized: !!f?.uuid,
      };
    });

    return json(200, {
      success: true,
      provider: "Luxand Cloud",
      latency_ms,
      face_count: sanitized.length,
      faces: sanitized,
    });
  } catch (e) {
    console.error("luxand-demo error:", e);
    return json(500, { error: "An internal error occurred" });
  }
});
