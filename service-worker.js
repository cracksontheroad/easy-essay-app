/* ========================================================================
 * SERVICE WORKER — Easy Essay PWA
 *
 * Strategy:
 *   • App shell (HTML/CSS/JS/icons/curriculum) — cache-first
 *   • Chapter PDFs / infographic JPGs — cache-first, lazily populated
 *   • External API calls (Anthropic, OpenAI, Gemini, Notion, detection
 *     providers) — bypass the cache, network-only. We never proxy or
 *     intercept these — they go straight to the provider.
 *
 * Bump CACHE_VERSION on every release that changes any cached asset; the
 * old cache is cleaned up on activate.
 * ====================================================================== */

const CACHE_VERSION = "easy-essay-v2.9.3";
const SHELL_CACHE   = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

/* Core files that should be available offline immediately after install.
 * The chapter PDFs and infographic JPGs are not in this list — they're
 * cached on-demand the first time the user opens that chapter. */
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css",
  "/methodology.js",
  "/outlines.js",
  "/samples.js",
  "/chapters.js",
  "/chapter-full-text.js",
  "/local-checks.js",
  "/ai-providers.js",
  "/detection.js",
  "/notion.js",
  "/notion-sync.js",
  "/supabase-auth.js",
  "/app.js",
  "/manifest.json",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/icons/icon-180.png",
  "/assets/icons/favicon-32.png",
  "/assets/qr-code.png"
];

/* External hosts that MUST go to the network — never intercepted. */
const NETWORK_ONLY_HOSTS = [
  "api.anthropic.com",
  "api.openai.com",
  "generativelanguage.googleapis.com",
  "api.notion.com",
  "api.originality.ai",
  "api.gptzero.me",
  "api.copyleaks.com"
];

/* ============================================================ INSTALL */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // Use individual .add() calls instead of addAll() so one missing file
      // (e.g. an infographic that hasn't been generated yet) doesn't fail
      // the whole install.
      Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

/* ============================================================ ACTIVATE */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ============================================================ FETCH */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Network-only for AI/Notion/detection APIs.
  if (NETWORK_ONLY_HOSTS.some((h) => url.hostname.endsWith(h))) {
    return; // let the request go to the network unhindered
  }

  // Network-FIRST for HTML / navigation, so every visit can pick up new UI
  // and fixes immediately (no stale shell). Falls back to cache offline.
  if (req.mode === "navigate" || (req.destination === "document")) {
    event.respondWith(networkFirstThenCache(req));
    return;
  }

  // Cache-first for same-origin assets (CSS / JS / images / PDFs).
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirstThenNetwork(req));
    return;
  }

  // Default for other cross-origin requests: network with cache fallback.
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

async function networkFirstThenCache(request) {
  try {
    const resp = await fetch(request);
    if (resp && resp.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, resp.clone());
    }
    return resp;
  } catch (err) {
    const cached = await caches.match(request) || await caches.match("/index.html");
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirstThenNetwork(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Refresh in background (stale-while-revalidate) but only for non-HTML
    // so users don't get stale UI updates without a reload.
    if (!request.url.endsWith(".html") && !request.url.endsWith("/")) {
      fetch(request).then((resp) => {
        if (resp && resp.ok) {
          caches.open(SHELL_CACHE).then((c) => c.put(request, resp.clone()));
        }
      }).catch(() => {});
    }
    return cached;
  }
  try {
    const resp = await fetch(request);
    // Store in runtime cache so chapter PDFs / infographics load instantly
    // next time.
    if (resp && resp.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, resp.clone());
    }
    return resp;
  } catch (err) {
    // Final offline fallback — serve the shell so the app at least loads.
    if (request.mode === "navigate") {
      const shell = await caches.match("/index.html");
      if (shell) return shell;
    }
    throw err;
  }
}

/* ============================================================ MESSAGES */
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});
