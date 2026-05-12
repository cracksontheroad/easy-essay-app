/* ========================================================================
 * EASY ESSAY — NOTION PROXY (Netlify Function)
 *
 * Forwards browser-side requests at /api/notion/v1/* to https://api.notion.com/v1/*
 * with CORS headers, because Notion's API doesn't allow browser-direct calls.
 *
 * Same-origin: when the app is hosted on Netlify, this function runs on the
 * same domain, so there's no CORS issue at all between the app and the
 * proxy. The CORS headers below are defensive — useful if anyone calls the
 * function from a different origin (e.g. the Wix iframe variant or a
 * GitHub-Pages-hosted copy).
 *
 * Netlify Functions v2 syntax (web-standard Request/Response).
 * ====================================================================== */

export const config = {
  // Catch every URL under /api/notion/* and forward it.
  path: "/api/notion/*"
};

const NOTION_API_BASE = "https://api.notion.com";
const ALLOWED_HEADERS = "Authorization, Notion-Version, Content-Type";
const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";

function corsHeaders(req) {
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

export default async (req, ctx) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  // The request URL inside Netlify is e.g.
  //   https://your-site.netlify.app/api/notion/v1/users/me
  // We want everything after /api/notion to pass through to Notion.
  const url = new URL(req.url);
  const prefix = "/api/notion";
  let suffix = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : url.pathname;
  if (!suffix.startsWith("/")) suffix = "/" + suffix;

  // Health-check
  if (suffix === "/" || suffix === "/health") {
    return new Response(JSON.stringify({
      ok: true,
      service: "easy-essay-notion-proxy",
      runtime: "netlify-function",
      forwards: NOTION_API_BASE,
      paths: "/api/notion/v1/*"
    }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders(req) } });
  }

  if (!suffix.startsWith("/v1/")) {
    return new Response(JSON.stringify({ error: "Not a Notion API path", path: suffix }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders(req) } });
  }

  const upstreamUrl = NOTION_API_BASE + suffix + url.search;

  // Forward headers; drop the ones that don't belong on the upstream call.
  const fwdHeaders = new Headers();
  for (const [k, v] of req.headers.entries()) {
    const kl = k.toLowerCase();
    if (kl === "host" || kl === "origin" || kl === "referer") continue;
    if (kl.startsWith("x-forwarded-") || kl.startsWith("x-nf-")) continue;
    if (kl === "cookie") continue;
    fwdHeaders.set(k, v);
  }
  if (!fwdHeaders.has("Notion-Version")) {
    fwdHeaders.set("Notion-Version", "2022-06-28");
  }

  let upstream;
  try {
    upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers: fwdHeaders,
      body: (req.method === "GET" || req.method === "HEAD") ? null : await req.arrayBuffer()
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Upstream fetch failed", message: String(err && err.message || err) }),
      { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders(req) } });
  }

  const respHeaders = new Headers(upstream.headers);
  Object.entries(corsHeaders(req)).forEach(([k, v]) => respHeaders.set(k, v));
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders
  });
};
