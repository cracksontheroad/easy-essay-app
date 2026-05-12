/* ========================================================================
 * EASY ESSAY — NOTION PROXY WORKER
 *
 * Cloudflare Worker that forwards browser-side requests to the Notion API
 * with proper CORS headers. The Notion API does not natively support CORS,
 * so a thin proxy is required for any browser-only client.
 *
 * Deploy:
 *   1. dash.cloudflare.com → Workers & Pages → Create → Worker
 *   2. Name it (e.g. "easy-essay-notion-proxy")
 *   3. Paste this entire file as the Worker code
 *   4. Deploy. Copy the URL (e.g. https://easy-essay-notion-proxy.cracksontheroad.workers.dev)
 *   5. In Easy Essay → Settings → Notion → paste the Worker URL into the
 *      "Notion proxy URL" field. Click Save.
 *
 * Security: this Worker is a *pass-through*. It does not log, store, or
 * inspect your Notion token. Tokens travel from the browser → through
 * Cloudflare's edge → straight to api.notion.com.
 *
 * If you ever want to lock it down to a specific origin, change the
 * `ALLOWED_ORIGINS` constant below.
 * ====================================================================== */

const ALLOWED_ORIGINS = "*"; // or e.g. ["https://essay.sailedu.co", "https://cracksontheroad.github.io"]

const NOTION_API_BASE = "https://api.notion.com";

const ALLOWED_HEADERS = [
  "Authorization",
  "Notion-Version",
  "Content-Type",
  "X-Notion-Forwarded-For"
].join(", ");

const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";

function corsHeadersFor(request) {
  const origin = request.headers.get("Origin") || "*";
  const allow = Array.isArray(ALLOWED_ORIGINS)
    ? (ALLOWED_ORIGINS.includes(origin) ? origin : "null")
    : ALLOWED_ORIGINS;
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Health-check endpoint
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          ok: true,
          service: "easy-essay-notion-proxy",
          forwards: NOTION_API_BASE,
          paths: "/v1/*"
        }, null, 2),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeadersFor(request) } }
      );
    }

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeadersFor(request) });
    }

    // Only proxy /v1/* paths (Notion's REST API namespace)
    if (!url.pathname.startsWith("/v1/")) {
      return new Response(
        JSON.stringify({ error: "Not a Notion API path", path: url.pathname }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeadersFor(request) } }
      );
    }

    // Build the upstream URL
    const upstreamUrl = NOTION_API_BASE + url.pathname + url.search;

    // Copy headers; drop ones the browser shouldn't be forwarding
    const fwdHeaders = new Headers();
    for (const [k, v] of request.headers.entries()) {
      const kl = k.toLowerCase();
      if (kl === "host" || kl === "origin" || kl === "referer") continue;
      if (kl.startsWith("cf-") || kl.startsWith("x-forwarded-")) continue;
      if (kl === "cookie") continue;
      fwdHeaders.set(k, v);
    }
    // Notion-Version is required; default if missing
    if (!fwdHeaders.has("Notion-Version")) {
      fwdHeaders.set("Notion-Version", "2022-06-28");
    }

    // Forward the request
    let upstream;
    try {
      const body = (request.method === "GET" || request.method === "HEAD")
        ? null
        : await request.arrayBuffer();
      upstream = await fetch(upstreamUrl, {
        method: request.method,
        headers: fwdHeaders,
        body
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Upstream fetch failed", message: String(err && err.message || err) }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeadersFor(request) } }
      );
    }

    // Echo the response, adding CORS headers
    const respHeaders = new Headers(upstream.headers);
    Object.entries(corsHeadersFor(request)).forEach(([k, v]) => respHeaders.set(k, v));
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders
    });
  }
};
