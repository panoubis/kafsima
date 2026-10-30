// Μεσάζοντας ανάμεσα στην εφαρμογή και στο Gemini.
// Το κλειδί Gemini μένει εδώ (μυστικό GEMINI_API_KEY στο Cloudflare) και δεν μπαίνει ποτέ στην εφαρμογή.
//
// POST /read   headers: x-app-token
// body: { prompt: string, images: [base64 JPEG, ...] }
// απάντηση: { result: <JSON από το Gemini> }  ή  { error: "code" }

const MODELS = ["gemini-flash-latest", "gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];
const MAX_IMAGES = 3;
const MAX_IMAGE_B64 = 4_000_000;   // ~3 MB ανά φωτογραφία
const MAX_PROMPT = 20_000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-app-token",
  "Access-Control-Max-Age": "86400",
};
const reply = (status, obj) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/") return reply(200, { ok: true, service: "kafsima-ai" });
    if (req.method !== "POST" || url.pathname !== "/read") return reply(404, { error: "not_found" });
    if (!env.APP_TOKEN || req.headers.get("x-app-token") !== env.APP_TOKEN) return reply(401, { error: "unauthorized" });
    if (!env.GEMINI_API_KEY) return reply(500, { error: "not_configured" });

    let body;
    try { body = await req.json(); } catch { return reply(400, { error: "bad_request" }); }
    const prompt = typeof body?.prompt === "string" ? body.prompt : "";
    const images = Array.isArray(body?.images) ? body.images : [];
    if (!prompt || prompt.length > MAX_PROMPT || images.length > MAX_IMAGES ||
        images.some(i => typeof i !== "string" || i.length > MAX_IMAGE_B64)) {
      return reply(400, { error: "bad_request" });
    }

    const parts = [{ text: prompt }, ...images.map(data => ({ inline_data: { mime_type: "image/jpeg", data } }))];
    const payload = JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    });

    let last = "upstream_error";
    for (const model of MODELS) {
      let res;
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
          body: payload,
        });
      } catch { last = "upstream_error"; continue; }
      if (res.status === 404) { last = "no_model"; continue; }
      if (res.status === 429) { last = "rate_limited"; continue; }   // δοκίμασε μικρότερο μοντέλο
      if (res.status === 400 || res.status === 403) return reply(502, { error: "server_key" });
      if (!res.ok) { last = "upstream_error"; continue; }
      const data = await res.json();
      const text = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
      try { return reply(200, { result: JSON.parse(text) }); }
      catch {
        const m = text.match(/[\[{][\s\S]*[\]}]/);
        if (m) { try { return reply(200, { result: JSON.parse(m[0]) }); } catch {} }
        return reply(502, { error: "invalid_json" });
      }
    }
    return reply(last === "rate_limited" ? 429 : 502, { error: last });
  },
};
