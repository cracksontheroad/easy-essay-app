/* ========================================================================
 * NOTION-SYNC  (Phase 5)
 *
 * Two-way sync between the app's localStorage essay state and a Notion
 * page (one page per essay, in the bootstrapped Essay Library DB).
 *
 * Design:
 *   - The app's essay state is a JSON object (see app.js).
 *   - On push: serialise the whole state to JSON, write it as a single
 *     CODE block on the Notion page, plus mirror the database-row
 *     properties for human use. Also rewrite a small set of headings so
 *     the page is browsable in Notion. The JSON block is the canonical
 *     state and the only thing pulled back.
 *   - On pull: locate the JSON code block, concatenate its rich-text
 *     chunks, parse, return the essay state.
 *   - First push creates the page (in the Essay Library DB) and stores
 *     the page id on essay.notionPageId.
 *
 * Notion API constraints accounted for:
 *   - 100 blocks per create / append call → batched.
 *   - 2000 chars per rich-text item → JSON split into ~1900-char chunks.
 *   - Block deletion is one-call-per-block → push uses a single code
 *     block + a few headings, so we replace by deleting only that one
 *     code block and writing fresh.
 *   - "Last edited time" on the page is used as a guard: pull warns if
 *     Notion is newer than what the app last saw.
 * ====================================================================== */

const NotionSync = (function() {

  // Marker placed in the first 100 chars of the JSON code block so pull
  // can find it reliably no matter what else lives on the page.
  const JSON_MARKER = "EASYESSAY_STATE_V1";

  /* ====================================================================
   * Serialise an essay state object into a Notion-page payload.
   *
   * Returns { props, blocks }:
   *   props  — database-row properties for the Essay Library DB
   *   blocks — array of Notion blocks for the page body (headings +
   *            a single JSON code block at the bottom)
   * ================================================================= */
  function serialise(essay) {
    const s = essay.setup || {};
    const t = essay.thesis || {};
    const wordCount = (essay.draft || "").trim().split(/\s+/).filter(Boolean).length;

    // Database-row properties — what shows in Notion's gallery / table view.
    const props = {
      Name: { title: [{ type: "text", text: { content: (s.title || "Untitled essay").slice(0, 1900) } }] }
    };
    if (s.course)         props["Course"]         = { rich_text: [{ type: "text", text: { content: s.course.slice(0, 1900) } }] };
    if (s.citationStyle)  props["Citation style"] = { select: { name: s.citationStyle } };
    if (s.degreeLevel)    props["Academic level"] = { select: { name: degreeLabel(s.degreeLevel) } };
    if (wordCount)        props["Word count"]    = { number: wordCount };
    if (s.deadline)       props["Due date"]      = { date: { start: s.deadline } };
    if (essay.essayType && essay.essayType.chosen) {
      props["Essay type"] = { select: { name: essayTypeLabel(essay.essayType.chosen) } };
    }
    props["Status"] = { select: { name: deriveStatus(essay) } };

    // Page body — readable headings + a JSON code block at the bottom.
    const blocks = [];
    blocks.push(callout(
      `📝 Managed by Easy Essay. Edit the database properties on the left to update metadata. The JSON code block at the bottom is the canonical state — don't edit it directly.`
    ));
    blocks.push(...renderHumanSections(essay));
    blocks.push(...jsonCodeBlock(essay));
    return { props, blocks };
  }

  /* Returns "Idea" / "Drafting" / "Polishing" / "Submitted" derived from
   * how far along the essay is. */
  function deriveStatus(essay) {
    if (essay.exportedToNotionAt) return "Submitted";
    if ((essay.draft || "").trim().length > 200) {
      if ((essay.checklist || {}).proofread) return "Polishing";
      return "Drafting";
    }
    if ((essay.thesis || {}).combined) return "Outlining";
    if ((essay.questions || {}).chosen) return "Researching";
    return "Idea";
  }

  function degreeLabel(id) {
    const map = {
      foundation: "Foundation / Pre-University",
      undergraduate: "Undergraduate",
      postgraduate: "Postgraduate",
      doctoral: "Doctoral"
    };
    return map[id] || id;
  }

  function essayTypeLabel(id) {
    const map = {
      argumentative: "Argumentative",
      comparative: "Comparative",
      analytical: "Analytical",
      "problem-solution": "Problem-Solution",
      reflective: "Reflective",
      "literature-review": "Literature Review",
      "research-proposal": "Research Proposal"
    };
    return map[id] || id;
  }

  /* ====================================================================
   * Human-readable sections — one heading per step, with the box content
   * as Notion blocks underneath. Each section is short; the bulk of an
   * essay (the draft) is rendered as paragraph blocks.
   * ================================================================= */
  function renderHumanSections(essay) {
    const out = [];
    const s = essay.setup || {};
    const b = essay.brief || {};
    const t = essay.thesis || {};

    // Setup + Brief
    out.push(heading("1. Setup & Brief", 2));
    if (s.brief) out.push(paragraph(s.brief.slice(0, 2000)));
    if (s.initialIdea) {
      out.push(paragraph("Initial idea: " + s.initialIdea.slice(0, 1500)));
    }

    // Brief breakdown
    if (b.commandWords || b.audience || b.scope || b.constraints || b.successCriteria) {
      out.push(heading("2. Brief Breakdown", 2));
      if (b.commandWords)     out.push(bullet("Command words: " + b.commandWords.slice(0, 1900)));
      if (b.audience)         out.push(bullet("Audience: "     + b.audience.slice(0, 1900)));
      if (b.scope)            out.push(bullet("Scope: "        + b.scope.slice(0, 1900)));
      if (b.constraints)      out.push(bullet("Constraints: "  + b.constraints.slice(0, 1900)));
      if (b.successCriteria)  out.push(bullet("Success: "      + b.successCriteria.slice(0, 1900)));
    }

    // Research question
    const rq = currentRQ(essay);
    if (rq) {
      out.push(heading("4. Research Question", 2));
      out.push(paragraph(rq.slice(0, 1900)));
    }

    // Thesis
    if (t.combined || t.topic) {
      out.push(heading("7. Thesis", 2));
      if (t.combined) out.push(paragraph(t.combined.slice(0, 1900)));
      if (t.motive)   out.push(paragraph("Motive: " + t.motive.slice(0, 1900)));
    }

    // Sources
    if ((essay.sources || []).length) {
      out.push(heading("6. Sources (RADAR)", 2));
      for (const src of essay.sources.slice(0, 30)) {
        const meta = [src.authors, src.year, src.publication].filter(Boolean).join(", ");
        const line = `${src.title || "(untitled)"}${meta ? " — " + meta : ""} (RADAR ${src.radarScore || "?"}/5)`;
        out.push(bullet(line.slice(0, 1900)));
      }
    }

    // Outline
    if (essay.outline && essay.outline.text) {
      out.push(heading("8. Outline", 2));
      out.push(paragraph(essay.outline.text.slice(0, 1900)));
    }

    // Draft — split into paragraphs, up to ~80 blocks to stay within
    // the page-create batch limit for first push.
    if ((essay.draft || "").trim()) {
      out.push(heading("9. Draft", 2));
      const paras = essay.draft.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).slice(0, 80);
      for (const p of paras) {
        // Each paragraph capped at 2000 chars.
        const chunks = chunkString(p, 1900);
        for (const c of chunks) out.push(paragraph(c));
      }
    }

    // AI cost summary
    if (essay.aiCost && essay.aiCost.calls) {
      out.push(heading("AI cost summary", 2));
      out.push(paragraph(`Total: $${(essay.aiCost.total || 0).toFixed(4)} across ${essay.aiCost.calls} call${essay.aiCost.calls===1?"":"s"}.`));
    }

    out.push(heading("Canonical state (managed by Easy Essay)", 2));
    return out;
  }

  function currentRQ(essay) {
    if (!essay.questions) return "";
    if (typeof essay.questions.chosenIndex === "number") {
      const q = (essay.questions.generated || [])[essay.questions.chosenIndex];
      if (q && q.text) return q.text;
    }
    return essay.questions.custom || "";
  }

  function chunkString(s, n) {
    const out = [];
    for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n));
    return out;
  }

  /* ====================================================================
   * JSON code block — the canonical state, marker-prefixed for pull.
   * ================================================================= */
  function jsonCodeBlock(essay) {
    // Strip transient fields that shouldn't sync.
    const clean = JSON.parse(JSON.stringify(essay || {}));
    delete clean.notionSync; // sync metadata stays local
    const payload = JSON_MARKER + "\n" + JSON.stringify(clean, null, 0);
    const chunks = chunkString(payload, 1900);
    return [{
      object: "block",
      type: "code",
      code: {
        language: "json",
        rich_text: chunks.map(c => ({ type: "text", text: { content: c } }))
      }
    }];
  }

  /* Helpers for building Notion blocks ============================== */
  function heading(text, level) {
    const type = `heading_${level}`;
    return { object: "block", type, [type]: { rich_text: [{ type: "text", text: { content: text.slice(0, 1900) } }] } };
  }
  function paragraph(text) {
    return { object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: text.slice(0, 1900) } }] } };
  }
  function bullet(text) {
    return { object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ type: "text", text: { content: text.slice(0, 1900) } }] } };
  }
  function callout(text) {
    return { object: "block", type: "callout", callout: {
      icon: { type: "emoji", emoji: "📝" },
      rich_text: [{ type: "text", text: { content: text.slice(0, 1900) } }]
    }};
  }

  /* ====================================================================
   * PUSH — create or update the essay's Notion page.
   * ================================================================= */
  async function push({ token, essayLibraryDbId, essay, onProgress }) {
    if (!token) throw new Error("No Notion token.");
    if (!essayLibraryDbId) throw new Error("No Essay Library database — run 'Bootstrap workspace' in Settings first.");
    if (!essay) throw new Error("No essay.");
    const log = (m) => onProgress && onProgress(m);

    const { props, blocks } = serialise(essay);

    // CREATE path — no Notion page bound yet.
    if (!essay.notionPageId) {
      log("Creating page in Essay Library…");
      const first = blocks.slice(0, 100);
      const rest  = blocks.slice(100);
      const page = await Notion._req(token, "/pages", {
        method: "POST",
        body: JSON.stringify({
          parent: { type: "database_id", database_id: Notion._formatId(essayLibraryDbId) },
          properties: props,
          children: first
        })
      });
      essay.notionPageId = page.id;
      while (rest.length) {
        const chunk = rest.splice(0, 100);
        await Notion._req(token, `/blocks/${page.id}/children`, {
          method: "PATCH", body: JSON.stringify({ children: chunk })
        });
      }
      essay.notionSync = {
        pageId: page.id,
        lastPushAt: Date.now(),
        lastSeenEditedAt: page.last_edited_time || null,
        url: page.url || null
      };
      log("Created.");
      return essay.notionSync;
    }

    // UPDATE path — replace properties + body.
    const pageId = essay.notionPageId;

    // Conflict guard — refuse if Notion has been edited since our last push.
    const current = await Notion._req(token, `/pages/${pageId}`);
    const notionEditedAt = current.last_edited_time;
    const lastSeen = (essay.notionSync && essay.notionSync.lastSeenEditedAt) || null;
    if (lastSeen && notionEditedAt && notionEditedAt > lastSeen && !essay.notionSync._forcePush) {
      throw new Error(`Conflict: Notion has been edited since the last push (${notionEditedAt}). Pull first, or click 'Force Push' to override.`);
    }
    // (force-push flag is consumed)
    if (essay.notionSync) essay.notionSync._forcePush = false;

    // Update properties.
    log("Updating page properties…");
    await Notion._req(token, `/pages/${pageId}`, {
      method: "PATCH",
      body: JSON.stringify({ properties: props })
    });

    // Replace body: list current children, archive them, append fresh.
    // (Archiving is faster than deleting since we can use parallel calls.)
    log("Clearing existing body…");
    const existing = await Notion._req(token, `/blocks/${pageId}/children?page_size=100`);
    // Archive in parallel (up to 5 at a time to respect rate limits).
    const toArchive = (existing.results || []).map(b => b.id);
    for (let i = 0; i < toArchive.length; i += 5) {
      const batch = toArchive.slice(i, i + 5);
      await Promise.all(batch.map(id =>
        Notion._req(token, `/blocks/${id}`, {
          method: "DELETE"
        }).catch(() => null) // ignore individual failures
      ));
    }

    log("Writing fresh body…");
    const first = blocks.slice(0, 100);
    const rest  = blocks.slice(100);
    await Notion._req(token, `/blocks/${pageId}/children`, {
      method: "PATCH", body: JSON.stringify({ children: first })
    });
    while (rest.length) {
      const chunk = rest.splice(0, 100);
      await Notion._req(token, `/blocks/${pageId}/children`, {
        method: "PATCH", body: JSON.stringify({ children: chunk })
      });
    }

    // Re-read the page to capture the new last_edited_time.
    const fresh = await Notion._req(token, `/pages/${pageId}`);
    essay.notionSync = {
      pageId,
      lastPushAt: Date.now(),
      lastSeenEditedAt: fresh.last_edited_time || null,
      url: fresh.url || (essay.notionSync && essay.notionSync.url) || null
    };
    log("Pushed.");
    return essay.notionSync;
  }

  /* ====================================================================
   * PULL — fetch the JSON code block from a Notion page and parse it.
   * ================================================================= */
  async function pull({ token, pageId, onProgress }) {
    if (!token) throw new Error("No Notion token.");
    if (!pageId) throw new Error("No page id.");
    const log = (m) => onProgress && onProgress(m);
    log("Reading Notion page…");
    const page = await Notion._req(token, `/pages/${pageId}`);
    log("Reading page blocks…");
    let allBlocks = [];
    let cursor;
    do {
      const qs = cursor ? `?start_cursor=${encodeURIComponent(cursor)}&page_size=100` : "?page_size=100";
      const r = await Notion._req(token, `/blocks/${pageId}/children${qs}`);
      allBlocks = allBlocks.concat(r.results || []);
      cursor = r.has_more ? r.next_cursor : null;
    } while (cursor);

    // Find the code block that holds the JSON state.
    const codeBlock = allBlocks.find(b => {
      if (b.type !== "code") return false;
      const rt = b.code && b.code.rich_text;
      if (!Array.isArray(rt) || !rt.length) return false;
      const head = (rt[0].plain_text || rt[0].text?.content || "").slice(0, 30);
      return head.startsWith(JSON_MARKER);
    });
    if (!codeBlock) throw new Error("Couldn't find the Easy Essay state block on this page. The page may have been created outside the app.");

    const joined = codeBlock.code.rich_text.map(r => r.plain_text || r.text?.content || "").join("");
    const json = joined.slice(JSON_MARKER.length).trim();
    let essay;
    try { essay = JSON.parse(json); }
    catch (e) { throw new Error("State block is corrupt: " + e.message); }

    essay.notionPageId = pageId;
    essay.notionSync = {
      pageId,
      lastPullAt: Date.now(),
      lastSeenEditedAt: page.last_edited_time || null,
      url: page.url || null
    };
    log("Pulled.");
    return essay;
  }

  /* ====================================================================
   * LIST — pull a summary of all essays in the Essay Library DB so the
   * app can show "essays that exist in Notion but not in localStorage".
   * ================================================================= */
  async function listLibrary({ token, essayLibraryDbId }) {
    if (!token || !essayLibraryDbId) throw new Error("Missing token or database id.");
    const r = await Notion._req(token, `/databases/${Notion._formatId(essayLibraryDbId)}/query`, {
      method: "POST",
      body: JSON.stringify({
        page_size: 50,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }]
      })
    });
    return (r.results || []).map(p => ({
      pageId: p.id,
      title: extractTitle(p),
      url: p.url,
      lastEditedAt: p.last_edited_time,
      properties: p.properties
    }));
  }

  function extractTitle(page) {
    const props = page.properties || {};
    for (const k of Object.keys(props)) {
      const v = props[k];
      if (v && v.type === "title" && Array.isArray(v.title)) {
        return v.title.map(t => t.plain_text || "").join("").trim() || "(untitled)";
      }
    }
    return "(untitled)";
  }

  return { push, pull, listLibrary, serialise };
})();

window.NotionSync = NotionSync;
