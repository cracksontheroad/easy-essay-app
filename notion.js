/* ========================================================================
 * NOTION INTEGRATION
 * Uses Notion's public REST API directly from the browser.
 * Requires an Internal Integration Token + the parent page shared with it.
 * ====================================================================== */

const NOTION_VERSION = "2022-06-28";

/* Notion API does not allow browser-direct (CORS-blocked) — every request
 * goes through a small proxy.
 *
 * Resolution order:
 *   1. window.NOTION_PROXY_URL  (explicit setting, for external proxies like
 *      Cloudflare Workers / Vercel / Deno)
 *   2. Same-origin /api/notion   (Netlify Function or Cloudflare Pages Function
 *      on the same host — preferred)
 *   3. null  (no proxy → fail fast with a clear error)
 *
 * The same-origin path is auto-detected by hitting /api/notion/health on
 * page init. The result is cached in window._NOTION_SAMEORIGIN_OK so we
 * don't probe on every call. */
function notionBaseUrl() {
  try {
    if (window.NOTION_PROXY_URL && typeof window.NOTION_PROXY_URL === "string") {
      return window.NOTION_PROXY_URL.replace(/\/+$/, "");
    }
    if (window._NOTION_SAMEORIGIN_OK === true) {
      return window.location.origin + "/api/notion";
    }
  } catch (_) { /* in case window isn't around (e.g. node test) */ }
  return null;
}

/* Probe the same-origin proxy once at startup. If /api/notion/health
 * responds with our service marker, set the flag so notionBaseUrl() can
 * use it. Runs in the background; the first Notion call after page load
 * will use whatever's resolved by then. */
async function _probeSameOriginProxy() {
  if (typeof window === "undefined") return;
  if (window._NOTION_SAMEORIGIN_OK !== undefined) return; // already probed
  try {
    const r = await fetch(window.location.origin + "/api/notion/health", {
      method: "GET",
      headers: { "Accept": "application/json" }
    });
    if (r.ok) {
      const j = await r.json().catch(() => null);
      window._NOTION_SAMEORIGIN_OK = !!(j && j.service === "easy-essay-notion-proxy");
    } else {
      window._NOTION_SAMEORIGIN_OK = false;
    }
  } catch {
    window._NOTION_SAMEORIGIN_OK = false;
  }
}
// Probe lazily once the module loads.
if (typeof window !== "undefined") _probeSameOriginProxy();

const Notion = {

  async _req(token, path, init = {}) {
    if (!token) throw new Error("No Notion token. Add one in Settings.");
    const base = notionBaseUrl();
    if (!base) {
      throw new Error(
        "No Notion proxy available. Notion's API blocks browser-direct calls (CORS). " +
        "Pick one of these:\n" +
        "  (A) Host the app on Netlify — the included netlify/functions/notion-proxy.mjs " +
            "becomes available at /api/notion automatically. See docs/NETLIFY-DEPLOY.md.\n" +
        "  (B) Deploy the Cloudflare Worker from cloudflare-worker/notion-proxy.js and paste " +
            "its URL into Settings → Notion proxy URL. See docs/CLOUDFLARE-WORKER-DEPLOY.md."
      );
    }
    const res = await fetch(`${base}/v1${path}`, {
      ...init,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
        ...(init.headers || {})
      }
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Notion ${res.status}: ${txt.slice(0, 400)}`);
    }
    return res.json();
  },

  async test(token) {
    return Notion._req(token, "/users/me");
  },

  /* ====================================================================
   * READ — search the user's workspace and pull page content as research.
   * ================================================================= */

  /* Search workspace for pages / databases matching a query.
   * Returns the raw Notion search result. */
  async search(token, query, opts = {}) {
    const body = {
      query: query || "",
      page_size: opts.page_size || 25
    };
    if (opts.filterType) {
      body.filter = { value: opts.filterType, property: "object" };  // "page" or "database"
    }
    if (opts.sortDirection) {
      body.sort = { direction: opts.sortDirection, timestamp: "last_edited_time" };
    }
    return Notion._req(token, "/search", { method: "POST", body: JSON.stringify(body) });
  },

  /* Concise plain-text version of a Notion block — used by getPageText. */
  _blockToText(block) {
    const t = block.type;
    const rt = block[t] && block[t].rich_text;
    if (!Array.isArray(rt)) return "";
    const plain = rt.map(r => r.plain_text || "").join("");
    if (!plain) return "";
    if (t === "heading_1") return `\n# ${plain}\n`;
    if (t === "heading_2") return `\n## ${plain}\n`;
    if (t === "heading_3") return `\n### ${plain}\n`;
    if (t === "bulleted_list_item") return `- ${plain}\n`;
    if (t === "numbered_list_item") return `1. ${plain}\n`;
    if (t === "to_do") return `[${block.to_do.checked ? "x" : " "}] ${plain}\n`;
    if (t === "quote") return `> ${plain}\n`;
    if (t === "code") return `\`\`\`\n${plain}\n\`\`\`\n`;
    if (t === "callout") return `📌 ${plain}\n`;
    return `${plain}\n`;
  },

  /* Pull the full plain-text content of a Notion page, paginating through
   * its block children. Returns a single Markdown-ish string. */
  async getPageText(token, pageId, opts = {}) {
    const maxBlocks = opts.maxBlocks || 500;
    const parts = [];
    let cursor;
    let total = 0;
    do {
      const qs = cursor ? `?start_cursor=${encodeURIComponent(cursor)}&page_size=100` : "?page_size=100";
      const r = await Notion._req(token, `/blocks/${pageId}/children${qs}`);
      for (const b of (r.results || [])) {
        parts.push(Notion._blockToText(b));
        total++;
        if (total >= maxBlocks) break;
      }
      cursor = r.has_more ? r.next_cursor : null;
      if (total >= maxBlocks) break;
    } while (cursor);
    return parts.join("").trim();
  },

  /* Get a page's title from its properties. Works for both
   * top-level pages and database items. */
  async getPageTitle(token, pageId) {
    const p = await Notion._req(token, `/pages/${pageId}`);
    const props = p.properties || {};
    for (const k of Object.keys(props)) {
      const v = props[k];
      if (v && v.type === "title" && Array.isArray(v.title)) {
        return v.title.map(t => t.plain_text || "").join("").trim();
      }
    }
    return "(untitled)";
  },

  /* ====================================================================
   * WRITE — create databases + bootstrap a student workspace.
   * ================================================================= */

  /* Create a new database under parentPageId with the given title + schema.
   * `schema` is the Notion-API properties object. */
  async createDatabase(token, parentPageId, title, schema) {
    const parent = { type: "page_id", page_id: Notion._formatId(parentPageId) };
    return Notion._req(token, "/databases", {
      method: "POST",
      body: JSON.stringify({
        parent,
        title: [{ type: "text", text: { content: title } }],
        properties: schema
      })
    });
  },

  /* Create an empty page under a parent. Returns the new page id. */
  async createSubPage(token, parentPageId, title, blocks) {
    return Notion._req(token, "/pages", {
      method: "POST",
      body: JSON.stringify({
        parent: { type: "page_id", page_id: Notion._formatId(parentPageId) },
        properties: { title: { title: [{ type: "text", text: { content: title } }] } },
        children: blocks || []
      })
    });
  },

  /* The full student workspace: four databases + an Index page, all under
   * the configured parent page. Idempotent-friendly: a progress callback is
   * fired for each step so the UI can show what's happening, and any step
   * that errors is reported but does not abort the rest. */
  async bootstrapWorkspace(token, parentPageId, onProgress) {
    const log = (msg, ok = true, detail) => {
      if (typeof onProgress === "function") onProgress({ msg, ok, detail });
    };
    const out = { databases: {}, pages: {}, errors: [] };
    const safe = async (label, fn) => {
      try {
        log(label + "…", true);
        const r = await fn();
        log(label + " ✓", true);
        return r;
      } catch (err) {
        log(label + " ✗ " + err.message, false);
        out.errors.push({ label, error: err.message });
        return null;
      }
    };

    // 1) Index page — a friendly landing page with links to everything else.
    const idx = await safe("Creating Index page", () =>
      Notion.createSubPage(token, parentPageId, "📚 Academic Writing Workspace", [
        Notion._heading("My academic writing workspace", 1),
        Notion._para("This workspace was set up by Easy Essay. The databases below are designed to last from high school through university and beyond — every essay, source, research question, and study note you save here builds a permanent personal research library."),
        Notion._heading("Quick links", 2),
        Notion._bullet("📝 Essay Library — every essay you've written or are working on"),
        Notion._bullet("📖 Source Library — RADAR-evaluated sources, reusable across essays"),
        Notion._bullet("❓ Research Questions — refined questions you've explored"),
        Notion._bullet("🗒️ Study Notes — reading notes, lecture notes, idea fragments"),
        Notion._heading("How to use this with Easy Essay", 2),
        Notion._para("In the app's Sources step, click 'Import from Notion' to pull a Notion page in as research. When you finish an essay, click 'Push to Notion' on the Final step — it adds a new entry to Essay Library and creates a full sub-page with the draft and metadata.")
      ]));
    if (idx) out.pages.index = idx.id;

    // 2) Essay Library database.
    const essayDb = await safe("Creating Essay Library database", () =>
      Notion.createDatabase(token, parentPageId, "📝 Essay Library", {
        Name:        { title: {} },
        Course:      { rich_text: {} },
        "Essay type":{ select: { options: [
                          { name: "Argumentative",     color: "red" },
                          { name: "Comparative",       color: "orange" },
                          { name: "Analytical",        color: "yellow" },
                          { name: "Problem-Solution",  color: "green" },
                          { name: "Reflective",        color: "blue" },
                          { name: "Literature Review", color: "purple" },
                          { name: "Research Proposal", color: "pink" }
                       ]}},
        Status:      { select: { options: [
                          { name: "Idea",       color: "gray" },
                          { name: "Researching",color: "yellow" },
                          { name: "Outlining",  color: "orange" },
                          { name: "Drafting",   color: "blue" },
                          { name: "Polishing",  color: "purple" },
                          { name: "Submitted",  color: "green" },
                          { name: "Graded",     color: "default" }
                       ]}},
        "Academic level": { select: { options: [
                          { name: "Foundation / Pre-University", color: "default" },
                          { name: "Undergraduate",  color: "blue" },
                          { name: "Postgraduate",   color: "purple" },
                          { name: "Doctoral",       color: "red" }
                       ]}},
        "Word count":{ number: {} },
        "Due date":  { date: {} },
        Grade:       { rich_text: {} },
        Tags:        { multi_select: {} },
        "Citation style": { select: { options: [
                          { name: "APA 7th" }, { name: "Harvard" },
                          { name: "MLA 9th" }, { name: "Chicago" },
                          { name: "IEEE" },    { name: "OSCOLA" }
                       ]}}
      }));
    if (essayDb) out.databases.essays = essayDb.id;

    // 3) Source Library database.
    const sourceDb = await safe("Creating Source Library database", () =>
      Notion.createDatabase(token, parentPageId, "📖 Source Library", {
        Title:    { title: {} },
        Authors:  { rich_text: {} },
        Year:     { number: {} },
        URL:      { url: {} },
        "Source type": { select: { options: [
                          { name: "Primary — data" },
                          { name: "Primary — text" },
                          { name: "Secondary — peer-reviewed" },
                          { name: "Secondary — trade" },
                          { name: "Secondary — news" },
                          { name: "Tertiary — reference" },
                          { name: "Tertiary — database" },
                          { name: "Opinion / op-ed" },
                          { name: "Grey literature" },
                          { name: "Other" }
                       ]}},
        "RADAR score": { number: {} },
        Discipline:    { multi_select: {} },
        Tags:          { multi_select: {} },
        "Used in":     { rich_text: {} },
        "Key finding": { rich_text: {} }
      }));
    if (sourceDb) out.databases.sources = sourceDb.id;

    // 4) Research Questions database.
    const rqDb = await safe("Creating Research Questions database", () =>
      Notion.createDatabase(token, parentPageId, "❓ Research Questions", {
        Question:    { title: {} },
        Topic:       { multi_select: {} },
        Status:      { select: { options: [
                          { name: "Open" }, { name: "Selected" },
                          { name: "Archived" }, { name: "Answered" }
                       ]}},
        Specificity:     { number: {} },
        Researchability: { number: {} },
        Significance:    { number: {} },
        Arguability:     { number: {} },
        Scope:           { number: {} },
        Total:           { number: {} },
        "Linked essay":  { rich_text: {} }
      }));
    if (rqDb) out.databases.questions = rqDb.id;

    // 5) Study Notes database (general-purpose research / annotation).
    const notesDb = await safe("Creating Study Notes database", () =>
      Notion.createDatabase(token, parentPageId, "🗒️ Study Notes", {
        Title:   { title: {} },
        Course:  { rich_text: {} },
        Type:    { select: { options: [
                      { name: "Reading note" },
                      { name: "Lecture note" },
                      { name: "Idea fragment" },
                      { name: "Quote" },
                      { name: "Question" }
                   ]}},
        Tags:    { multi_select: {} },
        "Source": { rich_text: {} },
        Date:    { date: {} }
      }));
    if (notesDb) out.databases.notes = notesDb.id;

    log("Workspace bootstrap complete.", true, out);
    return out;
  },

  /* Extract a Notion page UUID from user input. Accepts:
   *   - 32 hex chars, no dashes      ("abcdef0123456789abcdef0123456789ab")
   *   - UUID-format with dashes      ("abcdef01-2345-6789-abcd-ef0123456789")
   *   - Full Notion URL              ("https://www.notion.so/My-Page-abcdef01…")
   *   - Notion URL with ?pvs=4 / #anchor / extra parameters
   *
   * Strategy: strip the URL's query string (`?…`) and fragment (`#…`),
   * then look for a 32-hex run (with optional dashes in UUID positions).
   * Returns the canonical dashed UUID, or null if no match. */
  _extractHexId(input) {
    if (!input) return null;
    // Drop everything after ? or #, then trim.
    const s = String(input).split(/[?#]/)[0].trim();
    if (!s) return null;
    // 1) Try UUID-dashed pattern first (handles both raw UUIDs and URLs ending in one).
    const uuid = s.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
    if (uuid) return uuid[0].toLowerCase();
    // 2) Fall back to any 32-hex run.
    const hex = s.match(/[a-f0-9]{32}/i);
    if (hex) {
      const h = hex[0].toLowerCase();
      return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;
    }
    return null;
  },

  /* Normalise a Notion page id for API calls. Returns the canonical dashed
   * form, or the original input if nothing matched (so callers surface a
   * clean error from Notion itself). */
  _formatId(input) {
    const id = Notion._extractHexId(input);
    return id || input;
  },

  /* Exposed helper for the UI to validate user input. Returns null when
   * no valid page ID can be parsed. */
  parsePageId(input) {
    return Notion._extractHexId(input);
  },

  /* Convert plain text essay content into Notion blocks.
     Each paragraph -> paragraph block; headings recognised via "# " / "## ". */
  _textToBlocks(text) {
    const blocks = [];
    const lines = (text || "").split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      let block;
      if (line.startsWith("# "))      block = Notion._heading(line.slice(2), 1);
      else if (line.startsWith("## ")) block = Notion._heading(line.slice(3), 2);
      else if (line.startsWith("### "))block = Notion._heading(line.slice(4), 3);
      else if (line.startsWith("- "))  block = Notion._bullet(line.slice(2));
      else                             block = Notion._para(line);
      blocks.push(block);
    }
    return blocks;
  },

  _para(t) {
    return {
      object: "block", type: "paragraph",
      paragraph: { rich_text: [{ type: "text", text: { content: t } }] }
    };
  },
  _bullet(t) {
    return {
      object: "block", type: "bulleted_list_item",
      bulleted_list_item: { rich_text: [{ type: "text", text: { content: t } }] }
    };
  },
  _heading(t, level) {
    const type = `heading_${level}`;
    return {
      object: "block", type,
      [type]: { rich_text: [{ type: "text", text: { content: t } }] }
    };
  },

  /* Push an essay as a new page under a parent page. */
  async pushEssay({ token, parentPageId, essay }) {
    if (!parentPageId) throw new Error("Set a Notion parent page ID in Settings.");
    const cleanParent = parentPageId.replace(/-/g, "").trim();
    const formattedParent =
      cleanParent.length === 32
        ? `${cleanParent.slice(0,8)}-${cleanParent.slice(8,12)}-${cleanParent.slice(12,16)}-${cleanParent.slice(16,20)}-${cleanParent.slice(20,32)}`
        : parentPageId;

    const title = essay.title || "Untitled essay";
    const essayType = essay.essayType || "essay";
    const fullText = Notion._composeEssayText(essay);
    const blocks = Notion._textToBlocks(fullText);

    // Notion limits to 100 blocks per create call — we batch beyond that.
    const firstBatch = blocks.slice(0, 100);
    const rest = blocks.slice(100);

    const page = await Notion._req(token, "/pages", {
      method: "POST",
      body: JSON.stringify({
        parent: { type: "page_id", page_id: formattedParent },
        properties: {
          title: { title: [{ type: "text", text: { content: `${title} — ${essayType}` } }] }
        },
        children: firstBatch
      })
    });

    // Append any remaining blocks in 100-block chunks
    while (rest.length) {
      const chunk = rest.splice(0, 100);
      await Notion._req(token, `/blocks/${page.id}/children`, {
        method: "PATCH",
        body: JSON.stringify({ children: chunk })
      });
    }

    return page;
  },

  _composeEssayText(essay) {
    const parts = [];
    parts.push(`# ${essay.title || "Untitled essay"}`);
    parts.push(`Essay type: ${essay.essayType || ""}`);
    parts.push(`Last updated: ${new Date(essay.updatedAt || Date.now()).toISOString()}`);
    parts.push("");

    parts.push("## Prompt");
    parts.push(essay.prompt || "(none)");
    parts.push("");

    parts.push("## Thesis");
    parts.push(essay.thesis || "(none)");
    parts.push("");

    if (essay.outline) {
      parts.push("## Outline");
      parts.push(essay.outline);
      parts.push("");
    }

    if (essay.draft && essay.draft.trim()) {
      parts.push("## Draft");
      parts.push(essay.draft);
      parts.push("");
    }

    if (essay.notes && essay.notes.trim()) {
      parts.push("## Working notes");
      parts.push(essay.notes);
      parts.push("");
    }

    if (essay.sources && essay.sources.length) {
      parts.push("## Sources (RADAR-evaluated)");
      for (const s of essay.sources) {
        parts.push(`- ${s.title || "(untitled)"} — ${s.url || ""} — RADAR: ${s.radarScore || "?"}/5`);
      }
    }
    return parts.join("\n");
  }
};

window.Notion = Notion;
