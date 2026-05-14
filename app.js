/* ========================================================================
 * EASY ESSAY — main app logic (v2 — kimi-inspired flow)
 *
 * Flow: Setup → Brief Breakdown → Rubric → Research Questions →
 *       Essay Type → Sources (RADAR) → Thesis → Outline →
 *       Drafting (PEEL) → Polishing → Final & Export
 *
 * Security note: every dynamic HTML insertion escapes user-controlled
 * values through escapeHtml(). Static template content is author-controlled.
 * ====================================================================== */

const STORAGE = {
  settings: "easy-essay/settings/v1",
  essays:   "easy-essay/essays/v2",
  active:   "easy-essay/active-essay/v1"
};

const state = {
  settings: {
    // PHASE 4.1 — default to Gemini 2.0 Flash. Free tier covers most students;
    // paid pennies-per-essay. Switch to Anthropic/OpenAI for premium critique.
    provider: "gemini",
    // PHASE 4.2 — Per-tier model picks. Routine = cheapest competent; Premium
    // = stronger model for thesis stress-test, fallacy scan, counter-arg.
    model: {
      anthropic: "claude-haiku-4-5",
      openai:    "gpt-4o-mini",
      gemini:    "gemini-2.0-flash",
      deepseek:  "deepseek-chat",
      kimi:      "moonshot-v1-8k"
    },
    premiumModel: {
      anthropic: "claude-sonnet-4-5",
      openai:    "gpt-4o",
      gemini:    "gemini-1.5-pro",
      deepseek:  "deepseek-reasoner",
      kimi:      "moonshot-v1-32k"
    },
    keys:  { anthropic: "", openai: "", gemini: "", deepseek: "", kimi: "", custom: "" },
    // Custom (BYO OpenAI-compatible) provider config — used only when
    // provider === "custom". Lets students plug in OpenRouter, Ollama,
    // Zhipu (GLM), Yi, Qwen, any self-hosted vLLM, etc.
    custom: { baseUrl: "", model: "" },
    // Override for Moonshot (Kimi) — students with an api.moonshot.ai key
    // (international) can paste it here instead of using the .cn default.
    kimiBaseUrl: "",
    notion: { token: "", parent: "", proxyUrl: "" },
    // PHASE 4 — Cost-saving toggles
    routing:        true,   // tier-based model routing
    promptCaching:  true,   // Anthropic ephemeral cache on system prompt
    trimHistory:    true,   // send last N turns + summary
    historyKeep:    6,
    // PHASE 3 — Integrity detection (BYO API)
    detection: { provider: "", key: "" }
  },
  essays: [],
  current: null,
  currentStep: 0,
  coachMessages: []
};

/* ============== STORAGE ============== */
function loadAll() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE.settings) || "null");
    if (s) state.settings = {
      ...state.settings, ...s,
      model: { ...state.settings.model, ...(s.model||{}) },
      keys:  { ...state.settings.keys,  ...(s.keys||{}) },
      notion:{ ...state.settings.notion,...(s.notion||{}) }
    };
  } catch {}
  try {
    const e = JSON.parse(localStorage.getItem(STORAGE.essays) || "[]");
    if (Array.isArray(e)) state.essays = e;
  } catch {}
  try {
    const a = localStorage.getItem(STORAGE.active);
    if (a) state.current = state.essays.find(x => x.id === a) || null;
  } catch {}
  // Publish the Notion proxy URL once at startup so notion.js can call it.
  window.NOTION_PROXY_URL    = (state.settings.notion && state.settings.notion.proxyUrl) || "";
  window.AI_CUSTOM_BASE_URL  = (state.settings.custom && state.settings.custom.baseUrl) || "";
  window.AI_CUSTOM_MODEL     = (state.settings.custom && state.settings.custom.model)   || "";
  window.AI_KIMI_BASE_URL    = state.settings.kimiBaseUrl || "";
}
function saveSettings() {
  localStorage.setItem(STORAGE.settings, JSON.stringify(state.settings));
  // Republish the Notion proxy URL so notion.js picks up changes without reload.
  window.NOTION_PROXY_URL = (state.settings.notion && state.settings.notion.proxyUrl) || "";
  // Republish AI custom-provider settings + Kimi base override.
  window.AI_CUSTOM_BASE_URL = (state.settings.custom && state.settings.custom.baseUrl) || "";
  window.AI_CUSTOM_MODEL    = (state.settings.custom && state.settings.custom.model)   || "";
  window.AI_KIMI_BASE_URL   = state.settings.kimiBaseUrl || "";
}
function saveEssays()   { localStorage.setItem(STORAGE.essays, JSON.stringify(state.essays)); }
function setActive(id)  { localStorage.setItem(STORAGE.active, id || ""); }

/* ============== HELPERS ============== */
function $(sel, root)  { return (root || document).querySelector(sel); }
function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
function uid() { return "es_" + Math.random().toString(36).slice(2, 10); }
function fmtDate(ts) { return new Date(ts).toLocaleString(undefined, {month:"short", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit"}); }
function escapeHtml(s) {
  return (s == null ? "" : String(s)).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
}
function setHTML(el, html) { if (el) el.innerHTML = html; }
function toast(msg, ms) {
  ms = ms || 2200;
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), ms);
}

/* Modal scroll-lock helpers — refcount-style so multiple modals stack
 * (e.g. a chapter modal opening a lightbox) without race conditions. */
let _modalOpenCount = 0;
/* Native Fullscreen API helper. Used for the click-to-enlarge behaviour on
 * infographics — far simpler and more reliable than rebuilding a custom
 * lightbox. Falls back to opening the image in a new tab if the API isn't
 * available or the user rejects the permission prompt. */
function enterFullscreen(el, fallbackUrl) {
  if (!el) return;
  const req = el.requestFullscreen
           || el.webkitRequestFullscreen
           || el.mozRequestFullScreen
           || el.msRequestFullscreen;
  if (req) {
    Promise.resolve(req.call(el)).catch(() => {
      if (fallbackUrl) window.open(fallbackUrl, "_blank", "noopener");
    });
  } else if (fallbackUrl) {
    window.open(fallbackUrl, "_blank", "noopener");
  }
}

function openModalEl(id) {
  const el = document.getElementById(id);
  if (!el || el.classList.contains("show")) return;
  el.classList.add("show");
  _modalOpenCount++;
  document.body.classList.add("modal-open");
}
function closeModalEl(id) {
  const el = document.getElementById(id);
  if (!el || !el.classList.contains("show")) return;
  el.classList.remove("show");
  _modalOpenCount = Math.max(0, _modalOpenCount - 1);
  if (_modalOpenCount === 0) document.body.classList.remove("modal-open");
}

function logIntegrity(action, detail) {
  const e = state.current; if (!e) return;
  e.integrity = e.integrity || [];
  e.integrity.push({ ts: Date.now(), action, detail: detail || "" });
  saveEssays();
}

/* PHASE 4.6 — Per-call cost telemetry.
 * Sums usage and cost into state.current.aiCost, and records a per-task
 * line item in state.current.aiLedger for the Final-step report. */
function recordAIUsage({ task, model, usage, cost }) {
  const e = state.current; if (!e) return;
  e.aiCost   = e.aiCost   || { total: 0, byTask: {}, byModel: {}, calls: 0 };
  e.aiLedger = e.aiLedger || [];
  e.aiCost.total += cost || 0;
  e.aiCost.calls += 1;
  e.aiCost.byTask[task]   = (e.aiCost.byTask[task]   || 0) + (cost || 0);
  e.aiCost.byModel[model] = (e.aiCost.byModel[model] || 0) + (cost || 0);
  e.aiLedger.push({
    ts: Date.now(),
    task, model,
    inTokens:  usage?.input_tokens  || 0,
    outTokens: usage?.output_tokens || 0,
    cacheRead: usage?.cache_read    || 0,
    cacheWrite:usage?.cache_write   || 0,
    cost: cost || 0
  });
  // Keep the ledger bounded.
  if (e.aiLedger.length > 200) e.aiLedger = e.aiLedger.slice(-200);
  saveEssays();
}

/* Resolve which model to use for a given task, honouring the user's
 * routing/override settings. Returns the model id. */
function pickModel(task, providerOverride) {
  const s = state.settings;
  const provider = providerOverride || s.provider;
  if (!s.routing) return s.model[provider]; // routing disabled — single model
  const tier = (window.TASK_ROUTING || {})[task] || "ROUTINE";
  if (tier === "PREMIUM") return s.premiumModel[provider] || s.model[provider];
  return s.model[provider];
}

/* ============== NAVIGATION ============== */
function switchView(name) {
  $$(".view").forEach(v => v.classList.remove("active"));
  const target = $("#view-" + name); if (target) target.classList.add("active");
  $$(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  if (name === "library")    renderLibrary();
  if (name === "curriculum") renderCurriculum();
  if (name === "examples")   renderExamples();
  if (name === "settings")   renderSettings();
  if (name === "home")       renderHome();
}

/* ============== HOME ============== */
const ICONS = {
  target:  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  book:    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  flame:   '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  check:   '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>',
  trending:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
  sparkles:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>'
};

/* ============== MANDATORY SETUP WIZARD MODAL ============== */
/* Shown on first visit. Forced — backdrop click / Esc cannot dismiss it.
 * User finishes by clicking either "Continue to the app →" (after at least
 * one step is addressed) or "Skip everything for now" (explicit acknowledge).
 * Setting state.settings.setupComplete = true ensures it never auto-shows
 * again. Re-openable from Settings. */

function setText(el, txt) { if (el) el.textContent = txt; }

function maybeShowSetupWizard() {
  // Auto-show only once, on the very first visit.
  if (state.settings.setupComplete) return;
  showSetupWizard();
}

function showSetupWizard() {
  const m = $("#setupModal");
  if (!m) return;
  renderSetupWizard();
  m.classList.add("show");
  document.body.classList.add("modal-open");

  // Wix embeds this app in an auto-grown iframe; scroll the iframe document
  // to its top so the modal-card is visible above the fold.
  try { window.scrollTo({ top: 0, behavior: "instant" }); } catch { window.scrollTo(0, 0); }

  // Ask the parent window (Wix) to scroll to where the iframe starts.
  // Wix sometimes listens for postMessage; the user can also wire a custom
  // listener in Wix Velo if they want a guaranteed scroll. Failing that,
  // the most-visible-top positioning above keeps the modal in view inside
  // the iframe regardless.
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "easy-essay:scroll-to-iframe" }, "*");
    }
  } catch (_) { /* cross-origin is fine */ }

  // Focus the modal-card so screen readers + keyboard users land inside it.
  const card = $("#setupModal .modal-card");
  if (card) { card.setAttribute("tabindex", "-1"); card.focus({ preventScroll: true }); }
}

function closeSetupWizard() {
  const m = $("#setupModal");
  if (!m) return;
  m.classList.remove("show");
  document.body.classList.remove("modal-open");
}

function renderSetupWizard() {
  const s = state.settings;
  s.setupSteps = s.setupSteps || {};
  const aiDone     = !!s.setupSteps.ai;
  const aiSkipped  = !!s.setupSteps.aiSkipped;
  const notionDone = !!s.setupSteps.notion;
  const notionSkip = !!s.setupSteps.notionSkipped;

  // Per-step badges.
  const aiBadge = $('[data-status="ai"]');
  const notionBadge = $('[data-status="notion"]');
  if (aiBadge) {
    if (aiDone)        { aiBadge.textContent = "✓ Connected"; aiBadge.className = "setup-status done"; }
    else if (aiSkipped){ aiBadge.textContent = "Skipped";     aiBadge.className = "setup-status skipped"; }
    else               { aiBadge.textContent = "Not connected"; aiBadge.className = "setup-status todo"; }
  }
  if (notionBadge) {
    if (notionDone)    { notionBadge.textContent = "✓ Connected"; notionBadge.className = "setup-status done"; }
    else if (notionSkip){notionBadge.textContent = "Skipped";     notionBadge.className = "setup-status skipped"; }
    else               { notionBadge.textContent = "Not connected"; notionBadge.className = "setup-status todo"; }
  }

  // Progress line — "1 of 2 steps addressed".
  const addressed = (aiDone || aiSkipped ? 1 : 0) + (notionDone || notionSkip ? 1 : 0);
  setText($("#setupProgress"), `${addressed} of 2 steps addressed — ${addressed === 2 ? "ready to continue." : "complete both to continue, or skip everything."}`);

  // "Continue to the app" button is enabled when both steps have been
  // addressed (saved OR explicitly skipped). "Skip everything" is always
  // available below it as a hard escape.
  const cont = $("#setupContinue");
  if (cont) {
    const ready = addressed === 2;
    cont.disabled = !ready;
    cont.title = ready ? "" : "Address both steps first (save or skip each one).";
  }
}

function wireSetupWizard() {
  const m = $("#setupModal");
  if (!m) return;

  // Block Esc from closing it.
  m.addEventListener("keydown", ev => { if (ev.key === "Escape") ev.preventDefault(); });

  // Set-up / Close toggle on each step (delegation — bulletproof against
  // cache races and stale handlers).
  m.addEventListener("click", (ev) => {
    const toggle = ev.target.closest(".setup-toggle");
    if (!toggle || !m.contains(toggle)) return;
    const which = toggle.dataset.toggle;
    const body  = m.querySelector(`[data-body="${which}"]`);
    if (!body) return;
    const expanding = body.hidden;
    body.hidden = !expanding;
    toggle.textContent = expanding ? "Close ✕" : "Set up →";
  });

  // Step 1 — AI provider
  const aiProvSel = $("#setup-ai-provider");
  const aiKeyInp  = $("#setup-ai-key");
  const aiGetKey  = $("#setup-ai-getkey");
  function syncAIFields() {
    const p = aiProvSel.value;
    const urls = {
      gemini:    { url: "https://aistudio.google.com/app/apikey",            label: "Get a free Gemini key →" },
      deepseek:  { url: "https://platform.deepseek.com/api_keys",            label: "Get a DeepSeek key →" },
      kimi:      { url: "https://platform.moonshot.cn/console/api-keys",     label: "Get a Moonshot/Kimi key →" },
      anthropic: { url: "https://console.anthropic.com/",                    label: "Get an Anthropic key →" },
      openai:    { url: "https://platform.openai.com/api-keys",              label: "Get an OpenAI key →" },
      custom:    { url: "#",                                                 label: "Configure in Settings → AI Provider → Custom" }
    };
    const u = urls[p] || urls.gemini;
    if (aiGetKey) { aiGetKey.href = u.url; aiGetKey.textContent = u.label; }
    if (aiKeyInp) {
      aiKeyInp.value = state.settings.keys[p] || "";
      // Custom provider's auth also goes in this same field for the wizard's
      // simplicity; the wizard's Save persists it to keys.custom, and
      // Settings has the dedicated row.
      aiKeyInp.placeholder = (p === "custom") ? "(your provider's bearer token)" : "(API key)";
    }
    // Surface custom-provider's required fields when chosen — helper text.
    const helpEl = $("#setup-ai-help");
    if (helpEl && p === "custom") {
      helpEl.innerHTML = "Custom (OpenAI-compatible) requires <b>Base URL</b> + <b>Model name</b> in Settings → AI Provider → Custom. Set them there first, then paste the bearer token above and click Save.";
    } else if (helpEl) {
      // Restore default help (Get-a-free-key link + privacy note).
      helpEl.innerHTML = `<a id="setup-ai-getkey" href="${escapeHtml(u.url)}" target="_blank" rel="noopener">${escapeHtml(u.label)}</a> &nbsp;·&nbsp; Keys are stored in <b>your browser only</b> — never sent anywhere except the provider's own endpoint.`;
    }
  }
  if (aiProvSel) {
    aiProvSel.value = state.settings.provider || "gemini";
    syncAIFields();
    aiProvSel.addEventListener("change", syncAIFields);
  }

  $("#setup-ai-save")?.addEventListener("click", async () => {
    const result = $("#setup-ai-result");
    const provider = aiProvSel.value;
    const key      = (aiKeyInp.value || "").trim();
    if (!key) { result.className = "status-line err"; result.textContent = "Paste your API key first."; return; }
    result.className = "status-line"; result.textContent = "Testing connection…";
    state.settings.provider = provider;
    state.settings.keys[provider] = key;
    saveSettings();
    try {
      const out = await AI.test({ provider, model: pickModel("BRIEF_PARSE"), apiKey: key });
      result.className = "status-line ok";
      result.textContent = `✓ ${provider} connected. Reply: "${(out || "").slice(0, 60)}"`;
      state.settings.setupSteps = state.settings.setupSteps || {};
      state.settings.setupSteps.ai = true;
      state.settings.setupSteps.aiSkipped = false;
      saveSettings();
      renderSetupWizard();
    } catch (err) {
      result.className = "status-line err";
      result.textContent = "Test failed: " + err.message;
    }
  });

  $("#setup-ai-skip")?.addEventListener("click", (ev) => {
    ev.preventDefault();
    if (!confirm("Skip the AI setup?\n\nWithout an AI key, the coach, research-question generator, fallacy scan, and counter-argument generator will not work. You can still write essays using the local checks and templates, but you'll lose most of the AI-assisted features.\n\nYou can come back and add a key any time.")) return;
    state.settings.setupSteps = state.settings.setupSteps || {};
    state.settings.setupSteps.ai = false;
    state.settings.setupSteps.aiSkipped = true;
    saveSettings();
    renderSetupWizard();
  });

  // Step 2 — Notion
  const notionTok = $("#setup-notion-token");
  const notionPar = $("#setup-notion-parent");
  const parsedLine= $("#setup-notion-parent-parsed");
  if (notionTok) notionTok.value = state.settings.notion?.token || "";
  if (notionPar) notionPar.value = state.settings.notion?.parent || "";

  // The Notion proxy is built into this deployment (Netlify Function at
  // /api/notion). notion.js auto-detects it via a same-origin probe — no UI,
  // no setup, nothing for students to configure.
  function saveProxyFromSetup() { /* no-op: built-in proxy, nothing to save */ }

  // Live-parse the page URL/ID as the user types so they get instant
  // confirmation that the input is well-formed.
  function updateParsedHint() {
    if (!notionPar || !parsedLine) return;
    const raw = (notionPar.value || "").trim();
    if (!raw) { parsedLine.textContent = ""; parsedLine.className = "muted small"; return; }
    const id = Notion.parsePageId(raw);
    if (id) {
      parsedLine.textContent = `Page ID: ${id}`;
      parsedLine.className = "status-line ok small";
    } else {
      parsedLine.textContent = "Couldn't find a 32-char page ID in that input. Paste the full Notion URL or just the ID.";
      parsedLine.className = "status-line err small";
    }
  }
  notionPar?.addEventListener("input", updateParsedHint);
  notionPar?.addEventListener("paste", () => setTimeout(updateParsedHint, 50));
  updateParsedHint(); // initial

  function setNotionResult(cls, text) {
    const r = $("#setup-notion-result");
    if (!r) return;
    r.className = "status-line " + cls;
    r.textContent = text;
  }

  $("#setup-notion-test")?.addEventListener("click", async () => {
    const token  = (notionTok.value || "").trim();
    if (!token) { setNotionResult("err", "Paste your Notion token first."); return; }
    setNotionResult("", "Testing Notion token…");
    try {
      const me = await Notion.test(token);
      const name = me.name || (me.bot && me.bot.owner && me.bot.owner.user && me.bot.owner.user.name) || "integration";
      setNotionResult("ok", `✓ Token works. Connected as ${name}. Now paste your page URL and click "Verify page access".`);
      state.settings.notion = state.settings.notion || {};
      state.settings.notion.token = token;
      saveSettings();
    } catch (err) {
      setNotionResult("err", "Token test failed: " + err.message + " — re-check the secret at notion.so/profile/integrations.");
    }
  });

  // NEW: explicit page-access verification, before bootstrap. Catches the
  // most common failure mode (integration not shared with the page).
  $("#setup-notion-verify-page")?.addEventListener("click", async () => {
    const token  = (notionTok.value || "").trim();
    const raw    = (notionPar.value || "").trim();
    if (!token) { setNotionResult("err", "Paste your Notion token first."); return; }
    if (!raw)   { setNotionResult("err", "Paste your Notion page URL (or ID) first."); return; }
    const id = Notion.parsePageId(raw);
    if (!id)    { setNotionResult("err", "Couldn't find a 32-character page ID in that input. Paste the full Notion URL or the ID."); return; }
    setNotionResult("", `Checking page ${id}…`);
    try {
      // GET /pages/{id} — fails 404 if integration can't see the page.
      const page = await Notion._req(token, `/pages/${id}`);
      const title = (function() {
        const props = page.properties || {};
        for (const k of Object.keys(props)) {
          const v = props[k];
          if (v && v.type === "title" && Array.isArray(v.title)) {
            return v.title.map(t => t.plain_text || "").join("").trim() || "(untitled)";
          }
        }
        return "(untitled)";
      })();
      setNotionResult("ok", `✓ Page found: "${title}". Now click "Create the 4 databases".`);
      state.settings.notion.parent = raw; // preserve user's input
      saveSettings();
      $("#setup-notion-bootstrap").disabled = false;
    } catch (err) {
      let hint = "";
      if (/404/.test(err.message)) {
        hint = ` — most likely cause: the integration isn't shared with this page. In Notion, open the page → click <b>…</b> top-right → <b>Connections</b> → add your integration. Then re-click "Verify page access".`;
      } else if (/401/.test(err.message)) {
        hint = ` — token is invalid or revoked. Re-check it.`;
      }
      $("#setup-notion-result").innerHTML = `<span class="status-line err">Page-access check failed: ${escapeHtml(err.message)}${hint}</span>`;
    }
  });

  $("#setup-notion-bootstrap")?.addEventListener("click", async () => {
    const log    = $("#setup-notion-log");
    const token  = (notionTok.value || "").trim();
    const raw    = (notionPar.value || "").trim();
    if (!token) { setNotionResult("err", "Token missing."); return; }
    if (!raw)   { setNotionResult("err", "Page URL / ID missing."); return; }
    const id = Notion.parsePageId(raw);
    if (!id)    { setNotionResult("err", "Couldn't extract a 32-char page ID from that input. Paste the full Notion URL or the raw ID."); return; }

    log.innerHTML = "";
    setNotionResult("", "Creating 4 databases under your page…");
    state.settings.notion = state.settings.notion || {};
    state.settings.notion.token  = token;
    state.settings.notion.parent = raw;  // keep the user's input
    saveSettings();
    try {
      const r = await Notion.bootstrapWorkspace(token, id, ({ msg, ok }) => {
        const line = document.createElement("div");
        line.className = "bootstrap-line " + (ok ? "ok" : "err");
        line.textContent = msg;
        log.appendChild(line);
        log.scrollTop = log.scrollHeight;
      });
      state.settings.notion.workspace = { builtAt: Date.now(), databases: r.databases, pages: r.pages };
      saveSettings();
      const errs = r.errors.length;
      if (!errs) {
        setNotionResult("ok", "✓ Notion workspace ready — all 4 databases created.");
        state.settings.setupSteps = state.settings.setupSteps || {};
        state.settings.setupSteps.notion = true;
        state.settings.setupSteps.notionSkipped = false;
        saveSettings();
        renderSetupWizard();
      } else {
        setNotionResult("err", `${errs} step${errs===1?"":"s"} failed — see log above. Most common cause: the integration is not shared with the page yet. Click "Verify page access" first.`);
      }
    } catch (err) {
      setNotionResult("err", "Bootstrap failed: " + err.message);
    }
  });

  $("#setup-notion-skip")?.addEventListener("click", (ev) => {
    ev.preventDefault();
    if (!confirm("Skip Notion setup?\n\nWithout Notion, your essays will only live in this browser. If you clear the browser, switch devices, or use incognito, your essays will be lost. You can come back and set this up anytime from Settings.")) return;
    state.settings.setupSteps = state.settings.setupSteps || {};
    state.settings.setupSteps.notion = false;
    state.settings.setupSteps.notionSkipped = true;
    saveSettings();
    renderSetupWizard();
  });

  // Continue → marks setupComplete and closes modal
  $("#setupContinue")?.addEventListener("click", () => {
    state.settings.setupComplete = true;
    saveSettings();
    closeSetupWizard();
    renderHome();
    toast("Setup complete — welcome to Easy Essay.");
  });

  // Skip everything → also marks setupComplete, but flags both as skipped
  function skipEverything() {
    state.settings.setupSteps = state.settings.setupSteps || {};
    if (!state.settings.setupSteps.ai) state.settings.setupSteps.aiSkipped = true;
    if (!state.settings.setupSteps.notion) state.settings.setupSteps.notionSkipped = true;
    state.settings.setupComplete = true;
    saveSettings();
    closeSetupWizard();
    renderHome();
  }

  $("#setupSkipAll")?.addEventListener("click", () => {
    if (!confirm("Skip the whole setup?\n\nWith no AI key and no Notion, the app's most powerful features won't work. You can still browse the curriculum, read example essays, and use the local linters and templates.\n\nYou can come back and complete this from Settings → Re-open setup wizard.")) return;
    skipEverything();
  });

  // Close-X in the corner — same as skip-everything but with a single click.
  // Acts as a safety valve so the modal is never trapping the user.
  $("#setupCloseX")?.addEventListener("click", skipEverything);
}

// (Duplicate wireSetupWizard removed — was targeting the old #heroSetup
//  element from the inline-wizard design that has since been replaced
//  with the #setupModal popup. The function at line ~270 is the live one.)

function renderHome() {
  // dashboard stat cards
  const essays   = state.essays;
  const drafting = essays.filter(e => (e.step||0) >= 8).length;
  const totalSteps = essays.length * METHODOLOGY.steps.length;
  const completedSteps = essays.reduce((s,e)=>s+(e.step||0),0);
  const avgProgress = essays.length ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const totalWords = essays.reduce((s,e)=>s + ((e.draft||"").trim().split(/\s+/).filter(Boolean).length),0);

  const stats = [
    { color:"violet",  title:"Essays in flight",  value: essays.length,        sub:"saved in your browser",     icon: ICONS.target },
    { color:"blue",    title:"Currently drafting",value: drafting,              sub:"in steps 9–11",             icon: ICONS.check },
    { color:"orange",  title:"Avg. progress",     value: avgProgress + "%",     sub:"across all essays",         icon: ICONS.trending },
    { color:"pink",    title:"Words written",     value: totalWords.toLocaleString(), sub:"across all drafts",   icon: ICONS.flame }
  ];
  const statHtml = stats.map(s => `
    <div class="stat-card ${escapeHtml(s.color)}">
      <div class="stat-bg"></div>
      <div class="stat-icon">${s.icon}</div>
      <div class="stat-title">${escapeHtml(s.title)}</div>
      <div class="stat-value">${escapeHtml(s.value)}</div>
      <div class="stat-sub">${escapeHtml(s.sub)}</div>
    </div>
  `).join("");
  setHTML($("#statGrid"), statHtml);

  // Replaced the 11 process-cards with a single NotebookLM infographic.
  // The img is clickable and opens in the lightbox at full resolution.
  setHTML($("#processGrid"), `
    <img src="assets/infographics/guided-process.jpg"
         alt="The Guided Essay-Writing Process — 11 Steps from Brief to Submission"
         class="hero-infographic" id="homeProcessImg"/>
  `);
  // Click-to-enlarge → native browser fullscreen (Esc / pinch to exit).
  $("#homeProcessImg")?.addEventListener("click", () => {
    enterFullscreen($("#homeProcessImg"), "assets/infographics/guided-process.jpg");
  });

  // essay-type preview grid (not selectable directly; recommended later)
  const grid = $("#essayGrid");
  const html = METHODOLOGY.essayTypes.map(t => `
    <div class="essay-card preview">
      <span class="badge">${escapeHtml(t.badge)}</span>
      <h4>${escapeHtml(t.title)}</h4>
      <p>${escapeHtml(t.summary)}</p>
      <div class="chap">Chapter ${escapeHtml(t.chapter)}</div>
    </div>
  `).join("");
  setHTML(grid, html);

  // status link to last essay
  const status = $("#heroStatus");
  if (state.essays.length) {
    const last = state.essays.slice().sort((a,b)=>b.updatedAt-a.updatedAt)[0];
    setHTML(status, `Last draft: <a href="#" id="resumeLink">${escapeHtml(last.setup?.title || last.title || "Untitled")}</a> — ${escapeHtml(fmtDate(last.updatedAt))}`);
    $("#resumeLink").addEventListener("click", ev => { ev.preventDefault(); openEssay(last.id); });
  } else {
    status.textContent = "No essays yet — click 'Start a New Essay' above.";
  }
}

/* ============== START / OPEN ESSAY ============== */
function startNewEssay() {
  const essay = {
    id: uid(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    step: 0,

    setup: { title:"", course:"", degreeLevel:"undergraduate", wordCount:1500, deadline:"", citationStyle:"APA 7th", brief:"", initialIdea:"" },
    brief: { commandWords:"", audience:"", scope:"", constraints:"", successCriteria:"", notes:"" },
    rubric: { templateId:"", paste:"", criteria:[] },
    questions: { generated:[], selected:-1, customQuestion:"" },
    essayType: { recommended:"", chosen:"", reasoning:"" },
    sources: [],
    thesis: { topic:"", position:"", rationale:"", combined:"", supportingClaims:"", counterargument:"" },
    outline: { allocation:{ intro:10, body1:25, body2:25, body3:25, counter:10, conclusion:5 }, text:"" },
    paragraphs: [],
    draft: "", notes: "", checklist: {},
    integrity: [], coach: []
  };
  state.essays.push(essay);
  state.current = essay;
  state.currentStep = 0;
  setActive(essay.id);
  saveEssays();
  switchView("essay");
  renderWorkspace();
  // PHASE 5.3 — auto-bind: if the Notion workspace is bootstrapped, create
  // a Notion page for this essay immediately so all subsequent saves can
  // round-trip without a manual first push. Soft-fails on any error so the
  // user can still work offline.
  maybeAutoBindToNotion(essay);
  renderSyncStatus();
}

async function maybeAutoBindToNotion(essay) {
  const s = state.settings;
  const dbId = s.notion?.workspace?.databases?.essays;
  if (!s.notion?.token || !dbId) return;
  try {
    await NotionSync.push({
      token: s.notion.token,
      essayLibraryDbId: dbId,
      essay,
      onProgress: () => {}
    });
    saveEssays();
    renderSyncStatus();
    toast("Notion page created for this essay.");
  } catch (err) {
    // Soft fail; user can manually Push later.
    console.warn("Auto-bind to Notion failed:", err.message);
  }
}

function openEssay(id) {
  const e = state.essays.find(x => x.id === id);
  if (!e) return;
  ensureEssayShape(e);
  state.current = e;
  state.currentStep = Math.min(e.step || 0, METHODOLOGY.steps.length - 1);
  setActive(e.id);
  switchView("essay");
  renderWorkspace();
  renderSyncStatus();
}

/* Update the side-rail sync indicator + button states based on the current
 * essay's notionSync metadata. Called on essay open, after each push/pull,
 * and after settings changes. */
function renderSyncStatus() {
  const dot   = $("#syncDot");
  const label = $("#syncLabel");
  const detail= $("#syncDetail");
  const open  = $("#syncOpenBtn");
  const push  = $("#syncPushBtn");
  const pull  = $("#syncPullBtn");
  if (!dot || !label) return;

  const e = state.current;
  const s = state.settings;
  const hasToken = !!(s.notion && s.notion.token);
  const hasDb    = !!(s.notion && s.notion.workspace && s.notion.workspace.databases && s.notion.workspace.databases.essays);

  if (!hasToken) {
    dot.className = "sync-dot sync-off";
    label.textContent = "Notion not connected";
    detail.textContent = "Add a Notion token in Settings to enable sync.";
    push.disabled = true; pull.disabled = true; open.disabled = true;
    return;
  }
  if (!hasDb) {
    dot.className = "sync-dot sync-off";
    label.textContent = "Workspace not bootstrapped";
    detail.textContent = "Click 'Bootstrap workspace' in Settings to create the Essay Library DB.";
    push.disabled = true; pull.disabled = true; open.disabled = true;
    return;
  }

  push.disabled = false;
  if (!e || !e.notionSync || !e.notionSync.pageId) {
    dot.className = "sync-dot sync-pending";
    label.textContent = "Not yet pushed";
    detail.textContent = "Push to create the Notion page for this essay.";
    pull.disabled = true; open.disabled = true;
    return;
  }

  pull.disabled = false;
  open.disabled = !e.notionSync.url;
  const t = e.notionSync.lastPushAt || e.notionSync.lastPullAt;
  dot.className = "sync-dot sync-ok";
  label.textContent = "Synced";
  detail.textContent = t ? `Last ${e.notionSync.lastPushAt ? "pushed" : "pulled"}: ${fmtDate(t)}.` : "Linked to Notion.";
}

// Older essays from v1 may lack new fields; backfill defaults safely.
function ensureEssayShape(e) {
  e.setup = e.setup || { title:e.title||"", course:"", degreeLevel:"undergraduate", wordCount:1500, deadline:"", citationStyle:"APA 7th", brief:e.prompt||"", initialIdea:e.brainstorm||"" };
  e.brief = e.brief || { commandWords:"", audience:"", scope:"", constraints:"", successCriteria:"", notes:"" };
  e.rubric = e.rubric || { templateId:"", paste:"", criteria:[] };
  e.questions = e.questions || { generated:[], selected:-1, customQuestion:"" };
  e.essayType = e.essayType || { recommended:e.essayTypeId||"", chosen:e.essayTypeId||"", reasoning:"" };
  e.sources = e.sources || [];
  e.thesis = e.thesis || { topic:"", position:"", rationale:"", combined:"", supportingClaims:"", counterargument:"" };
  if (!e.thesis.supportingClaims) e.thesis.supportingClaims = "";
  if (!e.thesis.counterargument)  e.thesis.counterargument  = "";
  e.outline = (typeof e.outline === "object" && e.outline !== null && !Array.isArray(e.outline) && "allocation" in e.outline)
    ? e.outline
    : { allocation:{ intro:10, body1:25, body2:25, body3:25, counter:10, conclusion:5 }, text: typeof e.outline === "string" ? e.outline : "" };
  e.paragraphs = e.paragraphs || [];
  e.integrity = e.integrity || [];
  e.coach = e.coach || [];
}

/* ============== WORKSPACE ============== */
function renderWorkspace() {
  const e = state.current;
  if (!e) { switchView("home"); return; }

  // sidebar essay metadata
  const typeLabel = e.essayType.chosen
    ? (METHODOLOGY.essayTypes.find(x=>x.id===e.essayType.chosen)?.title || "Essay")
    : "Essay (type TBD)";
  $("#ws-essay-type").textContent = typeLabel;
  $("#ws-essay-title").value = e.setup.title || "";

  $$("#stepnav .step-link").forEach((el, i) => {
    el.classList.toggle("active", i === state.currentStep);
    el.classList.toggle("done", i < state.currentStep);
  });
  renderStep();
}

function renderStep() {
  const renderers = [
    renderSetup, renderBriefBreakdown, renderRubric, renderResearchQuestions,
    renderEssayType, renderSources, renderThesis, renderOutline,
    renderWriting, renderPolishing, renderFinal
  ];
  setHTML($("#stage"), renderers[state.currentStep]());
  wireStage();
}

function header(stepIdx) {
  const s = METHODOLOGY.steps[stepIdx];
  return `
    <div class="stage-inner">
      <span class="step-tag">${escapeHtml(s.tag)}</span>
      <h2>${escapeHtml(s.title)}</h2>
      <p class="step-sub">${escapeHtml(s.summary)} <span class="muted">· Curriculum: ${escapeHtml(s.chapters.map(c=>"Ch."+c).join(", "))}</span></p>
  `;
}
function footer(prevLabel, nextLabel) {
  const isFirst = state.currentStep === 0;
  const isLast  = state.currentStep === METHODOLOGY.steps.length - 1;
  return `
      <div class="row" style="justify-content:space-between; margin-top:30px;">
        <button class="btn btn-ghost" id="prevStepBtn" ${isFirst?"disabled style='visibility:hidden'":""}>← ${escapeHtml(prevLabel || "Back")}</button>
        <button class="btn btn-primary" id="nextStepBtn">${escapeHtml(isLast ? "Done" : (nextLabel || "Next"))} →</button>
      </div>
    </div>
  `;
}

/* ============== STEP 1 — SETUP ============== */
const DISCIPLINES = [
  { id: "",                 label: "(pick a discipline)", hint: "" },
  { id: "humanities",       label: "Humanities (literature, history, philosophy)",
    hint: "Thematic structure, longer paragraphs, “I” acceptable, MLA/Chicago citation, close-reading expected." },
  { id: "social-sciences",  label: "Social Sciences (sociology, politics, psych)",
    hint: "Hybrid structure (intro/lit-review/methods/discussion), hedged claims, APA/Harvard, methods made explicit." },
  { id: "hard-sciences",    label: "Hard Sciences (biology, chemistry, physics)",
    hint: "IMRaD structure (Intro, Methods, Results, Discussion), short paragraphs, “I” rare, Vancouver/IEEE/CSE." },
  { id: "engineering",      label: "Engineering / CS",
    hint: "IMRaD or report-style, code/diagrams expected, IEEE citation, prefer present tense for results." },
  { id: "law",              label: "Law",
    hint: "Issue–Rule–Application–Conclusion (IRAC) structure, OSCOLA footnotes, precedent-led reasoning." },
  { id: "business",         label: "Business / Management",
    hint: "Executive summary first, action-oriented, evidence from cases + theory, Harvard citation, recommendations explicit." },
  { id: "medicine",         label: "Medicine / Health Sciences",
    hint: "IMRaD, Vancouver citation, evidence pyramid awareness (systematic reviews > RCTs > cohort > case)." },
  { id: "education",        label: "Education",
    hint: "Reflective + research blend, APA citation, evidence-based practice framing." }
];

function renderSetup() {
  const e = state.current;
  const degOptions = METHODOLOGY.degreeLevels.map(d => `<option value="${escapeHtml(d.id)}" ${e.setup.degreeLevel===d.id?"selected":""}>${escapeHtml(d.label)}</option>`).join("");
  const citationOptions = METHODOLOGY.citationStyles.map(c => `<option value="${escapeHtml(c)}" ${e.setup.citationStyle===c?"selected":""}>${escapeHtml(c)}</option>`).join("");
  const discOptions = DISCIPLINES.map(d => `<option value="${escapeHtml(d.id)}" ${e.setup.discipline===d.id?"selected":""}>${escapeHtml(d.label)}</option>`).join("");
  const discHint = (DISCIPLINES.find(d => d.id === e.setup.discipline) || {}).hint || "";
  return header(0) + `
    <div class="panel">
      <h3>Project details</h3>
      <p class="panel-sub">The basics. You can edit any of these later. None of this leaves your browser.</p>

      <div class="grid-2">
        <label class="field"><span>Essay title (working)</span>
          <input class="wide" id="set-title" value="${escapeHtml(e.setup.title)}" placeholder="e.g. Surveillance capitalism and democratic erosion"/>
        </label>
        <label class="field"><span>Course / module</span>
          <input class="wide" id="set-course" value="${escapeHtml(e.setup.course)}" placeholder="e.g. POLS 3214 — Digital Politics"/>
        </label>
        <label class="field"><span>Degree level</span>
          <select id="set-degree">${degOptions}</select>
        </label>
        <label class="field"><span>Word count target</span>
          <input class="wide" type="number" id="set-wordcount" value="${escapeHtml(e.setup.wordCount)}" min="100" step="100"/>
        </label>
        <label class="field"><span>Deadline</span>
          <input class="wide" type="date" id="set-deadline" value="${escapeHtml(e.setup.deadline)}"/>
        </label>
        <label class="field"><span>Citation style</span>
          <select id="set-citation">${citationOptions}</select>
        </label>
        <label class="field"><span>Discipline</span>
          <select id="set-discipline">${discOptions}</select>
        </label>
      </div>
      ${discHint ? `<p class="muted small" id="disciplineHint">${escapeHtml(discHint)}</p>` : `<p class="muted small" id="disciplineHint"></p>`}
    </div>

    <div class="panel">
      <h3>The essay brief</h3>
      <p class="panel-sub">Paste the assignment brief or prompt exactly as given. We'll decode it in the next step.</p>
      <textarea class="wide" id="set-brief" style="min-height:160px;" placeholder="Paste the full brief here — including any rubric URL, length limit, or required sources.">${escapeHtml(e.setup.brief)}</textarea>
    </div>

    <div class="panel">
      <h3>Initial idea or angle <span class="muted small">(optional)</span></h3>
      <p class="panel-sub">If you already have a rough topic or angle, jot it down. Otherwise leave blank — the AI Coach can help you find one in Step 4.</p>
      <textarea class="wide" id="set-idea" style="min-height:100px;" placeholder="e.g. I want to write about how TikTok shapes Gen Z's political opinions, but I'm not sure of the angle.">${escapeHtml(e.setup.initialIdea)}</textarea>
    </div>
  ` + footer("Home", "Decode the Brief");
}

/* ============== STEP 2 — BRIEF BREAKDOWN ============== */
function renderBriefBreakdown() {
  const e = state.current;
  const cmdHints = METHODOLOGY.briefBreakdown.commandWords
    .map(c => `<span class="chip"><b>${escapeHtml(c.word)}</b> → ${escapeHtml(c.maps)}</span>`).join("");
  return header(1) + `
    <div class="panel">
      <h3>The brief, again</h3>
      <p class="panel-sub">Re-read your brief. Highlight (in your head) command words and constraints.</p>
      <pre class="brief-display">${escapeHtml(e.setup.brief || "(no brief — go back to Step 1)")}</pre>
      <div class="row">
        <button class="btn btn-ghost btn-sm" data-coach="brief:Decode this essay brief for me. Identify command words, audience, scope (timeframe/geography/discipline), constraints, and success criteria. Suggest which curriculum essay types it could match.">✨ Decode the brief with AI</button>
      </div>
    </div>

    <div class="panel">
      <h3>Command-word cheatsheet</h3>
      <p class="panel-sub">Common verbs map to essay types. The full list is in <code>methodology.js</code>.</p>
      <div class="chip-row">${cmdHints}</div>
    </div>

    <div class="panel">
      <h3>Your decoded notes</h3>
      <p class="panel-sub">Fill these in — your answers become the criteria the rest of the app uses.</p>
      <label class="field"><span>Command words you spotted</span>
        <input class="wide" id="brief-cmd" value="${escapeHtml(e.brief.commandWords)}" placeholder="e.g. evaluate, compare, to what extent"/>
      </label>
      <label class="field"><span>Audience — who reads this?</span>
        <input class="wide" id="brief-audience" value="${escapeHtml(e.brief.audience)}" placeholder="e.g. module tutor + external examiner, treat as informed non-expert"/>
      </label>
      <label class="field"><span>Scope — timeframe, geography, discipline</span>
        <input class="wide" id="brief-scope" value="${escapeHtml(e.brief.scope)}" placeholder="e.g. UK post-2010 social-media policy"/>
      </label>
      <label class="field"><span>Constraints — word count, banned sources, format</span>
        <textarea class="wide" id="brief-constraints" placeholder="e.g. 1,500 words ±10%; primary sources required; no Wikipedia">${escapeHtml(e.brief.constraints)}</textarea>
      </label>
      <label class="field"><span>Success criteria — what does 'top mark' look like?</span>
        <textarea class="wide" id="brief-success" placeholder="e.g. nuanced position with counterargument, ≥6 peer-reviewed sources, clean APA">${escapeHtml(e.brief.successCriteria)}</textarea>
      </label>
      <label class="field"><span>Notes / unanswered questions</span>
        <textarea class="wide" id="brief-notes">${escapeHtml(e.brief.notes)}</textarea>
      </label>
    </div>
  ` + footer("Setup", "Set the Rubric");
}

/* ============== STEP 3 — RUBRIC ============== */
function renderRubric() {
  const e = state.current;
  const templateOptions = ['<option value="">— pick a template —</option>']
    .concat(METHODOLOGY.rubricTemplates.map(t => `<option value="${escapeHtml(t.id)}" ${e.rubric.templateId===t.id?"selected":""}>${escapeHtml(t.label)}</option>`))
    .join("");

  const criteria = e.rubric.criteria && e.rubric.criteria.length
    ? e.rubric.criteria
    : (e.rubric.templateId
        ? (METHODOLOGY.rubricTemplates.find(t=>t.id===e.rubric.templateId)?.criteria || [])
        : []);

  const critHtml = criteria.length
    ? `<table class="rubric-table">
        <thead><tr><th>Criterion</th><th>Weight (%)</th><th>What top marks look like</th></tr></thead>
        <tbody>${criteria.map((c, i) => `
          <tr>
            <td><input class="wide" data-rcrit="name" data-i="${i}" value="${escapeHtml(c.name)}"/></td>
            <td><input class="wide" data-rcrit="weight" data-i="${i}" type="number" min="0" max="100" value="${escapeHtml(c.weight)}" style="width:90px;"/></td>
            <td><textarea data-rcrit="descriptor" data-i="${i}">${escapeHtml(c.descriptor)}</textarea></td>
          </tr>
        `).join("")}</tbody>
      </table>`
    : `<p class="muted">No criteria yet. Pick a template above or paste your own rubric below.</p>`;

  return header(2) + `
    <div class="panel">
      <h3>Pick a rubric template</h3>
      <p class="panel-sub">Choose the closest match to your assignment, then edit. Or paste a custom rubric below.</p>
      <label class="field"><span>Template</span>
        <select id="rubric-template">${templateOptions}</select>
      </label>
    </div>

    <div class="panel">
      <h3>Rubric criteria</h3>
      <p class="panel-sub">Edit, re-weight, add or remove rows. Weights should sum to 100.</p>
      <div id="rubricGrid">${critHtml}</div>
      <div class="row">
        <button class="btn btn-ghost btn-sm" id="addCritBtn">+ Add criterion</button>
        <span class="muted small" id="rubricWeightSum"></span>
      </div>
    </div>

    <div class="panel">
      <h3>Or paste your own rubric</h3>
      <p class="panel-sub">If you have the full rubric text (e.g. from your tutor), paste it here. The AI Coach can parse it into criteria.</p>
      <textarea class="wide" id="rubric-paste" style="min-height:160px;" placeholder="Paste the rubric or marking scheme">${escapeHtml(e.rubric.paste)}</textarea>
      <div class="row">
        <button class="btn btn-ghost btn-sm" data-coach="rubric:Parse the rubric I pasted into a structured table of criteria, weights, and what top marks look like. Then explain in 3 bullets which criteria I will most need to defend in my essay.">✨ Parse rubric with AI</button>
      </div>
    </div>
  ` + footer("Brief", "Research Questions");
}

/* ============== STEP 4 — RESEARCH QUESTIONS ============== */
function renderResearchQuestions() {
  const e = state.current;
  const qsHtml = (e.questions.generated.length === 0)
    ? `<p class="muted">No questions yet. Click "Generate research questions" or add your own.</p>`
    : e.questions.generated.map((q, i) => rqCard(q, i, e.questions.selected === i)).join("");

  return header(3) + `
    <div class="panel">
      <h3>From topic to research question</h3>
      <p class="panel-sub">A good research question turns a vague topic into something you can actually answer with evidence. The AI Coach can generate candidates from your initial idea + brief — then you score and pick a favourite.</p>
      <div class="row">
        <button class="btn btn-primary btn-sm" id="genQuestionsBtn">✨ Generate 5 research questions</button>
        <button class="btn btn-ghost btn-sm" id="addQuestionBtn">+ Add your own</button>
      </div>
    </div>

    <div class="panel">
      <h3>Candidate questions</h3>
      <p class="panel-sub">Score each across Specificity, Researchability, Significance, Arguability, and Scope (0–5). Pick a favourite by selecting it.</p>
      <div id="rqList">${qsHtml}</div>
    </div>

    <div class="panel">
      <h3>Or use a custom question</h3>
      <p class="panel-sub">If you've got the perfect question already, type it here.</p>
      <textarea class="wide" id="custom-question" placeholder="One sentence ending with a question mark">${escapeHtml(e.questions.customQuestion)}</textarea>
      <div class="row">
        <button class="btn btn-ghost btn-sm" id="useCustomBtn">Use this as my question</button>
      </div>
    </div>
  ` + footer("Rubric", "Recommend Essay Type");
}

function rqCard(q, i, selected) {
  const criteria = METHODOLOGY.rqCriteria;
  const total = criteria.reduce((s, c) => s + (parseInt(q.scores?.[c.id] || 0, 10) || 0), 0);
  return `
    <div class="rq-card ${selected?"selected":""}" data-rqi="${i}">
      <div class="rq-head">
        <textarea class="wide" data-rq="text" placeholder="Research question…">${escapeHtml(q.text || "")}</textarea>
        <button class="btn btn-ghost btn-sm" data-rq-remove="${i}">Remove</button>
      </div>
      <div class="rq-scores">
        ${criteria.map(c => `
          <label class="rq-score">
            <span title="${escapeHtml(c.help)}">${escapeHtml(c.label)}</span>
            <input type="number" min="0" max="5" data-rq-score="${c.id}" value="${escapeHtml(q.scores?.[c.id] || 0)}"/>
          </label>
        `).join("")}
        <div class="rq-total">Total: <b>${total}</b>/25</div>
      </div>
      <div class="rq-foot">
        <textarea class="wide" data-rq="notes" placeholder="Why this question? What evidence would you need?">${escapeHtml(q.notes || "")}</textarea>
        <div class="row">
          <button class="btn ${selected?"btn-primary":"btn-ghost"} btn-sm" data-rq-select="${i}">${selected?"✓ Selected":"Pick this question"}</button>
        </div>
      </div>
    </div>
  `;
}

/* ============== STEP 5 — ESSAY TYPE ============== */
function renderEssayType() {
  const e = state.current;
  const q = currentResearchQuestion(e);
  const rec = q ? recommendEssayType(q) : null;
  if (rec && !e.essayType.recommended) {
    e.essayType.recommended = rec.typeId;
    e.essayType.reasoning = rec.why;
    if (!e.essayType.chosen) e.essayType.chosen = rec.typeId;
    saveEssays();
    logIntegrity("TYPE_RECOMMEND", `RQ: "${q.slice(0,80)}" → ${rec.typeId}`);
  }

  const cards = METHODOLOGY.essayTypes.map(t => {
    const isRec = e.essayType.recommended === t.id;
    const isChosen = e.essayType.chosen === t.id;
    return `
      <div class="type-card ${isChosen?"chosen":""} ${isRec?"recommended":""}" data-type-id="${escapeHtml(t.id)}">
        <span class="badge">${escapeHtml(t.badge)}</span>
        ${isRec ? `<span class="rec-badge">★ Recommended</span>` : ""}
        <h4>${escapeHtml(t.title)}</h4>
        <p>${escapeHtml(t.summary)}</p>
        <div class="kw"><b>Key words:</b> ${escapeHtml(t.keywords.join(", "))}</div>
        <details><summary>Example thesis</summary><blockquote>${escapeHtml(t.thesisExample)}</blockquote></details>
        <button class="btn ${isChosen?"btn-primary":"btn-ghost"} btn-sm" data-pick-type="${escapeHtml(t.id)}">${isChosen?"✓ Chosen":"Choose"}</button>
      </div>
    `;
  }).join("");

  return header(4) + `
    <div class="panel">
      <h3>Your chosen research question</h3>
      <p class="panel-sub">The recommendation below is based on this question's wording.</p>
      <blockquote class="rq-display">${escapeHtml(q || "(no question selected — go back to Step 4)")}</blockquote>
    </div>

    <div class="panel">
      <h3>Recommended essay type</h3>
      <p class="panel-sub">${escapeHtml(e.essayType.reasoning || "Pick a research question in Step 4 for a tailored recommendation.")}</p>
      <div class="row">
        <button class="btn btn-ghost btn-sm" data-coach="type:Given my research question and brief, walk me through which essay type best fits, with a 3-sentence justification per option. End with a recommendation.">✨ Discuss with AI coach</button>
      </div>
    </div>

    <div class="panel">
      <h3>All essay types</h3>
      <p class="panel-sub">The recommended type is highlighted. You can override.</p>
      <div class="type-grid">${cards}</div>
    </div>
  ` + footer("Research Qs", "Gather Sources");
}

function currentResearchQuestion(e) {
  if (e.questions.customQuestion && e.questions.selected === -2) return e.questions.customQuestion;
  if (e.questions.selected >= 0 && e.questions.generated[e.questions.selected]) {
    return e.questions.generated[e.questions.selected].text || "";
  }
  return e.questions.customQuestion || "";
}

/* ============== STEP 6 — SOURCES (RADAR) ============== */
function renderSources() {
  const e = state.current;
  const sourcesHtml = (e.sources || []).map((s, i) => sourceRow(s, i)).join("");
  return header(5) + `
    <div class="panel">
      <h3>RADAR — the source filter</h3>
      <p class="panel-sub">Every source must pass <b>R</b>elevance, <b>A</b>uthority, <b>D</b>ate, <b>A</b>ppearance, <b>R</b>eason. Add candidates; reject the ones that fail.</p>
      <ul class="radar-list">
        ${METHODOLOGY.radar.map(r => `<li><b>${escapeHtml(r.letter)}</b> ${escapeHtml(r.label)} — <span class="muted">${escapeHtml(r.question)}</span></li>`).join("")}
      </ul>
    </div>

    <div class="panel">
      <h3>Your sources</h3>
      <div id="sourceList">${sourcesHtml || `<p class="muted">No sources yet.</p>`}</div>
      <button class="btn btn-ghost btn-sm" id="addSourceBtn">+ Add source</button>
      <div class="row">
        <button class="btn btn-ghost btn-sm" data-coach="radar:Run RADAR on the source I describe below. Score each letter 0–5 with one-sentence reasoning, then verdict (use / reject / treat as opinion).">✨ Run RADAR with coach</button>
      </div>
    </div>

    <div class="panel">
      <h3>Import from Notion</h3>
      <p class="panel-sub">Search pages in your Notion workspace and pull one in as a research source. Useful for re-using reading notes, lecture notes, or annotations you've already taken. Requires a Notion token in Settings.</p>
      <div class="row">
        <input class="wide" id="notionSearchInput" placeholder="Search your Notion workspace…" style="flex:1; min-width:200px;"/>
        <button class="btn btn-primary btn-sm" id="notionSearchBtn">🔍 Search</button>
      </div>
      <p id="notionSearchStatus" class="muted small"></p>
      <div id="notionSearchResults"></div>
    </div>
  ` + footer("Essay Type", "Build Thesis");
}

const SOURCE_TYPES = [
  { id: "",                  label: "(pick a type)" },
  { id: "primary-data",      label: "Primary — original data / artefact / interview" },
  { id: "primary-text",      label: "Primary — original text / document" },
  { id: "secondary-peer",    label: "Secondary — peer-reviewed article / book" },
  { id: "secondary-trade",   label: "Secondary — trade press / industry report" },
  { id: "secondary-news",    label: "Secondary — quality journalism" },
  { id: "tertiary-reference",label: "Tertiary — textbook / encyclopaedia / handbook" },
  { id: "tertiary-database", label: "Tertiary — database aggregator" },
  { id: "opinion",           label: "Opinion / op-ed (treat with caution)" },
  { id: "grey-lit",          label: "Grey literature — gov / NGO / working paper" },
  { id: "other",              label: "Other" }
];

function sourceRow(s, i) {
  s = s || { title:"", authors:"", year:"", publication:"", url:"", type:"", argument:"", radarScore:0, notes:"" };
  const typeOptions = SOURCE_TYPES.map(t =>
    `<option value="${escapeHtml(t.id)}" ${s.type===t.id?"selected":""}>${escapeHtml(t.label)}</option>`
  ).join("");
  return `
    <div class="panel source-row" data-source-row="${i}">
      <div class="grid-2">
        <input class="wide" data-src="title" value="${escapeHtml(s.title)}" placeholder="Title"/>
        <input class="wide" data-src="authors" value="${escapeHtml(s.authors)}" placeholder="Author(s)"/>
        <input class="wide" data-src="year" value="${escapeHtml(s.year)}" placeholder="Year"/>
        <input class="wide" data-src="publication" value="${escapeHtml(s.publication)}" placeholder="Journal / publisher"/>
        <input class="wide" data-src="url" value="${escapeHtml(s.url)}" placeholder="DOI or URL"/>
        <select class="wide" data-src="type">${typeOptions}</select>
      </div>
      <label class="field"><span>Key argument / finding</span>
        <textarea data-src="argument">${escapeHtml(s.argument)}</textarea>
      </label>
      <div class="row">
        <label class="small">RADAR pass (0–5):</label>
        <input type="number" min="0" max="5" data-src="radarScore" value="${escapeHtml(s.radarScore||0)}" style="width:70px;"/>
        <button class="btn btn-ghost btn-sm" data-remove-source="${i}">Remove</button>
      </div>
      <textarea data-src="notes" placeholder="RADAR notes — bias, where it fits in your essay">${escapeHtml(s.notes)}</textarea>
    </div>
  `;
}

/* ============== STEP 7 — THESIS ============== */
function renderThesis() {
  const e = state.current;
  const t = METHODOLOGY.essayTypes.find(x => x.id === e.essayType.chosen);
  const kw = t ? t.keywords.map(escapeHtml).join(", ") : "";
  const ex = t ? escapeHtml(t.thesisExample) : "";
  const ttl = t ? escapeHtml(t.title) : "Essay";
  return header(6) + `
    <div class="panel">
      <h3>Thesis Formula</h3>
      <p class="panel-sub"><code>Topic + Position + Rationale = Strong Thesis</code> — every essay needs an arguable claim with a roadmap of reasons.</p>
      <label class="field"><span>1. Topic — what are you writing about?</span>
        <input class="wide" id="thesis-topic" value="${escapeHtml(e.thesis.topic)}" placeholder="e.g. social media's effect on adolescent mental health"/>
      </label>
      <label class="field"><span>2. Position / Claim — your debatable stance</span>
        <input class="wide" id="thesis-position" value="${escapeHtml(e.thesis.position)}" placeholder="e.g. has a net negative impact on adolescents"/>
      </label>
      <label class="field"><span>3. Rationale — three key reasons (these become body paragraphs)</span>
        <textarea class="wide" id="thesis-rationale" placeholder="a) social comparison&#10;b) cyberbullying&#10;c) sleep disruption">${escapeHtml(e.thesis.rationale)}</textarea>
      </label>
      <label class="field"><span>4. Combine into one or two sentences</span>
        <textarea class="wide" id="thesis-combined" placeholder="Final thesis…">${escapeHtml(e.thesis.combined)}</textarea>
      </label>
      <div class="row">
        <button class="btn btn-ghost btn-sm" id="generateThesisBtn">✨ Generate from parts</button>
        <button class="btn btn-ghost btn-sm" data-coach="refine:Critique my thesis using the 'So what?' test and the Topic+Position+Rationale formula. Suggest two stronger rewrites.">✨ Refine with coach</button>
      </div>
    </div>

    <div class="panel">
      <h3>Supporting claims &amp; counterargument</h3>
      <label class="field"><span>Supporting claims (one per line — each becomes a body paragraph)</span>
        <textarea class="wide" id="thesis-claims" style="min-height:120px;">${escapeHtml(e.thesis.supportingClaims)}</textarea>
      </label>
      <label class="field"><span>Strongest counterargument</span>
        <textarea class="wide" id="thesis-counter" style="min-height:90px;">${escapeHtml(e.thesis.counterargument)}</textarea>
      </label>
      <div class="row">
        <button class="btn btn-primary btn-sm" id="genCounterBtn">✨ Generate strongest counterargument (AI, premium)</button>
        <button class="btn btn-ghost btn-sm" id="acceptCounterBtn" disabled>↓ Insert into counterargument field</button>
      </div>
      <div id="counterOut"></div>
    </div>

    <div class="panel">
      <h3>"So What?" test &amp; type guidance — ${ttl}</h3>
      <div class="callout">
        <b>Watch for these words.</b> A strong thesis for this essay type usually contains: <b>${kw}</b>.<br/>
        <small>Example: <em>${ex}</em></small>
      </div>
    </div>

    <div class="panel">
      <h3>Claim type — local analysis (PHASE 2B)</h3>
      <p class="panel-sub">Heuristic classification of your thesis (Booth, Colomb & Williams). Different claim types need different evidence.</p>
      <div class="row">
        <button class="btn btn-primary btn-sm" id="classifyClaimBtn">▶ Classify my thesis</button>
        <button class="btn btn-ghost btn-sm" data-coach="critique:Stress-test my thesis with the 'So what?' test. Then play devil's advocate — give the single strongest objection a tutor would raise. Then suggest one tighter rewrite.">✨ Stress-test (AI, premium)</button>
      </div>
      <div id="claimClassifyOut"></div>
    </div>

    <div class="panel">
      <h3>Motive — why this thesis matters (Harvard)</h3>
      <p class="panel-sub">A "motive paragraph" answers: what does the field gain from your argument? Write 2–3 sentences explaining the stakes.</p>
      <textarea class="wide" id="thesis-motive" style="min-height:90px;" placeholder="Existing scholarship treats X as Y. This essay argues that recognising Z changes how we…">${escapeHtml(e.thesis.motive || "")}</textarea>
    </div>
  ` + footer("Sources", "Build Outline");
}

/* ============== STEP 8 — OUTLINE ============== */
function renderOutline() {
  const e = state.current;
  const t = METHODOLOGY.essayTypes.find(x => x.id === e.essayType.chosen);
  const total = parseInt(e.setup.wordCount || 0, 10) || 0;

  // Level-aware template — Foundation gets the simple structure;
  // UG/PG/Doctoral get full chapter/section frontmatter.
  const levelKey = (e.setup.degreeLevel || "foundation");
  const template = (typeof OUTLINE_TEMPLATES !== "undefined" && OUTLINE_TEMPLATES[levelKey]) || null;

  // Ensure outline.allocation has a key for every template section.
  if (template) {
    e.outline.sectionsByKey = e.outline.sectionsByKey || {};
    template.sections.forEach(s => {
      if (!(s.key in (e.outline.allocation || {}))) {
        e.outline.allocation = e.outline.allocation || {};
        // Seed from template's suggested pct on first visit
        e.outline.allocation[s.key] = s.pct || 0;
      }
      if (!(s.key in e.outline.sectionsByKey)) e.outline.sectionsByKey[s.key] = "";
    });
  }

  const typeStructureHtml = (t ? t.structure : []).map(s => `
    <li><div><b>${escapeHtml(s.name)}</b><br/><small>${escapeHtml(s.what)}</small></div></li>
  `).join("");

  const allocRow = (sec) => {
    const pct = parseFloat((e.outline.allocation || {})[sec.key] || 0) || 0;
    const words = Math.round(total * pct / 100);
    const subs = (sec.subsections || []).map(ss => `
      <div class="sub-row">
        <div class="sub-name"><b>${escapeHtml(ss.name)}</b><br/><small class="muted">${escapeHtml(ss.description || "")}</small></div>
      </div>
    `).join("");
    return `
      <tr>
        <td>
          <div><b>${escapeHtml(sec.name)}</b></div>
          <small class="muted">${escapeHtml(sec.description || "")}</small>
          ${subs ? `<div class="subsections">${subs}</div>` : ""}
        </td>
        <td><input type="number" min="0" max="100" data-alloc="${escapeHtml(sec.key)}" value="${escapeHtml(pct)}" style="width:80px;"/></td>
        <td class="muted">~${words} words</td>
        <td><textarea class="wide" data-section-key="${escapeHtml(sec.key)}" placeholder="One-line plan for this section">${escapeHtml((e.outline.sectionsByKey||{})[sec.key] || "")}</textarea></td>
      </tr>
    `;
  };

  const templateHtml = template ? `
    <div class="panel">
      <h3>${escapeHtml(template.label)}</h3>
      <p class="panel-sub">${escapeHtml(template.blurb)} <span class="muted">Typical word count: ${escapeHtml(template.typicalWordCount.min.toLocaleString())}–${escapeHtml(template.typicalWordCount.max.toLocaleString())} words.</span></p>
      <table class="rubric-table outline-table">
        <thead><tr><th style="min-width:260px;">Section</th><th>%</th><th>Words</th><th>Plan</th></tr></thead>
        <tbody>
          ${template.sections.map(allocRow).join("")}
        </tbody>
      </table>
      <p id="allocSum" class="muted small"></p>
    </div>
  ` : "";

  return header(7) + `
    <div class="panel">
      <h3>Essay-type blueprint — ${escapeHtml(t ? t.title : "")}</h3>
      <p class="panel-sub">The shape your argument takes inside the academic-level template below.</p>
      <ul class="checklist">${typeStructureHtml}</ul>
    </div>

    ${templateHtml}

    <div class="panel">
      <h3>Your outline (free-form)</h3>
      <p class="panel-sub">The structured table above is the spine. Use this box for any extra detail or scratch work.</p>
      <textarea class="wide" id="f-outline" style="min-height:240px;" placeholder="Thesis: …&#10;&#10;Body 1: Point — Evidence — Source&#10;Body 2: …">${escapeHtml(e.outline.text)}</textarea>
      <div class="row">
        <button class="btn btn-ghost btn-sm" id="genOutlineBtn">✨ Generate starter outline from thesis</button>
      </div>
    </div>
  ` + footer("Thesis", "Drafting");
}

/* ============== STEP 9 — WRITING (PEEL) ============== */
function renderWriting() {
  const e = state.current;
  if (!e.paragraphs || !e.paragraphs.length) {
    e.paragraphs = [
      { role:"intro",     label:"Introduction",     point:"", evidence:"", explanation:"", link:"" },
      { role:"body",      label:"Body 1",           point:"", evidence:"", explanation:"", link:"" },
      { role:"body",      label:"Body 2",           point:"", evidence:"", explanation:"", link:"" },
      { role:"body",      label:"Body 3",           point:"", evidence:"", explanation:"", link:"" },
      { role:"counter",   label:"Counterargument",  point:"", evidence:"", explanation:"", link:"" },
      { role:"conclusion",label:"Conclusion",       point:"", evidence:"", explanation:"", link:"" }
    ];
  }

  const paragraphHtml = (p, i) => {
    if (p.role === "counter") return `
      <div class="panel" data-pidx="${i}">
        <h3>${escapeHtml(p.label)}</h3>
        <p class="panel-sub"><b>They Say / I Say</b> model — acknowledge the strongest opposing view, then refute it with evidence.</p>
        <label class="field"><span>They say… (the strongest opposing argument)</span>
          <textarea class="wide" data-peel="point" placeholder="Critics of this position argue that…">${escapeHtml(p.point)}</textarea>
        </label>
        <label class="field"><span>I say… (your refutation with evidence)</span>
          <textarea class="wide" data-peel="evidence" placeholder="However, this view overlooks… The evidence, however, suggests…">${escapeHtml(p.evidence)}</textarea>
        </label>
        <label class="field"><span>Why your position holds</span>
          <textarea class="wide" data-peel="explanation" placeholder="Therefore…">${escapeHtml(p.explanation)}</textarea>
        </label>
        <div class="row">
          <button class="btn btn-ghost btn-sm" data-coach='counter:Draft a balanced "They Say / I Say" paragraph for my essay using my thesis and the strongest opposing view I should anticipate.'>✨ Draft with coach</button>
        </div>
      </div>`;

    if (p.role === "intro") return `
      <div class="panel" data-pidx="${i}">
        <h3>${escapeHtml(p.label)}</h3>
        <p class="panel-sub">Introduction funnel: <b>Hook</b> → <b>Background</b> → <b>Thesis</b>. Avoid summarising the essay before it starts.</p>
        <label class="field"><span>Hook (1–2 sentences)</span>
          <textarea class="wide" data-peel="point" placeholder="Surprising fact, vivid example, or provocative question">${escapeHtml(p.point)}</textarea>
        </label>
        <label class="field"><span>Background / context</span>
          <textarea class="wide" data-peel="evidence" placeholder="Orient the reader briefly">${escapeHtml(p.evidence)}</textarea>
        </label>
        <label class="field"><span>Thesis statement (paste from Step 7)</span>
          <textarea class="wide" data-peel="explanation">${escapeHtml(p.explanation || e.thesis.combined || "")}</textarea>
        </label>
      </div>`;

    if (p.role === "conclusion") return `
      <div class="panel" data-pidx="${i}">
        <h3>${escapeHtml(p.label)}</h3>
        <p class="panel-sub">Reverse funnel: <b>Restate thesis</b> → <b>Summarise key points</b> → <b>Final thought</b>. Do not introduce new evidence.</p>
        <label class="field"><span>Restate thesis (in fresh words)</span>
          <textarea class="wide" data-peel="point">${escapeHtml(p.point)}</textarea>
        </label>
        <label class="field"><span>Summarise main reasons</span>
          <textarea class="wide" data-peel="evidence">${escapeHtml(p.evidence)}</textarea>
        </label>
        <label class="field"><span>Final thought / "So what?"</span>
          <textarea class="wide" data-peel="explanation">${escapeHtml(p.explanation)}</textarea>
        </label>
      </div>`;

    return `
      <div class="panel" data-pidx="${i}">
        <h3>${escapeHtml(p.label)} — PEEL paragraph</h3>
        <p class="panel-sub"><b>P</b>oint · <b>E</b>vidence · <b>W</b>arrant (optional) · <b>E</b>xplanation · <b>L</b>ink</p>
        <label class="field"><span>(P) Point — topic sentence</span>
          <textarea class="wide" data-peel="point" placeholder="One sentence: what this paragraph proves about the thesis">${escapeHtml(p.point)}</textarea>
        </label>
        <label class="field"><span>(E) Evidence — fact, quote, statistic with citation</span>
          <textarea class="wide" data-peel="evidence" placeholder="According to [Author, year]…">${escapeHtml(p.evidence)}</textarea>
        </label>
        <label class="field"><span>(W) Warrant — the unstated principle linking evidence to point (Booth)</span>
          <textarea class="wide" data-peel="warrant" placeholder="Optional. e.g. ‘Where adolescent attention is the dependent variable, longitudinal evidence outranks correlation studies.’">${escapeHtml(p.warrant || "")}</textarea>
        </label>
        <label class="field"><span>(E) Explanation — what the evidence shows</span>
          <textarea class="wide" data-peel="explanation" placeholder="This shows that… This is significant because…">${escapeHtml(p.explanation)}</textarea>
        </label>
        <label class="field"><span>(L) Link — to next paragraph or back to thesis</span>
          <textarea class="wide" data-peel="link" placeholder="This not only shows X, but also introduces Y…">${escapeHtml(p.link)}</textarea>
        </label>
        <div class="row">
          <button class="btn btn-ghost btn-sm" data-coach="peel:Check this paragraph against the PEEL structure (Point, Evidence, Explanation, Link). Flag any missing or weak element. Also name the warrant — the unstated principle linking the evidence to the point — and say whether it holds.">✨ Check PEEL with coach</button>
        </div>
      </div>`;
  };

  return header(8) + `
    <div class="callout"><b>Coach's note.</b> Write one paragraph at a time. Don't aim for perfect prose — aim for clear architecture. You can prose-polish in Step 10.</div>
    ${e.paragraphs.map(paragraphHtml).join("")}
    <div class="panel">
      <h3>Stitched draft</h3>
      <p class="panel-sub">Assemble the paragraphs into a continuous draft, or write here directly. This is what gets exported.</p>
      <textarea class="wide" id="f-draft" style="min-height:340px;">${escapeHtml(e.draft || "")}</textarea>
      <div class="row">
        <button class="btn btn-ghost btn-sm" id="stitchDraftBtn">Stitch PEEL parts into draft</button>
        <button class="btn btn-ghost btn-sm" id="phraseLibBtn">📝 Signal-phrase library</button>
        <button class="btn btn-primary btn-sm" id="suggestNextBtn">✨ Suggest next sentence (AI)</button>
        <span class="muted small" id="draftCount"></span>
      </div>
      <div id="phraseLibPanel" class="phrase-lib" hidden></div>
      <div id="suggestOut"></div>
    </div>
  ` + footer("Outline", "Polish");
}

/* ============== STEP 10 — POLISHING ============== */
function renderPolishing() {
  const e = state.current;
  const groups = {};
  METHODOLOGY.polishChecklist.forEach(c => { (groups[c.group] = groups[c.group] || []).push(c); });

  const groupsHtml = Object.entries(groups).map(([g, list]) => `
    <div class="panel">
      <h3>${escapeHtml(g)}</h3>
      <ul class="checklist">
        ${list.map(item => `
          <li>
            <input type="checkbox" data-check="${escapeHtml(item.id)}" ${e.checklist[item.id]?"checked":""}/>
            <div>${escapeHtml(item.text)}</div>
          </li>
        `).join("")}
      </ul>
    </div>
  `).join("");

  const fallaciesHtml = METHODOLOGY.fallacies.map(f => `<b>${escapeHtml(f.name)}</b>: ${escapeHtml(f.warn)}`).join("<br/>");

  // rubric-criteria self-assessment
  const rubricSelfHtml = (e.rubric.criteria || []).length
    ? `<div class="panel">
        <h3>Rubric self-assessment</h3>
        <p class="panel-sub">Tick where you believe your draft meets each criterion.</p>
        <table class="rubric-table">
          <thead><tr><th>Criterion</th><th>Weight</th><th>Met?</th><th>Notes</th></tr></thead>
          <tbody>
            ${e.rubric.criteria.map((c, i) => `
              <tr>
                <td>${escapeHtml(c.name)}</td>
                <td>${escapeHtml(c.weight)}%</td>
                <td><input type="checkbox" data-rubric-met="${i}" ${c.met?"checked":""}/></td>
                <td><input class="wide" data-rubric-note="${i}" value="${escapeHtml(c.selfNote||"")}" placeholder="Evidence in your draft"/></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>` : "";

  return header(9) + `
    <div class="callout">
      <b>Logical fallacies to scan for.</b><br/>${fallaciesHtml}
    </div>

    <div class="panel">
      <h3>Local checks — free, instant (PHASE 4.5 + 2B)</h3>
      <p class="panel-sub">Deterministic linters that run in your browser. No API call, no cost. Run these first, then ask the AI coach only for what they don't catch.</p>
      <div class="row">
        <button class="btn btn-primary btn-sm" id="runLocalChecksBtn">▶ Run local checks on draft</button>
        <button class="btn btn-ghost btn-sm" id="runCitationLintBtn">▶ Citation-style lint (${escapeHtml(e.setup.citationStyle || "?")})</button>
        <button class="btn btn-ghost btn-sm" id="runReverseOutlineBtn">▶ Reverse outline</button>
        <span id="localChecksStatus" class="muted small"></span>
      </div>
      <div id="localChecksOut"></div>
      <div id="citationLintOut"></div>
      <div id="reverseOutlineOut"></div>
    </div>

    ${rubricSelfHtml}
    ${groupsHtml}
    <div class="panel">
      <h3>AI deep checks — judgement-grade (premium model)</h3>
      <p class="panel-sub">Run these when the local checks pass. The AI uses the curriculum's frameworks (Ch.4 fallacies, PEEL coherence, Booth's argument audit). Each call's cost appears below.</p>
      <div class="row">
        <button class="btn btn-primary btn-sm" id="aiFallacyBtn">⚠ Full-draft fallacy scan</button>
        <button class="btn btn-primary btn-sm" id="aiArgAuditBtn">🔍 Argument audit (Booth)</button>
        <button class="btn btn-primary btn-sm" id="aiAnalysisBtn">📊 Analysis-vs-summary balance</button>
      </div>
      <div id="aiFallacyOut"></div>
      <div id="aiArgAuditOut"></div>
      <div id="aiAnalysisOut"></div>
    </div>

    <div class="panel">
      <h3>Proofreading helpers (PHASE 2C)</h3>
      <p class="panel-sub">Reverse-order proofreading breaks your narrative flow so typos and weak sentences become visible. Read-aloud uses your browser's built-in speech synthesis — no API call.</p>
      <div class="row">
        <button class="btn btn-ghost btn-sm" id="reverseProofreadBtn">▶ Show draft last sentence first</button>
        <button class="btn btn-ghost btn-sm" id="readAloudBtn">🔊 Read draft aloud</button>
        <button class="btn btn-ghost btn-sm" id="stopReadAloudBtn">⏹ Stop</button>
      </div>
      <div id="reverseProofreadOut"></div>
    </div>

    <div class="panel">
      <h3>Working notes</h3>
      <textarea class="wide" id="f-notes" style="min-height:160px;" placeholder="Things to revisit, feedback from peers, ideas to add">${escapeHtml(e.notes)}</textarea>
      <div class="row">
        <button class="btn btn-ghost btn-sm" data-coach="critique:Critique my full draft against the polishing checklist AND my rubric criteria. For each rubric criterion, score 0–5 and give one concrete improvement.">✨ Full draft critique</button>
      </div>
    </div>
  ` + footer("Drafting", "Final");
}

/* ============== AI USE DECLARATION ============== */

// Maps every logged action into one of the AQA-style assistance categories
// universities typically expect. Two of these (RESEARCH, EDITORIAL) cover
// the bulk of integrity-log activity; the rest are flagged separately so
// markers can see exactly where AI touched the writing.
const DECL_CATEGORIES = {
  BRIEF_PARSE:   "Brief comprehension",
  RUBRIC_SET:    "Brief comprehension",
  RQ_GENERATE:   "Research-question generation",
  RQ_SELECT:     "Research-question selection (student decision)",
  TYPE_RECOMMEND:"Essay-type recommendation (student decision)",
  TYPE_OVERRIDE: "Essay-type recommendation (student override)",
  SOURCE_ADD:    "Sources added (manual)",
  SOURCE_RADAR:  "Source evaluation (RADAR)",
  THESIS_SAVE:   "Thesis drafting assistance",
  OUTLINE_SAVE:  "Outline drafting assistance",
  PEEL_SAVE:     "Paragraph drafting assistance",
  COACH_CALL:    "Conversational feedback / critique",
  EXPORT_LOCAL:  "Export (no AI involvement)",
  EXPORT_NOTION: "Export (no AI involvement)"
};

// Returns a structured Markdown declaration built from the integrity log
// + the active provider + the student fields entered on the Final step.
function buildAIDeclaration(essay) {
  const s = state.settings;
  const provider = (s.provider || "anthropic");
  const modelId  = (s.model && s.model[provider]) || "(model)";
  const providerLabel = ({
    anthropic: "Anthropic Claude",
    openai:    "OpenAI",
    gemini:    "Google Gemini"
  })[provider] || provider;

  const log = essay.integrity || [];
  const totalEvents = log.length;
  const coachEvents = log.filter(r => r.action === "COACH_CALL").length;
  const aiGenerative = log.filter(r => /^(RQ_GENERATE|THESIS_SAVE|OUTLINE_SAVE|COACH_CALL)$/.test(r.action)).length;
  const manualEvents = log.filter(r => /^(RQ_SELECT|TYPE_OVERRIDE|SOURCE_ADD|SOURCE_RADAR|PEEL_SAVE|EXPORT_LOCAL|EXPORT_NOTION|RUBRIC_SET|BRIEF_PARSE)$/.test(r.action)).length;

  // Group log by category so each line summarises how many times each
  // category was used.
  const byCat = {};
  for (const r of log) {
    const cat = DECL_CATEGORIES[r.action] || "Other";
    byCat[cat] = (byCat[cat] || 0) + 1;
  }
  const catRows = Object.entries(byCat)
    .sort((a,b) => b[1]-a[1])
    .map(([cat, n]) => `- **${cat}** — ${n} interaction${n===1?"":"s"}`).join("\n") || "- (none)";

  // First and last activity timestamps
  const first = log.length ? new Date(log[0].ts) : null;
  const last  = log.length ? new Date(log[log.length-1].ts) : null;
  const period = (first && last)
    ? `${first.toLocaleDateString()} – ${last.toLocaleDateString()}`
    : "(no activity recorded)";

  const wordCount = (essay.draft || "").trim().split(/\s+/).filter(Boolean).length;
  const essayTitle = essay.setup.title || "(untitled essay)";
  const essayType  = (METHODOLOGY.essayTypes.find(t => t.id === essay.essayType.chosen)?.title) || "Essay";
  const today = new Date().toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });
  const name = (s.studentName || "").trim() || "[Your name]";
  const mod  = (s.studentModule || "").trim();
  const inst = (s.studentInstitution || "").trim();

  // Detailed activity table (last 100 actions, chronological)
  const detailRows = log.slice(-100).map(r => {
    const t = new Date(r.ts).toLocaleString();
    const cat = DECL_CATEGORIES[r.action] || r.action;
    const detail = (r.detail || "").replace(/\|/g, "/");
    return `| ${t} | ${cat} | ${detail} |`;
  }).join("\n") || "| — | (no activity) | — |";

  return `# AI Use Declaration

**Submitted by:** ${name}  ${mod ? `\\\n**Module / course:** ${mod}  ` : ""}${inst ? `\\\n**Institution:** ${inst}  ` : ""}
**Essay title:** ${essayTitle}  \\
**Essay type:** ${essayType}  \\
**Word count:** ${wordCount}  \\
**Date of declaration:** ${today}  \\
**Activity period:** ${period}

---

## 1. Statement of authorship

I confirm that this essay is my own work. Where I have used generative AI tools as an assistant, I have done so transparently and have reviewed, edited, and taken intellectual responsibility for every idea, sentence, citation, and argument that appears in the submitted text.

## 2. Tools used

| Tool | Provider | Model | Purpose |
|---|---|---|---|
| Easy Essay (in-app coach) | ${providerLabel} | \`${modelId}\` | Process scaffolding (brief decoding, RADAR, PEEL, RQ scoring) and on-demand feedback throughout drafting. |

No other generative-AI tools were used in producing this essay${log.length === 0 ? ", and the in-app coach was not invoked during this draft." : "."}

## 3. Summary of AI assistance

Across the period above, the integrity log recorded **${totalEvents} action${totalEvents===1?"":"s"}** in total: **${aiGenerative}** generative AI assist${aiGenerative===1?"":"s"} (e.g. research-question generation, coach feedback) and **${manualEvents}** manual / decision step${manualEvents===1?"":"s"} (student choices, source additions, evaluations).

**Breakdown by category:**

${catRows}

**Of which, conversational coach interactions:** ${coachEvents}.

## 4. What the AI did NOT do

The following remained entirely my own work:

- Selection of the research question from the AI-generated candidates.
- Selection of the essay type (the recommendation is a suggestion only).
- All RADAR source evaluations.
- All final PEEL paragraph content (the coach may have given feedback, but the text in the submitted draft is my own composition).
- The polishing checklist and final proofread.
- Selection of which AI suggestions to accept, reject, or modify.

## 5. Use of AI was consistent with my institution's policy

I have read and complied with my institution's policy on the use of generative AI in assessed work. Where the policy required a declaration, this document fulfils that requirement. Where the policy required specific actions (e.g. flagging AI-assisted passages, retaining a copy of prompts), I have done so.

## 6. Detailed activity log (last 100 actions)

| Timestamp | Category | Detail |
|---|---|---|
${detailRows}

---

**Signed:** ${name}  \\
**Date:** ${today}

*Generated by Easy Essay from the in-app integrity log on ${today}. This declaration is a faithful summary of the recorded activity; the student is responsible for verifying its completeness before submission.*
`;
}

/* ============== COST PANEL (PHASE 4.6) ============== */
function fmtUSD(v) {
  if (!v && v !== 0) return "$0.0000";
  if (v < 0.01) return "$" + v.toFixed(4);
  if (v < 1)    return "$" + v.toFixed(3);
  return "$" + v.toFixed(2);
}

function renderCostPanel(e) {
  const cost = e.aiCost || { total: 0, byTask: {}, byModel: {}, calls: 0 };
  const ledger = (e.aiLedger || []).slice(-20).reverse();
  const taskRows = Object.entries(cost.byTask).sort((a,b)=>b[1]-a[1]).map(([k,v]) =>
    `<tr><td>${escapeHtml(METHODOLOGY.integrityActions[k] || k)}</td><td>${fmtUSD(v)}</td></tr>`
  ).join("") || `<tr><td colspan="2" class="muted">(no AI calls yet)</td></tr>`;
  const modelRows = Object.entries(cost.byModel).sort((a,b)=>b[1]-a[1]).map(([k,v]) =>
    `<tr><td><code>${escapeHtml(k)}</code></td><td>${fmtUSD(v)}</td></tr>`
  ).join("") || `<tr><td colspan="2" class="muted">(no AI calls yet)</td></tr>`;
  const ledgerRows = ledger.map(r => `
    <tr>
      <td class="muted small">${escapeHtml(fmtDate(r.ts))}</td>
      <td>${escapeHtml(METHODOLOGY.integrityActions[r.task] || r.task)}</td>
      <td><code>${escapeHtml(r.model || "")}</code></td>
      <td class="small">${r.inTokens} in / ${r.outTokens} out${r.cacheRead ? ` (${r.cacheRead} cached)` : ""}</td>
      <td>${fmtUSD(r.cost)}</td>
    </tr>
  `).join("");

  return `
    <div class="cost-summary">
      <div class="cost-big">${fmtUSD(cost.total)}</div>
      <div class="cost-sub">${cost.calls} call${cost.calls===1?"":"s"} this essay</div>
    </div>
    <div class="grid-2">
      <div>
        <h4 class="cost-h">By task</h4>
        <table class="rubric-table"><tbody>${taskRows}</tbody></table>
      </div>
      <div>
        <h4 class="cost-h">By model</h4>
        <table class="rubric-table"><tbody>${modelRows}</tbody></table>
      </div>
    </div>
    ${ledgerRows ? `
      <h4 class="cost-h" style="margin-top:16px;">Recent calls</h4>
      <table class="rubric-table">
        <thead><tr><th>When</th><th>Task</th><th>Model</th><th>Tokens</th><th>Cost</th></tr></thead>
        <tbody>${ledgerRows}</tbody>
      </table>
    ` : ""}
  `;
}

/* ============== STEP 11 — FINAL & EXPORT ============== */
function renderFinal() {
  const e = state.current;
  const wordCount = (e.draft || "").trim().split(/\s+/).filter(Boolean).length;
  const integrityHtml = (e.integrity || []).slice(-40).reverse().map(row => `
    <tr>
      <td class="muted small">${escapeHtml(fmtDate(row.ts))}</td>
      <td><b>${escapeHtml(METHODOLOGY.integrityActions[row.action] || row.action)}</b></td>
      <td>${escapeHtml(row.detail)}</td>
    </tr>
  `).join("");

  return header(10) + `
    <div class="panel">
      <h3>Submission summary</h3>
      <p class="panel-sub">${escapeHtml(METHODOLOGY.essayTypes.find(t=>t.id===e.essayType.chosen)?.title || "Essay")} · ${wordCount} words · target ${escapeHtml(e.setup.wordCount)} · ${escapeHtml(e.setup.citationStyle)} · last updated ${escapeHtml(fmtDate(e.updatedAt))}</p>
      <div class="row">
        <button class="btn btn-ghost" id="downloadMdBtn">⬇ Download as Markdown</button>
        <button class="btn btn-ghost" id="downloadTxtBtn">⬇ Download as .txt</button>
        <button class="btn btn-ghost" id="copyDraftBtn">📋 Copy draft</button>
      </div>
    </div>

    <div class="panel">
      <h3>Push to Notion</h3>
      <p class="panel-sub">Send this essay as a new page under your configured Notion parent page. Configure token + parent page in <a href="#" id="goSettings">Settings</a>.</p>
      <label class="field"><span>Override parent page ID for this essay (optional)</span>
        <input type="text" id="notion-parent-override" placeholder="Defaults to global setting"/>
      </label>
      <div class="row">
        <button class="btn btn-primary" id="pushNotionBtn">⤴ Push to Notion</button>
      </div>
      <p id="notionPushStatus" class="status-line"></p>
    </div>

    <div class="panel">
      <h3>Integrity report (PHASE 3 — BYO API)</h3>
      <p class="panel-sub">Run a Turnitin-style similarity / AI-text check using your own provider key. Configure in Settings → "Integrity detection". If no provider is set, the AI Use Declaration below is your transparency artifact.</p>
      <div class="row">
        <button class="btn btn-primary" id="runDetectionBtn">▶ Run Integrity Check</button>
        <span id="detectionRunStatus" class="muted small"></span>
      </div>
      <div id="detectionReport"></div>
    </div>

    <div class="panel">
      <h3>AI cost — this essay</h3>
      <p class="panel-sub">Total spend on AI calls for this essay, by task and by model. Useful for cost-aware iteration and for class budgets.</p>
      ${renderCostPanel(e)}
    </div>

    <div class="panel">
      <h3>Academic Integrity Log</h3>
      <p class="panel-sub">Transparent record of every AI assist and major action — the raw evidence behind the declaration below.</p>
      ${integrityHtml ? `<table class="rubric-table"><thead><tr><th>When</th><th>Action</th><th>Detail</th></tr></thead><tbody>${integrityHtml}</tbody></table>` : `<p class="muted">No activity yet.</p>`}
    </div>

    <div class="panel">
      <h3>AI Use Declaration</h3>
      <p class="panel-sub">Most universities now require a statement of AI assistance. This generates one from your integrity log — list of tools used, what they were used for, what was accepted vs rejected, and a signature line. Edit as needed before submission.</p>
      <label class="field"><span>Your name (for the declaration)</span>
        <input type="text" id="decl-name" placeholder="e.g. Carl Alston" value="${escapeHtml(state.settings.studentName || "")}"/>
      </label>
      <label class="field"><span>Module / course (optional)</span>
        <input type="text" id="decl-module" placeholder="e.g. SOC301 Digital Societies" value="${escapeHtml(state.settings.studentModule || "")}"/>
      </label>
      <label class="field"><span>Institution (optional)</span>
        <input type="text" id="decl-institution" placeholder="e.g. University of …" value="${escapeHtml(state.settings.studentInstitution || "")}"/>
      </label>
      <div class="row">
        <button class="btn btn-primary" id="generateDeclBtn">⊕ Generate Declaration</button>
        <button class="btn btn-ghost" id="downloadDeclBtn" disabled>⬇ Download .md</button>
        <button class="btn btn-ghost" id="copyDeclBtn" disabled>📋 Copy</button>
      </div>
      <div id="declPreview" class="decl-preview"></div>
    </div>

    <div class="panel">
      <h3>Final draft preview</h3>
      <p class="panel-sub">A read-only preview of what will be exported.</p>
      <pre style="white-space:pre-wrap; font-family:inherit; background:#fafaf5; border:1px solid var(--line); padding:16px; border-radius:10px;">${escapeHtml(buildFinalText(e))}</pre>
    </div>
  ` + footer("Polish", "Done");
}

/* ============== STAGE WIRING ============== */
function wireStage() {
  const e = state.current; if (!e) return;

  const next = $("#nextStepBtn"), prev = $("#prevStepBtn");
  if (next) next.addEventListener("click", () => {
    persistCurrentStep();
    if (state.currentStep < METHODOLOGY.steps.length - 1) {
      state.currentStep++; e.step = state.currentStep; e.updatedAt = Date.now(); saveEssays();
      renderWorkspace();
    } else { switchView("library"); }
  });
  if (prev) prev.addEventListener("click", () => {
    persistCurrentStep();
    if (state.currentStep > 0) {
      state.currentStep--; e.step = state.currentStep; e.updatedAt = Date.now(); saveEssays();
      renderWorkspace();
    } else { switchView("home"); }
  });

  $$("#stage textarea, #stage input, #stage select").forEach(el => el.addEventListener("input", () => persistCurrentStep(false)));

  const wirers = [
    wireSetup, wireBrief, wireRubric, wireQuestions,
    wireType, wireSources, wireThesisStep, wireOutlineStep,
    wireWriting, wirePolishing, wireFinal
  ];
  wirers[state.currentStep]?.();

  $$("[data-coach]").forEach(btn => {
    btn.addEventListener("click", () => {
      const raw = btn.dataset.coach;
      const colon = raw.indexOf(":");
      const text = colon >= 0 ? raw.slice(colon + 1).trim() : raw;
      openCoach();
      $("#coachInput").value = text;
      sendCoachMessage();
    });
  });
}

function wireSetup() {
  // Live update of the discipline hint as the user picks one.
  $("#set-discipline")?.addEventListener("change", (ev) => {
    const hint = (DISCIPLINES.find(d => d.id === ev.target.value) || {}).hint || "";
    const el = $("#disciplineHint");
    if (el) el.textContent = hint;
  });
}

function wireBrief() {
  // nothing extra beyond auto-save
}

function wireRubric() {
  const tplSel = $("#rubric-template");
  if (tplSel) tplSel.addEventListener("change", () => {
    const id = tplSel.value;
    state.current.rubric.templateId = id;
    if (id) {
      const tpl = METHODOLOGY.rubricTemplates.find(t => t.id === id);
      if (tpl) state.current.rubric.criteria = tpl.criteria.map(c => ({ ...c }));
      logIntegrity("RUBRIC_SET", "Template: " + (tpl?.label||id));
    }
    persistCurrentStep();
    renderStep();
  });

  $("#addCritBtn")?.addEventListener("click", () => {
    state.current.rubric.criteria = state.current.rubric.criteria || [];
    state.current.rubric.criteria.push({ name:"New criterion", weight:10, descriptor:"" });
    persistCurrentStep();
    renderStep();
  });

  computeRubricSum();
}

function computeRubricSum() {
  const el = $("#rubricWeightSum"); if (!el) return;
  const sum = (state.current.rubric.criteria || []).reduce((s,c) => s + (parseInt(c.weight,10)||0), 0);
  el.textContent = `Weights sum: ${sum}%` + (sum===100 ? " ✓" : sum>100 ? " (over 100)" : " (under 100)");
}

function wireQuestions() {
  const genBtn = $("#genQuestionsBtn");
  if (genBtn) genBtn.addEventListener("click", () => generateResearchQuestions());

  $("#addQuestionBtn")?.addEventListener("click", () => {
    state.current.questions.generated = state.current.questions.generated || [];
    state.current.questions.generated.push({ text:"", scores:{}, notes:"" });
    persistCurrentStep();
    renderStep();
  });

  $$("[data-rq-remove]").forEach(b => b.addEventListener("click", () => {
    const i = parseInt(b.dataset.rqRemove, 10);
    state.current.questions.generated.splice(i, 1);
    if (state.current.questions.selected === i) state.current.questions.selected = -1;
    else if (state.current.questions.selected > i) state.current.questions.selected--;
    persistCurrentStep();
    renderStep();
  }));
  $$("[data-rq-select]").forEach(b => b.addEventListener("click", () => {
    const i = parseInt(b.dataset.rqSelect, 10);
    state.current.questions.selected = i;
    state.current.essayType.recommended = "";  // force fresh recommendation
    logIntegrity("RQ_SELECT", state.current.questions.generated[i]?.text || "");
    persistCurrentStep();
    renderStep();
  }));

  $("#useCustomBtn")?.addEventListener("click", () => {
    const t = $("#custom-question").value.trim();
    if (!t) { toast("Type a question first."); return; }
    state.current.questions.customQuestion = t;
    state.current.questions.selected = -2;
    state.current.essayType.recommended = "";
    logIntegrity("RQ_SELECT", "Custom: " + t);
    persistCurrentStep();
    renderStep();
  });
}

async function generateResearchQuestions() {
  const e = state.current;
  const s = state.settings;
  if (!s.keys[s.provider]) {
    toast("Add an API key in Settings first.");
    switchView("settings"); return;
  }

  toast("Generating questions…", 4000);

  const prompt = `Given the brief and context below, generate exactly 5 candidate research questions. Each must be a single sentence ending with a question mark, specific enough to be researchable, and varied in angle. Return one question per line — no numbering, no commentary.

BRIEF:
${e.setup.brief || "(none)"}

INITIAL IDEA:
${e.setup.initialIdea || "(none)"}

AUDIENCE / SCOPE / CONSTRAINTS:
- Audience: ${e.brief.audience || "(none)"}
- Scope: ${e.brief.scope || "(none)"}
- Constraints: ${e.brief.constraints || "(none)"}

RUBRIC EMPHASIS:
${(e.rubric.criteria || []).map(c => `- ${c.name} (${c.weight}%)`).join("\n") || "(none)"}`;

  try {
    const result = await AI.chat({
      provider: s.provider,
      model: pickModel("RQ_GENERATE"),
      task: "RQ_GENERATE",
      apiKey: s.keys[s.provider],
      cacheable: s.promptCaching !== false,
      system: METHODOLOGY.coachSystem + "\n\nYou are now generating research questions only. Output exactly 5 questions, one per line.",
      messages: [{ role:"user", content: prompt }]
    });
    recordAIUsage({ task: "RQ_GENERATE", model: result.model, usage: result.usage, cost: result.cost });
    const lines = result.text.split(/\r?\n/).map(l => l.replace(/^[-•\d.\)\s]+/, "").trim()).filter(l => l.endsWith("?")).slice(0, 6);
    if (!lines.length) { toast("No questions parsed. Try again or add manually."); return; }
    e.questions.generated = lines.map(t => ({ text: t, scores: {}, notes: "" }));
    e.questions.selected = -1;
    logIntegrity("RQ_GENERATE", `${lines.length} candidates generated`);
    persistCurrentStep();
    renderStep();
    toast("Generated " + lines.length + " questions.");
  } catch (err) {
    toast("AI error: " + err.message, 4500);
  }
}

function wireType() {
  $$("[data-pick-type]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.pickType;
    state.current.essayType.chosen = id;
    if (id !== state.current.essayType.recommended) {
      logIntegrity("TYPE_OVERRIDE", `Chose ${id} over recommended ${state.current.essayType.recommended}`);
    }
    persistCurrentStep();
    renderStep();
    renderWorkspace();
  }));
}

function wireSources() {
  const addBtn = $("#addSourceBtn");
  if (addBtn) addBtn.addEventListener("click", () => {
    state.current.sources = state.current.sources || [];
    state.current.sources.push({ title:"", authors:"", year:"", publication:"", url:"", type:"", argument:"", radarScore:0, notes:"" });
    logIntegrity("SOURCE_ADD", "");
    persistCurrentStep(); renderStep();
  });
  $$("[data-remove-source]").forEach(b => b.addEventListener("click", () => {
    const idx = parseInt(b.dataset.removeSource, 10);
    state.current.sources.splice(idx, 1);
    persistCurrentStep(); renderStep();
  }));

  // Notion search + import
  let _notionResults = [];
  async function doNotionSearch() {
    const status = $("#notionSearchStatus");
    const resultsEl = $("#notionSearchResults");
    const q = $("#notionSearchInput").value.trim();
    const token = state.settings.notion?.token;
    if (!token) { status.textContent = "No Notion token — add one in Settings."; return; }
    status.textContent = q ? `Searching for "${q}"…` : "Listing recently-edited pages…";
    resultsEl.innerHTML = "";
    try {
      const r = await Notion.search(token, q, { filterType: "page", sortDirection: "descending", page_size: 20 });
      _notionResults = r.results || [];
      if (!_notionResults.length) {
        status.textContent = "No pages found. Make sure the integration is shared with the page you want.";
        return;
      }
      status.textContent = `${_notionResults.length} page${_notionResults.length===1?"":"s"} found. Click any to import as a source.`;
      const rowsHtml = _notionResults.map((p, i) => {
        const title = extractNotionTitle(p);
        const edited = p.last_edited_time ? new Date(p.last_edited_time).toLocaleDateString() : "";
        const url = p.url || "";
        return `
          <div class="notion-result" data-idx="${i}">
            <div>
              <div class="notion-result-title">${escapeHtml(title)}</div>
              <div class="muted small">Edited ${escapeHtml(edited)} · <a href="${escapeHtml(url)}" target="_blank" rel="noopener">open in Notion ↗</a></div>
            </div>
            <button class="btn btn-primary btn-sm" data-import-idx="${i}">⬇ Import</button>
          </div>
        `;
      }).join("");
      resultsEl.innerHTML = rowsHtml;
      $$("#notionSearchResults [data-import-idx]").forEach(btn => btn.addEventListener("click", () => importNotionPage(parseInt(btn.dataset.importIdx, 10))));
    } catch (err) {
      status.textContent = "Search failed: " + err.message;
    }
  }

  async function importNotionPage(idx) {
    const page = _notionResults[idx];
    if (!page) return;
    const token = state.settings.notion?.token;
    const status = $("#notionSearchStatus");
    const title = extractNotionTitle(page);
    status.textContent = `Pulling "${title}" content…`;
    try {
      const text = await Notion.getPageText(token, page.id, { maxBlocks: 500 });
      state.current.sources = state.current.sources || [];
      state.current.sources.push({
        title,
        authors: "(Notion)",
        year: page.last_edited_time ? page.last_edited_time.slice(0, 4) : "",
        publication: "Notion",
        url: page.url || "",
        type: "other",
        argument: text.slice(0, 4000),  // truncate massive pages
        radarScore: 0,
        notes: `Imported from Notion on ${new Date().toLocaleDateString()}. ${text.length.toLocaleString()} characters fetched. Run RADAR before citing.`
      });
      logIntegrity("SOURCE_ADD", `Imported from Notion: ${title}`);
      persistCurrentStep(false);
      status.textContent = `Imported "${title}" as a source — scroll up to find and RADAR-evaluate it.`;
      toast("Imported into Sources.");
      renderStep();
    } catch (err) {
      status.textContent = "Import failed: " + err.message;
    }
  }

  $("#notionSearchBtn")?.addEventListener("click", doNotionSearch);
  $("#notionSearchInput")?.addEventListener("keydown", ev => { if (ev.key === "Enter") { ev.preventDefault(); doNotionSearch(); } });
}

/* Helper — pull a Notion page's title out of its properties payload. */
function extractNotionTitle(page) {
  const props = page.properties || {};
  for (const k of Object.keys(props)) {
    const v = props[k];
    if (v && v.type === "title" && Array.isArray(v.title)) {
      return v.title.map(t => t.plain_text || "").join("").trim() || "(untitled)";
    }
  }
  return page.url ? page.url.split("/").pop().replace(/-[a-f0-9]{32}$/, "").replace(/-/g, " ") : "(untitled)";
}

function wireThesisStep() {
  const gen = $("#generateThesisBtn");
  if (gen) gen.addEventListener("click", () => {
    const t = state.current.thesis;
    const r = (t.rationale || "").split(/\n/).map(x => x.replace(/^[-•\d.\)\s]+/, "").trim()).filter(Boolean);
    const combined = [t.topic, t.position].filter(Boolean).join(" ").trim();
    if (combined) {
      const tail = r.length ? ` because ${r.join(", ")}` : "";
      $("#thesis-combined").value = `${combined}${tail}.`.replace(/\s+/g, " ");
      persistCurrentStep();
      logIntegrity("THESIS_SAVE", "Generated from parts");
      toast("Generated draft thesis. Now refine it.");
    } else {
      toast("Fill in Topic & Position first.");
    }
  });

  // PHASE 2C/2B — AI counter-argument generator (premium model)
  let _lastCounter = "";
  $("#genCounterBtn")?.addEventListener("click", async () => {
    const e = state.current;
    const thesis = (e.thesis.combined || "").trim();
    if (!thesis) { toast("Write a thesis first."); return; }
    const sys = METHODOLOGY.coachSystem + `\n\nYou are generating a single, strong counterargument to the student's thesis. Use They Say / I Say templates. Be the most charitable, sharpest opposing position a tutor would raise — not a strawman. Output 3-5 sentences only, no preamble.`;
    const user = `Thesis: ${thesis}\n\nResearch question: ${currentResearchQuestion(e) || "(none)"}\nEssay type: ${e.essayType.chosen || "(none)"}\n\nGenerate the single strongest counterargument.`;
    const t = await runAIAction({
      task: "COUNTER_GEN", system: sys, user, outId: "counterOut", label: "Counterargument",
      onText: (txt) => { _lastCounter = txt; const btn = $("#acceptCounterBtn"); if (btn) btn.disabled = false; }
    });
  });
  $("#acceptCounterBtn")?.addEventListener("click", () => {
    if (!_lastCounter) return;
    const ta = $("#thesis-counter");
    if (!ta) return;
    ta.value = (ta.value ? ta.value.trim() + "\n\n" : "") + _lastCounter;
    persistCurrentStep(false);
    toast("Counterargument inserted.");
    logIntegrity("COACH_CALL", "Accepted AI counterargument");
  });

  // PHASE 2B — Claim classifier
  $("#classifyClaimBtn")?.addEventListener("click", () => {
    const t = state.current.thesis;
    const thesis = (t.combined || "").trim();
    if (!thesis) {
      $("#claimClassifyOut").innerHTML = `<p class="muted small">No thesis yet — fill in the formula first.</p>`;
      return;
    }
    const r = LocalChecks.classifyClaim(thesis);
    const badge = `<span class="lc-${r.confidence === 'high' ? 'flag' : 'warn'}" style="margin-right:8px;">${r.type.toUpperCase()}</span>`;
    $("#claimClassifyOut").innerHTML = `
      <div class="local-summary" style="margin-top:12px;">
        ${badge}
        <span class="muted">${r.confidence} confidence</span>
      </div>
      <p>${escapeHtml(r.guidance)}</p>
      <p class="muted small">Signals: conceptual ${r.scores.conceptual} · practical ${r.scores.practical} · evaluative ${r.scores.evaluative}.</p>
    `;
  });
}

function wireOutlineStep() {
  const gen = $("#genOutlineBtn");
  if (gen) gen.addEventListener("click", () => {
    const e = state.current;
    const reasons = (e.thesis.supportingClaims || e.thesis.rationale || "")
      .split(/\n/).map(s => s.replace(/^[-•\d.\)\s]+/, "").trim()).filter(Boolean);
    const lines = [];
    lines.push("Thesis: " + (e.thesis.combined || "(write thesis in Step 7)"));
    lines.push("");
    reasons.slice(0,3).forEach((r,i) => {
      lines.push(`Body ${i+1}: ${r}`);
      lines.push("  · Evidence: ");
      lines.push("  · Source: ");
    });
    lines.push("Counter: They say… I say…");
    lines.push("Conclusion: Restate, summarise, final thought.");
    $("#f-outline").value = lines.join("\n");
    persistCurrentStep();
    logIntegrity("OUTLINE_SAVE", "Starter outline generated");
    toast("Starter outline generated.");
  });

  computeAllocSum();
}

function computeAllocSum() {
  const el = $("#allocSum"); if (!el) return;
  const a = state.current.outline.allocation;
  const sum = Object.values(a).reduce((s,v) => s + (parseFloat(v)||0), 0);
  el.textContent = `Total: ${sum}%` + (sum===100 ? " ✓" : sum>100 ? " (over)" : " (under)");
}

/* PHASE 4.5 — Local-check renderer + wiring */
function renderLocalCheckFindings(findings, stats) {
  if (!findings || !findings.length) {
    return `<p class="muted small" style="margin-top:10px;">No issues found. Word count ${stats?.count || 0} sentences (avg ${stats?.avg?.toFixed(1) || "?"}, sd ${stats?.sd?.toFixed(1) || "?"}).</p>`;
  }
  const s = LocalChecks.summary(findings);
  const head = `
    <div class="local-summary">
      <span class="lc-flag">${s.flag} flag${s.flag===1?"":"s"}</span>
      <span class="lc-warn">${s.warn} warn${s.warn===1?"":"s"}</span>
      <span class="lc-info">${s.info} info</span>
      ${stats ? `<span class="muted">${stats.count} sentences · avg ${stats.avg.toFixed(1)} words · sd ${stats.sd.toFixed(1)}</span>` : ""}
    </div>`;
  const rows = findings.slice(0, 50).map(f => `
    <tr class="lc-${f.severity}">
      <td class="lc-sev">${f.severity}</td>
      <td>${escapeHtml(f.category)}</td>
      <td class="muted small">line ${f.line}</td>
      <td><code>${escapeHtml(f.excerpt.slice(0, 80))}</code></td>
      <td>${escapeHtml(f.suggestion)}</td>
    </tr>
  `).join("");
  const more = findings.length > 50 ? `<p class="muted small">+ ${findings.length - 50} more findings (showing first 50).</p>` : "";
  return head + `<table class="rubric-table local-table"><thead><tr><th>Sev</th><th>Category</th><th>Where</th><th>Excerpt</th><th>Suggestion</th></tr></thead><tbody>${rows}</tbody></table>` + more;
}

function wirePolishing() {
  $("#runLocalChecksBtn")?.addEventListener("click", () => {
    const e = state.current;
    const draft = e.draft || "";
    if (!draft.trim()) {
      $("#localChecksOut").innerHTML = `<p class="muted small">No draft yet — write something in Step 9 first.</p>`;
      return;
    }
    const t0 = performance.now();
    // Phase 4.5 + 2B: combine the main lint with hedging-balance and
    // pointing-word checks so a single click surfaces everything.
    const findings = LocalChecks.lint(draft)
      .concat(LocalChecks.hedgingBalance(draft))
      .concat(LocalChecks.pointingWordCheck(draft))
      .concat(LocalChecks.transitionCheck(draft));
    const stats = LocalChecks.sentenceStats(draft);
    const elapsed = (performance.now() - t0).toFixed(1);
    const summary = LocalChecks.summary(findings);
    $("#localChecksStatus").textContent = `${findings.length} finding${findings.length===1?"":"s"} in ${elapsed}ms — $0 cost.`;
    $("#localChecksOut").innerHTML = renderLocalCheckFindings(findings, stats);
    e.lastLint = { ts: Date.now(), summary, count: findings.length };
    saveEssays();
  });

  // PHASE 2B — Citation-style linter
  $("#runCitationLintBtn")?.addEventListener("click", () => {
    const e = state.current;
    const draft = e.draft || "";
    const style = e.setup.citationStyle || "";
    if (!style) {
      $("#citationLintOut").innerHTML = `<p class="muted small">No citation style set — pick one in Step 1 Setup.</p>`;
      return;
    }
    if (!LocalChecks.CITATION_VALIDATORS[style]) {
      $("#citationLintOut").innerHTML = `<p class="muted small">No linter for “${escapeHtml(style)}” yet — supported: ${Object.keys(LocalChecks.CITATION_VALIDATORS).join(", ")}.</p>`;
      return;
    }
    const findings = LocalChecks.lintCitations(draft, style);
    if (!findings.length) {
      $("#citationLintOut").innerHTML = `<p class="muted small">No ${escapeHtml(style)} citation-style issues found in the draft.</p>`;
      return;
    }
    $("#citationLintOut").innerHTML = `<h4 class="cost-h" style="margin-top:14px;">Citation-style findings — ${escapeHtml(style)}</h4>` + renderLocalCheckFindings(findings, null);
  });

  // PHASE 2B — AI Fallacy scan (full draft)
  $("#aiFallacyBtn")?.addEventListener("click", () => {
    const e = state.current;
    const draft = (e.draft || "").trim();
    if (!draft) { toast("Write a draft first."); return; }
    const sys = METHODOLOGY.coachSystem + `\n\nYou are scanning the student's draft for logical fallacies using the curriculum's list: hasty generalisation, slippery slope, ad hominem, straw man, appeal to authority, loaded language, false dichotomy, circular reasoning, and post hoc. For each fallacy found, give: name, the offending sentence (verbatim), why it's a fallacy in this context, and a one-line rewrite. If the draft is clean, say so explicitly. Use markdown headings per finding.`;
    const user = `Thesis: ${e.thesis.combined || "(none)"}\n\nDraft:\n\n${draft.slice(0, 9000)}`;
    runAIAction({ task: "FALLACY_SCAN", system: sys, user, outId: "aiFallacyOut", label: "Fallacy scan" });
  });

  // PHASE 2B — AI Argument audit (Booth)
  $("#aiArgAuditBtn")?.addEventListener("click", () => {
    const e = state.current;
    const draft = (e.draft || "").trim();
    if (!draft) { toast("Write a draft first."); return; }
    const sys = METHODOLOGY.coachSystem + `\n\nYou are auditing the student's draft as Booth, Colomb & Williams ("The Craft of Research") would. For each body paragraph: (1) state the claim, (2) state the evidence, (3) state the warrant (the unstated principle linking evidence to claim — name it explicitly), (4) flag any unsupported claim or missing warrant. End with one paragraph naming the single most important structural problem in the draft.`;
    const user = `Thesis: ${e.thesis.combined || "(none)"}\n\nDraft:\n\n${draft.slice(0, 9000)}`;
    runAIAction({ task: "ARGUMENT_AUDIT", system: sys, user, outId: "aiArgAuditOut", label: "Argument audit" });
  });

  // PHASE 2B — Analysis vs summary balance (per-paragraph)
  $("#aiAnalysisBtn")?.addEventListener("click", () => {
    const e = state.current;
    const draft = (e.draft || "").trim();
    if (!draft) { toast("Write a draft first."); return; }
    // First run local heuristic for a quick free pass, then AI for the
    // judgement-grade view.
    const paras = draft.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const localRows = paras.map((p, i) => {
      const r = LocalChecks.analysisBalance(p);
      const sev = r.verdict === "evidence-heavy" ? "lc-warn" : r.verdict === "unsupported" ? "lc-flag" : "lc-info";
      return `<tr><td>${i+1}</td><td>${r.totalWords}</td><td>${r.quoted}</td><td>${(r.quotedRatio*100).toFixed(0)}%</td><td><span class="${sev}" style="padding:2px 8px;border-radius:100px;">${r.verdict}</span></td></tr>`;
    }).join("");
    $("#aiAnalysisOut").innerHTML = `
      <h4 class="cost-h" style="margin-top:14px;">Local analysis (instant, $0)</h4>
      <table class="rubric-table"><thead><tr><th>#</th><th>Total words</th><th>Quoted</th><th>Ratio</th><th>Verdict</th></tr></thead><tbody>${localRows}</tbody></table>
      <p class="muted small">A balanced body paragraph runs ~50/50 evidence/analysis. "Evidence-heavy" = too much quotation; "unsupported" = no evidence at all.</p>
      <p id="aiAnalysisDeepStatus" class="muted small"></p>
    `;
    // Optional AI deep call
    if (paras.length > 0) {
      const sys = METHODOLOGY.coachSystem + `\n\nYou are auditing analysis-vs-summary balance. For each body paragraph: name in ONE sentence what the paragraph does (analyse / summarise / describe / argue). Flag any paragraph that mostly summarises sources rather than analysing them. Suggest one concrete sentence to add or replace in each weak paragraph.`;
      const user = `Draft:\n\n${draft.slice(0, 9000)}`;
      runAIAction({ task: "ARGUMENT_AUDIT", system: sys, user, outId: "aiAnalysisDeepStatus", label: "Analysis depth (AI)" });
    }
  });

  // PHASE 2C — Reverse-order proofreader
  $("#reverseProofreadBtn")?.addEventListener("click", () => {
    const e = state.current;
    const draft = (e.draft || "").trim();
    if (!draft) { $("#reverseProofreadOut").innerHTML = `<p class="muted small">No draft yet.</p>`; return; }
    const sents = draft.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).filter(Boolean).reverse();
    $("#reverseProofreadOut").innerHTML = `
      <p class="muted small">Read each sentence in isolation — last to first. Click any line to copy it.</p>
      <ol class="reverse-proof">
        ${sents.map(s => `<li><code class="rp-line" data-sent="${escapeHtml(s)}">${escapeHtml(s)}</code></li>`).join("")}
      </ol>
    `;
    $$(".rp-line").forEach(el => el.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(el.dataset.sent); toast("Sentence copied."); }
      catch { /* no-op */ }
    }));
  });

  // PHASE 2C — Read aloud via browser speech synthesis (no API call)
  $("#readAloudBtn")?.addEventListener("click", () => {
    const e = state.current;
    const draft = (e.draft || "").trim();
    if (!draft) { toast("No draft to read."); return; }
    if (!("speechSynthesis" in window)) { toast("This browser doesn't support speech synthesis."); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(draft);
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
    toast("Reading…");
  });
  $("#stopReadAloudBtn")?.addEventListener("click", () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  });

  // PHASE 2B — Reverse outline
  $("#runReverseOutlineBtn")?.addEventListener("click", () => {
    const e = state.current;
    const draft = e.draft || "";
    if (!draft.trim()) {
      $("#reverseOutlineOut").innerHTML = `<p class="muted small">No draft yet to outline.</p>`;
      return;
    }
    const rev = LocalChecks.reverseOutline(draft);
    if (!rev.length) {
      $("#reverseOutlineOut").innerHTML = `<p class="muted small">Draft has no paragraph breaks — separate paragraphs with blank lines.</p>`;
      return;
    }
    const total = rev.reduce((s,r)=>s+r.wordCount,0);
    $("#reverseOutlineOut").innerHTML = `
      <h4 class="cost-h" style="margin-top:14px;">Reverse outline (${rev.length} paragraphs · ${total} words)</h4>
      <p class="muted small">Read this top-to-bottom — does the argument actually progress? Does each topic sentence carry its paragraph?</p>
      <table class="rubric-table">
        <thead><tr><th>#</th><th>Topic sentence</th><th>Words</th></tr></thead>
        <tbody>${rev.map(r => `
          <tr><td>${r.index}</td><td>${escapeHtml(r.topicSentence)}</td><td>${r.wordCount}</td></tr>
        `).join("")}</tbody>
      </table>
    `;
  });
}

/* Generic AI-action helper used by the proactive buttons (counter-arg, fallacy
 * scan, argument audit, etc.). Routes by task, records usage, renders into
 * a target output container.
 *
 * params:
 *   task     — TASK_ROUTING key (e.g. "COUNTER_GEN", "FALLACY_SCAN")
 *   system   — system prompt (defaults to METHODOLOGY.coachSystem + context)
 *   user     — user prompt
 *   outId    — id of the DOM container to render into
 *   label    — short label shown on the cost line
 *   onText   — optional (text) => void if the caller wants to mutate state
 */
async function runAIAction({ task, system, user, outId, label, onText }) {
  const s = state.settings;
  const out = $("#" + outId);
  if (!out) return;
  if (!s.keys[s.provider]) {
    out.innerHTML = `<p class="status-line err">No API key for ${escapeHtml(s.provider)} — add one in Settings.</p>`;
    return;
  }
  out.innerHTML = `<p class="muted small">Asking the AI (${escapeHtml(label || task)})…</p>`;
  try {
    const result = await AI.chat({
      provider: s.provider,
      model: pickModel(task),
      task,
      apiKey: s.keys[s.provider],
      cacheable: s.promptCaching !== false,
      system,
      messages: [{ role: "user", content: user }]
    });
    recordAIUsage({ task, model: result.model, usage: result.usage, cost: result.cost });
    const t = (result.text || "").trim();
    if (typeof onText === "function") onText(t);
    out.innerHTML = `
      <div class="ai-action-box">
        <p class="muted small">${escapeHtml(label || task)} · ${escapeHtml(result.model)} · ${fmtUSD(result.cost)}</p>
        <div class="ai-action-text">${escapeHtml(t).replace(/\n/g, "<br/>")}</div>
      </div>
    `;
    return t;
  } catch (err) {
    out.innerHTML = `<p class="status-line err">AI action failed: ${escapeHtml(err.message)}</p>`;
  }
}

/* PHASE 2C — Signal-phrase library (TSIS + transitions + signal phrases).
 * Click-to-insert sentence frames, organised by purpose. */
const SIGNAL_PHRASES = [
  { group: "They Say — introducing an opposing view", items: [
    "Critics of this position argue that …",
    "Some people might contend that …",
    "A common concern about this argument is …",
    "It might be objected that …",
    "Although some scholars maintain that …"
  ]},
  { group: "I Say — refuting", items: [
    "However, this view overlooks …",
    "While this concern is valid, it fails to account for …",
    "The evidence, however, suggests otherwise.",
    "This objection, while reasonable, depends on …",
    "Yet on closer examination …"
  ]},
  { group: "I Say — conceding then rebutting", items: [
    "Although it is true that X, my point is more important because …",
    "I grant that …, but nevertheless …",
    "While X may hold in some cases, in this context …"
  ]},
  { group: "Signal phrases for evidence", items: [
    "According to Smith (2023), …",
    "Smith (2023) argues that …",
    "As Smith (2023) demonstrates, …",
    "Recent research (Smith, 2023) shows that …",
    "In an analysis of 200 cases, Smith (2023) found …"
  ]},
  { group: "Transitions — adding evidence", items: [
    "Moreover, …",
    "Furthermore, …",
    "In addition, …",
    "What is more, …"
  ]},
  { group: "Transitions — contrasting", items: [
    "However, …",
    "On the other hand, …",
    "By contrast, …",
    "Nevertheless, …"
  ]},
  { group: "Transitions — causal / consequence", items: [
    "Therefore, …",
    "As a result, …",
    "Consequently, …",
    "It follows that …"
  ]},
  { group: "Pointing back to your argument (metacommentary)", items: [
    "This finding matters because …",
    "What this shows is that …",
    "Taken together, these examples demonstrate that …",
    "In short, …"
  ]}
];

function renderPhraseLib() {
  return SIGNAL_PHRASES.map(g => `
    <div class="phrase-group">
      <h5>${escapeHtml(g.group)}</h5>
      <div class="phrase-chips">
        ${g.items.map(p => `<button class="phrase-chip" data-phrase="${escapeHtml(p)}">${escapeHtml(p)}</button>`).join("")}
      </div>
    </div>
  `).join("");
}

function wireWriting() {
  const stitch = $("#stitchDraftBtn");
  if (stitch) stitch.addEventListener("click", () => {
    const e = state.current;
    const parts = (e.paragraphs || []).map(p => {
      if (p.role === "intro" || p.role === "conclusion") return [p.point, p.evidence, p.explanation].filter(Boolean).join(" ");
      if (p.role === "counter") return ["Counterargument: " + (p.point || ""), p.evidence, p.explanation].filter(Boolean).join(" ");
      return [p.point, p.evidence, p.explanation, p.link].filter(Boolean).join(" ");
    });
    $("#f-draft").value = parts.filter(Boolean).join("\n\n");
    persistCurrentStep();
    logIntegrity("PEEL_SAVE", "Stitched draft");
    toast("Stitched paragraphs into the draft.");
  });
  // word counter
  const draftEl = $("#f-draft"), cnt = $("#draftCount");
  function tick() {
    if (!draftEl || !cnt) return;
    const w = (draftEl.value||"").trim().split(/\s+/).filter(Boolean).length;
    cnt.textContent = `${w} words / target ${state.current.setup.wordCount}`;
  }
  if (draftEl) { draftEl.addEventListener("input", tick); tick(); }

  // PHASE 2C — Signal-phrase library toggle
  $("#phraseLibBtn")?.addEventListener("click", () => {
    const panel = $("#phraseLibPanel");
    if (!panel) return;
    if (panel.hidden) {
      panel.innerHTML = renderPhraseLib();
      panel.hidden = false;
      panel.querySelectorAll(".phrase-chip").forEach(b => b.addEventListener("click", () => {
        const phrase = b.dataset.phrase;
        const ta = $("#f-draft");
        if (!ta) return;
        const pos = ta.selectionStart ?? ta.value.length;
        const before = ta.value.slice(0, pos);
        const after  = ta.value.slice(pos);
        const sep = before && !/[\s\n]$/.test(before) ? " " : "";
        ta.value = before + sep + phrase + " " + after;
        ta.focus();
        ta.setSelectionRange(pos + sep.length + phrase.length + 1, pos + sep.length + phrase.length + 1);
        persistCurrentStep(false);
        tick();
      }));
    } else {
      panel.hidden = true;
    }
  });

  // PHASE 2C — AI "Suggest next sentence"
  $("#suggestNextBtn")?.addEventListener("click", async () => {
    const e = state.current;
    const s = state.settings;
    const ta = $("#f-draft");
    const pos = ta?.selectionStart ?? (ta?.value.length || 0);
    const before = (ta?.value || "").slice(0, pos);
    if (!before.trim()) { toast("Type something first; the AI continues from your cursor."); return; }
    if (!s.keys[s.provider]) { toast(`No API key for ${s.provider} — add one in Settings.`); return; }
    $("#suggestOut").innerHTML = `<p class="muted small">Asking the AI…</p>`;
    try {
      const ctx = `Essay thesis: ${e.thesis.combined || "(none)"}\nResearch question: ${currentResearchQuestion(e) || "(none)"}\nEssay type: ${e.essayType.chosen || "(none)"}\nCitation style: ${e.setup.citationStyle || ""}\n\nThe student is drafting. Suggest the next 1–2 sentences that should follow, in their voice, in keeping with the thesis and the PEEL paragraph structure. Do not introduce content that has no support; if evidence is needed, write a placeholder like “[Evidence — Smith, 2023]” for the student to verify. Return ONLY the suggested sentence(s), no preamble.`;
      const result = await AI.chat({
        provider: s.provider,
        model: pickModel("PEEL_DRAFT"),
        task: "PEEL_DRAFT",
        apiKey: s.keys[s.provider],
        cacheable: s.promptCaching !== false,
        system: METHODOLOGY.coachSystem + "\n\n" + ctx,
        messages: [{ role: "user", content: "Current draft up to cursor:\n\n" + before.slice(-1200) }]
      });
      recordAIUsage({ task: "PEEL_DRAFT", model: result.model, usage: result.usage, cost: result.cost });
      const suggestion = (result.text || "").trim();
      $("#suggestOut").innerHTML = `
        <div class="suggestion-box">
          <p class="muted small">AI suggestion (${escapeHtml(result.model)}, ${fmtUSD(result.cost)})</p>
          <p class="suggestion-text">${escapeHtml(suggestion)}</p>
          <div class="row">
            <button class="btn btn-primary btn-sm" id="acceptSuggestBtn">✓ Insert at cursor</button>
            <button class="btn btn-ghost btn-sm" id="rejectSuggestBtn">✗ Dismiss</button>
          </div>
        </div>
      `;
      $("#acceptSuggestBtn")?.addEventListener("click", () => {
        const pos2 = ta.selectionStart ?? ta.value.length;
        const b = ta.value.slice(0, pos2);
        const a = ta.value.slice(pos2);
        const sep = b && !/[\s\n]$/.test(b) ? " " : "";
        ta.value = b + sep + suggestion + a;
        ta.focus();
        persistCurrentStep(false);
        tick();
        $("#suggestOut").innerHTML = "";
        logIntegrity("PEEL_SAVE", "Accepted AI suggestion");
      });
      $("#rejectSuggestBtn")?.addEventListener("click", () => { $("#suggestOut").innerHTML = ""; });
    } catch (err) {
      $("#suggestOut").innerHTML = `<p class="status-line err">Suggest failed: ${escapeHtml(err.message)}</p>`;
    }
  });
}

function wireFinal() {
  const e = state.current;
  $("#downloadMdBtn")?.addEventListener("click", () => { downloadFile(buildFinalText(e), (e.setup.title||"essay").replace(/[^\w-]/g,"_") + ".md", "text/markdown"); logIntegrity("EXPORT_LOCAL","Markdown"); });
  $("#downloadTxtBtn")?.addEventListener("click", () => { downloadFile(buildFinalText(e), (e.setup.title||"essay").replace(/[^\w-]/g,"_") + ".txt", "text/plain"); logIntegrity("EXPORT_LOCAL","TXT"); });
  $("#copyDraftBtn")?.addEventListener("click", async () => { await navigator.clipboard.writeText(e.draft || buildFinalText(e)); toast("Copied to clipboard."); });
  $("#goSettings")?.addEventListener("click", ev => { ev.preventDefault(); switchView("settings"); });
  $("#pushNotionBtn")?.addEventListener("click", pushToNotion);

  // --- AI Use Declaration ---
  const persistDeclFields = () => {
    state.settings.studentName        = $("#decl-name")?.value || "";
    state.settings.studentModule      = $("#decl-module")?.value || "";
    state.settings.studentInstitution = $("#decl-institution")?.value || "";
    saveSettings();
  };
  ["decl-name","decl-module","decl-institution"].forEach(id => {
    $("#"+id)?.addEventListener("change", persistDeclFields);
  });

  let _decText = "";
  $("#generateDeclBtn")?.addEventListener("click", () => {
    persistDeclFields();
    _decText = buildAIDeclaration(e);
    // Render as escaped markdown so the user can see what will be exported.
    const html = `<pre class="decl-text">${escapeHtml(_decText)}</pre>`;
    setHTML($("#declPreview"), html);
    $("#downloadDeclBtn").disabled = false;
    $("#copyDeclBtn").disabled = false;
    toast("Declaration generated from integrity log.");
  });
  $("#downloadDeclBtn")?.addEventListener("click", () => {
    if (!_decText) return;
    const fn = (e.setup.title || "essay").replace(/[^\w-]/g,"_") + "_AI-declaration.md";
    downloadFile(_decText, fn, "text/markdown");
    logIntegrity("EXPORT_LOCAL", "AI Use Declaration");
  });
  $("#copyDeclBtn")?.addEventListener("click", async () => {
    if (!_decText) return;
    await navigator.clipboard.writeText(_decText);
    toast("Declaration copied to clipboard.");
  });

  // --- PHASE 3 — Integrity Detection ---
  $("#runDetectionBtn")?.addEventListener("click", async () => {
    const d = state.settings.detection || {};
    const provider = d.provider;
    const apiKey = d.key;
    const out = $("#detectionReport");
    const status = $("#detectionRunStatus");
    if (!provider) {
      out.innerHTML = `<p class="muted">No detection provider configured. Set one in Settings.</p>`;
      return;
    }
    if (!apiKey) { out.innerHTML = `<p class="muted">No API key for ${escapeHtml(provider)}. Set it in Settings.</p>`; return; }
    const text = (e.draft || "").trim();
    if (!text) { out.innerHTML = `<p class="muted">No draft to check.</p>`; return; }
    const def = window.Detection?.PROVIDERS?.[provider];
    if (!def) { out.innerHTML = `<p class="muted">Unknown provider.</p>`; return; }
    status.textContent = `Submitting to ${def.label}…`;
    out.innerHTML = "";
    try {
      const report = await def.run({ apiKey, text });
      e.detectionReport = { ts: Date.now(), provider, report };
      saveEssays();
      status.textContent = `Done.`;
      out.innerHTML = renderDetectionReport(report, def);
      logIntegrity("EXPORT_LOCAL", `Detection check via ${provider}`);
    } catch (err) {
      status.textContent = "";
      out.innerHTML = `<p class="status-line err">Detection failed: ${escapeHtml(err.message)}. Some providers reject browser-side calls (CORS); you may need a small proxy.</p>`;
    }
  });
}

function renderDetectionReport(r, def) {
  const ai = (r.overallAI * 100).toFixed(1);
  const sim = r.overallSimilarity != null ? (r.overallSimilarity * 100).toFixed(1) : null;
  const verdictColour = r.verdict === "ai" ? "lc-flag" : r.verdict === "mixed" ? "lc-warn" : "lc-info";
  const chunkRows = (r.perChunk || []).slice(0, 25).map((c, i) => {
    const pct = (c.aiScore * 100).toFixed(0);
    const sev = c.aiScore > 0.7 ? "lc-flag" : c.aiScore > 0.4 ? "lc-warn" : "lc-info";
    return `<tr><td>${i+1}</td><td>${c.start}–${c.end}</td><td><span class="${sev}" style="padding:2px 8px;border-radius:100px;">${pct}%</span></td></tr>`;
  }).join("");

  const sources = (r.matchedSources || []).map(s => `
    <li><a href="${escapeHtml(s.url)}" target="_blank">${escapeHtml(s.url)}</a> — ${(s.score*100).toFixed(0)}%${s.excerpt ? `<br/><code>${escapeHtml(s.excerpt.slice(0,200))}</code>` : ""}</li>
  `).join("");

  return `
    <div class="cost-summary">
      <div class="cost-big">${ai}%</div>
      <div class="cost-sub">AI-likelihood · ${def.label} · verdict: <span class="${verdictColour}" style="padding:3px 10px;border-radius:100px;font-weight:700;">${r.verdict.toUpperCase()}</span></div>
    </div>
    ${sim != null ? `
      <div class="cost-summary" style="background:var(--blue-50);border-color:var(--blue-100);">
        <div class="cost-big" style="color:var(--blue-500);">${sim}%</div>
        <div class="cost-sub">Similarity match (plagiarism)</div>
      </div>
    ` : ""}
    ${chunkRows ? `
      <h4 class="cost-h" style="margin-top:14px;">Per-chunk AI score</h4>
      <table class="rubric-table"><thead><tr><th>#</th><th>Range</th><th>AI score</th></tr></thead><tbody>${chunkRows}</tbody></table>
    ` : ""}
    ${sources ? `
      <h4 class="cost-h" style="margin-top:14px;">Matched sources</h4>
      <ul>${sources}</ul>
    ` : ""}
  `;
}

function buildFinalText(e) {
  const parts = [];
  const t = METHODOLOGY.essayTypes.find(x => x.id === e.essayType.chosen);
  parts.push("# " + (e.setup.title || "Untitled essay"));
  parts.push(`> ${t?.title || "Essay"} · ${e.setup.course || ""} · ${e.setup.citationStyle || ""} · ${new Date(e.updatedAt).toLocaleString()}`);
  parts.push("");
  if (e.setup.brief)    { parts.push("## Brief");     parts.push(e.setup.brief);                  parts.push(""); }
  const q = currentResearchQuestion(e);
  if (q)                { parts.push("## Research question"); parts.push(q);                     parts.push(""); }
  if (e.thesis.combined){ parts.push("## Thesis");    parts.push(e.thesis.combined);             parts.push(""); }
  if (e.draft)          { parts.push("## Draft");     parts.push(e.draft);                       parts.push(""); }
  if (e.outline?.text)  { parts.push("## Outline");   parts.push(e.outline.text);                parts.push(""); }
  if (e.sources?.length){
    parts.push("## Sources");
    e.sources.forEach(s => parts.push(`- ${s.title || ""} — ${s.authors || ""} (${s.year || "n.d."}). ${s.publication || ""} ${s.url || ""} — RADAR ${s.radarScore||0}/5`));
  }
  return parts.join("\n");
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/* ============== PERSIST CURRENT STEP ============== */
function persistCurrentStep(showToast) {
  const e = state.current; if (!e) return;
  const setIf = (el, fn) => { if (el) fn(el.value); };

  // sidebar title
  setIf($("#ws-essay-title"), v => e.setup.title = v);

  switch (state.currentStep) {
    case 0: // Setup
      setIf($("#set-title"),    v => e.setup.title = v);
      setIf($("#set-course"),   v => e.setup.course = v);
      setIf($("#set-degree"),   v => e.setup.degreeLevel = v);
      setIf($("#set-wordcount"),v => e.setup.wordCount = parseInt(v,10) || 0);
      setIf($("#set-deadline"), v => e.setup.deadline = v);
      setIf($("#set-citation"), v => e.setup.citationStyle = v);
      setIf($("#set-discipline"), v => e.setup.discipline = v);
      setIf($("#set-brief"),    v => e.setup.brief = v);
      setIf($("#set-idea"),     v => e.setup.initialIdea = v);
      break;
    case 1: // Brief
      setIf($("#brief-cmd"),       v => e.brief.commandWords    = v);
      setIf($("#brief-audience"),  v => e.brief.audience        = v);
      setIf($("#brief-scope"),     v => e.brief.scope           = v);
      setIf($("#brief-constraints"),v => e.brief.constraints    = v);
      setIf($("#brief-success"),   v => e.brief.successCriteria = v);
      setIf($("#brief-notes"),     v => e.brief.notes           = v);
      break;
    case 2: // Rubric
      setIf($("#rubric-paste"), v => e.rubric.paste = v);
      e.rubric.criteria = e.rubric.criteria || [];
      $$("[data-rcrit]").forEach(el => {
        const i = parseInt(el.dataset.i, 10);
        const field = el.dataset.rcrit;
        if (!e.rubric.criteria[i]) e.rubric.criteria[i] = { name:"", weight:0, descriptor:"" };
        e.rubric.criteria[i][field] = field === "weight" ? (parseInt(el.value,10)||0) : el.value;
      });
      computeRubricSum();
      break;
    case 3: // Research Questions
      $$(".rq-card").forEach(card => {
        const i = parseInt(card.dataset.rqi, 10);
        const q = e.questions.generated[i]; if (!q) return;
        const textEl = $('[data-rq="text"]', card);  if (textEl) q.text = textEl.value;
        const notesEl = $('[data-rq="notes"]', card); if (notesEl) q.notes = notesEl.value;
        q.scores = q.scores || {};
        $$("[data-rq-score]", card).forEach(s => { q.scores[s.dataset.rqScore] = parseInt(s.value,10)||0; });
      });
      setIf($("#custom-question"), v => e.questions.customQuestion = v);
      break;
    case 4: // Type — nothing to capture (buttons trigger persistence)
      break;
    case 5: // Sources
      e.sources = $$("#sourceList [data-source-row]").map(row => ({
        title:      ($(`[data-src="title"]`,      row) || {}).value || "",
        authors:    ($(`[data-src="authors"]`,    row) || {}).value || "",
        year:       ($(`[data-src="year"]`,       row) || {}).value || "",
        publication:($(`[data-src="publication"]`,row) || {}).value || "",
        url:        ($(`[data-src="url"]`,        row) || {}).value || "",
        type:       ($(`[data-src="type"]`,       row) || {}).value || "",
        argument:   ($(`[data-src="argument"]`,   row) || {}).value || "",
        radarScore: parseInt(($(`[data-src="radarScore"]`, row) || {}).value || "0", 10),
        notes:      ($(`[data-src="notes"]`,      row) || {}).value || ""
      }));
      break;
    case 6: // Thesis
      setIf($("#thesis-topic"),     v => e.thesis.topic = v);
      setIf($("#thesis-position"),  v => e.thesis.position = v);
      setIf($("#thesis-rationale"), v => e.thesis.rationale = v);
      setIf($("#thesis-combined"),  v => e.thesis.combined = v);
      setIf($("#thesis-claims"),    v => e.thesis.supportingClaims = v);
      setIf($("#thesis-counter"),   v => e.thesis.counterargument = v);
      setIf($("#thesis-motive"),    v => e.thesis.motive = v);
      break;
    case 7: // Outline
      e.outline.allocation = e.outline.allocation || { intro:10, body1:25, body2:25, body3:25, counter:10, conclusion:5 };
      e.outline.sectionsByKey = e.outline.sectionsByKey || {};
      $$("[data-alloc]").forEach(el => { e.outline.allocation[el.dataset.alloc] = parseFloat(el.value) || 0; });
      $$("[data-section-key]").forEach(el => { e.outline.sectionsByKey[el.dataset.sectionKey] = el.value; });
      setIf($("#f-outline"), v => e.outline.text = v);
      computeAllocSum();
      break;
    case 8: // Writing
      $$("[data-pidx]").forEach(box => {
        const idx = parseInt(box.dataset.pidx, 10);
        const p = e.paragraphs[idx]; if (!p) return;
        ["point","evidence","warrant","explanation","link"].forEach(k => {
          const el = $(`[data-peel="${k}"]`, box);
          if (el) p[k] = el.value;
        });
      });
      setIf($("#f-draft"), v => e.draft = v);
      break;
    case 9: // Polishing
      setIf($("#f-notes"), v => e.notes = v);
      e.checklist = e.checklist || {};
      $$("#stage input[type=checkbox][data-check]").forEach(cb => { e.checklist[cb.dataset.check] = cb.checked; });
      $$("[data-rubric-met]").forEach(cb => {
        const i = parseInt(cb.dataset.rubricMet, 10);
        if (e.rubric.criteria[i]) e.rubric.criteria[i].met = cb.checked;
      });
      $$("[data-rubric-note]").forEach(el => {
        const i = parseInt(el.dataset.rubricNote, 10);
        if (e.rubric.criteria[i]) e.rubric.criteria[i].selfNote = el.value;
      });
      break;
    case 10: // Final
      break;
  }

  e.updatedAt = Date.now();
  saveEssays();
  if (showToast) toast("Saved.");
}

/* ============== LIBRARY ============== */
function renderLibrary() {
  const list = $("#libraryList");

  const localHtml = (() => {
    if (!state.essays.length) {
      return '<p class="muted">No essays yet. Start one from the Home tab.</p>';
    }
    const sorted = state.essays.slice().sort((a,b)=>b.updatedAt-a.updatedAt);
    return sorted.map(e => {
      ensureEssayShape(e);
      const t = METHODOLOGY.essayTypes.find(x => x.id === e.essayType.chosen);
      const syncBadge = e.notionPageId
        ? `<span class="sync-badge ok" title="Linked to Notion">⟲ synced</span>`
        : `<span class="sync-badge off" title="Local-only">⌂ local</span>`;
      return `
        <div class="library-item">
          <div class="row" style="justify-content: space-between; margin-top: 0;">
            <span class="badge">${escapeHtml(t?.title || "Type TBD")}</span>
            ${syncBadge}
          </div>
          <h4>${escapeHtml(e.setup.title || "Untitled")}</h4>
          <div class="meta">Updated ${escapeHtml(fmtDate(e.updatedAt))} · Step ${(e.step||0)+1}/${METHODOLOGY.steps.length}</div>
          <p class="muted small">${escapeHtml((e.thesis.combined || currentResearchQuestion(e) || e.setup.brief || "").slice(0, 140))}</p>
          <div class="row">
            <button class="btn btn-primary btn-sm" data-open="${escapeHtml(e.id)}">Open</button>
            <button class="btn btn-ghost btn-sm" data-delete="${escapeHtml(e.id)}">Delete</button>
          </div>
        </div>
      `;
    }).join("");
  })();

  // PHASE 5.4 — Notion library section: shows essays in Notion that are
  // not yet in localStorage, so a student switching devices can pull them
  // down. Only shown when the workspace is bootstrapped.
  const s = state.settings;
  const dbId = s.notion?.workspace?.databases?.essays;
  const notionSection = dbId
    ? `
        <div style="margin-top: 32px;">
          <h3 class="section-title" style="font-size:1.1rem;">From Notion</h3>
          <p class="muted small">Essays you have in your Notion <b>Essay Library</b> database. Pull any one down to edit it in the app.</p>
          <div class="row">
            <button class="btn btn-primary btn-sm" id="refreshNotionLibBtn">⟲ Refresh from Notion</button>
            <span id="notionLibStatus" class="muted small"></span>
          </div>
          <div id="notionLibList" class="library-list" style="margin-top: 14px;"></div>
        </div>
      `
    : "";

  setHTML(list, localHtml + notionSection);

  $$("[data-open]", list).forEach(b => b.addEventListener("click", () => openEssay(b.dataset.open)));
  $$("[data-delete]", list).forEach(b => b.addEventListener("click", () => {
    if (!confirm("Delete this essay locally? It will remain in Notion if synced.")) return;
    state.essays = state.essays.filter(x => x.id !== b.dataset.delete);
    saveEssays(); renderLibrary();
  }));

  $("#refreshNotionLibBtn")?.addEventListener("click", async () => {
    const status = $("#notionLibStatus");
    const out = $("#notionLibList");
    status.textContent = "Loading from Notion…";
    out.innerHTML = "";
    try {
      const items = await NotionSync.listLibrary({
        token: s.notion.token,
        essayLibraryDbId: dbId
      });
      const localPageIds = new Set(state.essays.map(e => e.notionPageId).filter(Boolean));
      const remoteOnly = items.filter(it => !localPageIds.has(it.pageId));
      status.textContent = `${items.length} essay${items.length===1?"":"s"} in Notion · ${remoteOnly.length} not yet in this browser.`;
      out.innerHTML = remoteOnly.map((it, i) => `
        <div class="library-item">
          <span class="sync-badge ok">⟲ in Notion only</span>
          <h4>${escapeHtml(it.title)}</h4>
          <div class="meta">Last edited ${escapeHtml(new Date(it.lastEditedAt).toLocaleDateString())}</div>
          <div class="row">
            <button class="btn btn-primary btn-sm" data-pull-idx="${i}">⤵ Pull into app</button>
            <a class="btn btn-ghost btn-sm" href="${escapeHtml(it.url)}" target="_blank" rel="noopener">↗ Open in Notion</a>
          </div>
        </div>
      `).join("") || `<p class="muted small">All Notion essays are already in this browser.</p>`;

      $$("#notionLibList [data-pull-idx]").forEach(btn => btn.addEventListener("click", async () => {
        const idx = parseInt(btn.dataset.pullIdx, 10);
        const it = remoteOnly[idx];
        btn.disabled = true; btn.textContent = "Pulling…";
        try {
          const essay = await NotionSync.pull({ token: s.notion.token, pageId: it.pageId });
          // Ensure local id; keep the Notion page binding.
          if (!essay.id) essay.id = uid();
          state.essays.push(essay);
          saveEssays();
          toast("Pulled into app — open it from the local list above.");
          renderLibrary();
        } catch (err) {
          btn.disabled = false; btn.textContent = "⤵ Pull into app";
          status.textContent = "Pull failed: " + err.message;
        }
      }));
    } catch (err) {
      status.textContent = "Couldn't list Notion library: " + err.message;
    }
  });
}

/* ============== INFOGRAPHIC GALLERY ============== */
const INFOGRAPHICS = [
  {
    id: "master-flowchart",
    title: "Master Flowchart",
    sub: "The five-step writing process — Prewriting → Planning → Writing → Polishing → Submitting",
    src: "assets/infographics/master-flowchart.jpg"
  },
  {
    id: "radar",
    title: "RADAR — Source Filter",
    sub: "Relevance · Authority · Date · Appearance · Reason for writing — five gates every source must pass",
    src: "assets/infographics/radar.jpg"
  },
  {
    id: "thesis-formula",
    title: "Thesis Formula",
    sub: "Topic + Position + Rationale = a strong, arguable thesis — with worked example",
    src: "assets/infographics/thesis-formula.jpg"
  },
  // The four below are page-renders from the curriculum PDFs used as
  // placeholders while NotebookLM regenerates polished versions.
  {
    id: "peel",
    title: "PEEL Paragraph",
    sub: "Point · Evidence · Explanation · Link — the building block of every essay paragraph (Ch.2)",
    src: "assets/infographics/peel.jpg"
  },
  {
    id: "they-say",
    title: "They Say / I Say",
    sub: "Sentence templates for entering the academic conversation: introducing opposing views and refuting them (Ch.18)",
    src: "assets/infographics/they-say.jpg"
  },
  {
    id: "comparative",
    title: "Comparative Essay",
    sub: "Visual model: 'Same — Why?' / 'Different — Why?' — and the Block vs Point-by-Point structures (Ch.9)",
    src: "assets/infographics/comparative.jpg"
  },
  {
    id: "analysis-ladder",
    title: "Analysis Ladder",
    sub: "Three rungs: Describe (What?) → Analyse (How?) → Interpret (So What?) — the climb from summary to insight (Ch.10)",
    src: "assets/infographics/analysis-ladder.jpg"
  }
];

function renderInfographicGrid() {
  const host = $("#infographicGrid");
  if (!host) return;
  const html = INFOGRAPHICS.map(g => `
    <div class="ig-card" data-ig="${escapeHtml(g.id)}">
      <img src="${escapeHtml(g.src)}" alt="${escapeHtml(g.title)}" loading="lazy"/>
      <div class="ig-meta">
        <h4>${escapeHtml(g.title)}</h4>
        <p>${escapeHtml(g.sub)}</p>
      </div>
    </div>
  `).join("");
  setHTML(host, html || `<p class="muted">Infographics are generating — they will appear here automatically once ready.</p>`);

  $$("#infographicGrid .ig-card").forEach(c => c.addEventListener("click", () => {
    const g = INFOGRAPHICS.find(x => x.id === c.dataset.ig);
    if (!g) return;
    // Open the image fullscreen via native API; fallback to opening in a new tab.
    const img = c.querySelector("img");
    enterFullscreen(img, g.src);
  }));
}
function hideLightbox() { closeModalEl("lightbox"); }

/* ============== CURRICULUM ============== */
function renderCurriculum() {
  // The infographic gallery used to live here. Per spec, each diagram now
  // appears inside its chapter's detail modal instead (see openChapterModal).
  // Prefer rich content from chapters.js; fall back to the short methodology list.
  const source = (typeof CHAPTERS !== "undefined" && CHAPTERS && CHAPTERS.length)
    ? CHAPTERS
    : METHODOLOGY.curriculum;

  const html = source.map(c => `
    <div class="chap-card" data-chapter="${escapeHtml(c.n)}" role="button" tabindex="0">
      <div class="ch-num">${escapeHtml(c.part)}</div>
      <h4>Ch. ${escapeHtml(c.n)} · ${escapeHtml(c.title)}</h4>
      <div class="ch-tool">${escapeHtml(c.tool)}</div>
      ${c.goal ? `<p class="ch-goal">${escapeHtml(c.goal)}</p>` : ""}
      <div class="ch-foot"><span class="ch-link">Read full chapter →</span></div>
    </div>
  `).join("");
  setHTML($("#curriculumList"), html);

  $$("#curriculumList .chap-card").forEach(card => {
    card.addEventListener("click", () => openChapterModal(parseInt(card.dataset.chapter, 10)));
    card.addEventListener("keydown", ev => {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openChapterModal(parseInt(card.dataset.chapter, 10)); }
    });
  });
}

/* Render the raw chapter text into HTML.
 * - Lines matching "Chapter N: Title" → h2
 * - Lines matching "Part N: …" or "Lesson N.N: …" → h3
 * - Lines that are entirely uppercase or end with ":" and ≤80 chars → h4
 * - Lines starting with "- " or "• " or "* " → bullet list
 * - Numbered lines (1. … 2. …) → ordered list
 * - Blank line separates paragraphs.
 *
 * The input is preserved verbatim — we only add markup, never alter words.
 */
function renderChapterText(text) {
  if (!text) return "";
  const lines = text.split("\n");
  const out = [];
  let inUL = false, inOL = false, paraBuf = [];

  const flushPara = () => {
    if (paraBuf.length) { out.push(`<p>${paraBuf.map(escapeHtml).join("<br/>")}</p>`); paraBuf = []; }
  };
  const closeLists = () => {
    if (inUL) { out.push("</ul>"); inUL = false; }
    if (inOL) { out.push("</ol>"); inOL = false; }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) { flushPara(); closeLists(); continue; }

    // Chapter title
    if (/^Chapter\s+\d+[:\.]/i.test(line)) {
      flushPara(); closeLists();
      out.push(`<h2 class="ch-h2">${escapeHtml(line)}</h2>`);
      continue;
    }
    // Lesson / Part heading
    if (/^(Lesson|Part)\s+\d+(\.\d+)?[:\.]/i.test(line)) {
      flushPara(); closeLists();
      out.push(`<h3 class="ch-h3">${escapeHtml(line)}</h3>`);
      continue;
    }
    // Bullet
    if (/^[-•*]\s+/.test(line)) {
      flushPara();
      if (inOL) { out.push("</ol>"); inOL = false; }
      if (!inUL) { out.push("<ul>"); inUL = true; }
      out.push(`<li>${escapeHtml(line.replace(/^[-•*]\s+/, ""))}</li>`);
      continue;
    }
    // Numbered list (1. ..., 1) ...)
    if (/^\d+[\.\)]\s+/.test(line)) {
      flushPara();
      if (inUL) { out.push("</ul>"); inUL = false; }
      if (!inOL) { out.push("<ol>"); inOL = true; }
      out.push(`<li>${escapeHtml(line.replace(/^\d+[\.\)]\s+/, ""))}</li>`);
      continue;
    }
    // Short title-like line (ends with colon + short, or fully bold-looking)
    if (line.length <= 90 && /[:：]$/.test(line)) {
      flushPara(); closeLists();
      out.push(`<h4 class="ch-h4">${escapeHtml(line)}</h4>`);
      continue;
    }
    // Default — accumulate as paragraph
    if (inUL || inOL) closeLists();
    paraBuf.push(line);
  }
  flushPara(); closeLists();
  return out.join("\n");
}

function openChapterModal(n) {
  if (typeof CHAPTERS === "undefined") return;
  const c = CHAPTERS.find(x => x.n === n);
  if (!c) return;
  const fw = c.framework || {};
  const pdfFile = `assets/chapter-pdfs/ch${String(c.n).padStart(2, "0")}.pdf`;
  const safeTitle = (c.title || "chapter").replace(/[^\w]+/g, "-").toLowerCase();
  const html = `
    <div class="chap-modal">
      <div class="ch-num">${escapeHtml(c.part)}</div>
      <h2>Chapter ${escapeHtml(c.n)} — ${escapeHtml(c.title)}</h2>
      ${c.chineseAnnotation ? `<p class="ch-cn">${escapeHtml(c.chineseAnnotation)}</p>` : ""}

      <div class="ch-toolbar">
        <a class="btn btn-primary btn-sm" href="${escapeHtml(pdfFile)}" target="_blank" rel="noopener">📖 Open PDF in new tab</a>
        <a class="btn btn-ghost btn-sm" href="${escapeHtml(pdfFile)}" download="ch${String(c.n).padStart(2,"0")}-${escapeHtml(safeTitle)}.pdf">⬇ Download chapter PDF</a>
      </div>

      <div class="ch-section ch-pdf-section">
        <h3>Full chapter — original PDF</h3>
        <p class="muted small">Complete chapter from the curriculum book, with all diagrams, tables, and bilingual annotations. Use the toolbar above if the embedded viewer fails to load.</p>
        <iframe class="ch-pdf-frame" src="${escapeHtml(pdfFile)}#zoom=page-width" title="Chapter ${escapeHtml(c.n)} PDF"></iframe>
      </div>

      <details class="ch-tldr">
        <summary>Quick summary — goal, key concepts, framework, homework</summary>

      <div class="ch-section">
        <h3>Goal of this chapter</h3>
        <p class="ch-goal-big">${escapeHtml(c.goal || "")}</p>
      </div>

      <div class="ch-section">
        <h3>Key concepts</h3>
        <ul class="ch-bullets">
          ${(c.keyConcepts || []).map(k => `<li>${escapeHtml(k)}</li>`).join("")}
        </ul>
      </div>

      <div class="ch-section">
        <h3>Framework — ${escapeHtml(fw.name || c.tool || "")}</h3>
        <p class="muted">${escapeHtml(fw.description || "")}</p>
        ${(() => {
          const ig = (c.infographic && typeof INFOGRAPHICS !== "undefined")
            ? INFOGRAPHICS.find(x => x.id === c.infographic)
            : null;
          return ig
            ? `<figure class="ch-figure">
                 <img src="${escapeHtml(ig.src)}" alt="${escapeHtml(ig.title)}" loading="lazy" data-ig-id="${escapeHtml(ig.id)}"/>
                 <figcaption>${escapeHtml(ig.title)} — click to enlarge</figcaption>
               </figure>`
            : "";
        })()}
        <ol class="ch-steps">
          ${(fw.steps || []).map(s => `<li>${escapeHtml(s)}</li>`).join("")}
        </ol>
      </div>

      <div class="ch-section">
        <h3>Worked example</h3>
        <pre class="ch-example">${escapeHtml(c.workedExample || "")}</pre>
      </div>

      <div class="ch-section">
        <h3>Apply it now</h3>
        <p>${escapeHtml(c.apply || "")}</p>
      </div>

      <div class="ch-section">
        <h3>Homework</h3>
        <p class="muted">${escapeHtml(c.homework || "")}</p>
      </div>

      </details>

      ${(() => {
        const full = (typeof CHAPTER_FULL_TEXT !== "undefined")
          ? (CHAPTER_FULL_TEXT[c.n] || CHAPTER_FULL_TEXT[String(c.n)])
          : null;
        if (!full) return "";
        return `
          <details class="ch-tldr">
            <summary>Plain-text view (extracted from the PDF — for search, copy, screen readers)</summary>
            <div class="ch-section ch-full">
              <p class="muted small">${full.length.toLocaleString()} characters · extracted verbatim from the source PDF. The embedded PDF above is the authoritative version.</p>
              <div class="ch-full-text">${renderChapterText(full)}</div>
            </div>
          </details>
        `;
      })()}
    </div>
  `;
  setHTML($("#chapterModalBody"), html);
  openModalEl("chapterModal");
  // Reset scroll position so each opened chapter starts from the top.
  const card = $("#chapterModal .modal-card");
  if (card) card.scrollTop = 0;

  // Wire the in-chapter figure to the lightbox so the diagram can be enlarged.
  $$("#chapterModalBody .ch-figure img").forEach(img => {
    img.addEventListener("click", () => {
      const g = (typeof INFOGRAPHICS !== "undefined")
        ? INFOGRAPHICS.find(x => x.id === img.dataset.igId) : null;
      enterFullscreen(img, g ? g.src : img.src);
    });
  });
}
function hideChapterModal() { closeModalEl("chapterModal"); }

/* ============== EXAMPLES (per academic level) ============== */
let _currentLevel = null;

function renderExamples() {
  if (typeof SAMPLE_ESSAYS === "undefined") {
    setHTML($("#levelTabs"), `<p class="muted">Examples library not loaded.</p>`);
    return;
  }
  // Seed from the active essay's level ONLY on first entry — otherwise honour
  // the user's tab click. (Earlier bug: this ran on every render and snapped
  // the selection back to the active essay's level, making other tabs no-op.)
  if (_currentLevel === null) {
    if (state.current && state.current.setup && state.current.setup.degreeLevel) {
      _currentLevel = state.current.setup.degreeLevel;
    } else {
      _currentLevel = "foundation";
    }
  }
  if (!SAMPLE_ESSAYS[_currentLevel]) _currentLevel = "foundation";

  const tabsHtml = METHODOLOGY.degreeLevels.map(d => `
    <button class="level-tab ${d.id===_currentLevel?"active":""}" data-level="${escapeHtml(d.id)}">${escapeHtml(d.label)}</button>
  `).join("");
  setHTML($("#levelTabs"), tabsHtml);
  $$("#levelTabs .level-tab").forEach(b => b.addEventListener("click", () => {
    _currentLevel = b.dataset.level;
    renderExamples();
  }));

  const ex = SAMPLE_ESSAYS[_currentLevel];
  if (!ex) { setHTML($("#examplePanel"), `<p class="muted">No example available at this level yet.</p>`); return; }
  setHTML($("#examplePanel"), exampleHtml(ex));
}

function exampleHtml(ex) {
  const sectionsHtml = (ex.sections || []).map(s => `
    <div class="ex-section">
      <h4>${escapeHtml(s.name)}</h4>
      <div class="ex-body">${escapeHtml(s.body).split("\n").map(line => `<p>${line.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</p>`).join("")}</div>
    </div>
  `).join("");

  const walkHtml = (ex.walkthrough || []).map(w => `
    <li><b>${escapeHtml(w.step)}.</b> ${escapeHtml(w.note)}</li>
  `).join("");

  const refsHtml = (ex.references || []).map(r => `<li>${escapeHtml(r)}</li>`).join("");

  return `
    <div class="ex-meta">
      <span class="badge">${escapeHtml(ex.essayType)}</span>
      <span class="muted">${escapeHtml(ex.wordCount)} words · ${escapeHtml(ex.citationStyle)}</span>
    </div>
    <h2 class="ex-title">${escapeHtml(ex.title)}</h2>

    <div class="panel">
      <h3>Brief</h3>
      <p class="muted">${escapeHtml(ex.brief)}</p>
    </div>

    <div class="panel">
      <h3>Decoded brief</h3>
      <ul class="ch-bullets">
        <li><b>Command words:</b> ${escapeHtml(ex.decoded.commandWords)}</li>
        <li><b>Audience:</b> ${escapeHtml(ex.decoded.audience)}</li>
        <li><b>Scope:</b> ${escapeHtml(ex.decoded.scope)}</li>
        <li><b>Constraints:</b> ${escapeHtml(ex.decoded.constraints)}</li>
        <li><b>Success criteria:</b> ${escapeHtml(ex.decoded.success)}</li>
      </ul>
    </div>

    <div class="panel">
      <h3>Research question</h3>
      <blockquote class="rq-display">${escapeHtml(ex.researchQuestion)}</blockquote>
    </div>

    <div class="panel">
      <h3>Thesis</h3>
      <p class="ex-thesis">${escapeHtml(ex.thesis)}</p>
    </div>

    <div class="panel">
      <h3>Full essay walkthrough</h3>
      ${sectionsHtml}
    </div>

    ${refsHtml ? `<div class="panel"><h3>References</h3><ol class="ch-bullets">${refsHtml}</ol></div>` : ""}

    <div class="panel">
      <h3>How the app's steps produced this essay</h3>
      <ul class="ch-bullets">${walkHtml}</ul>
    </div>
  `;
}

/* ============== SETTINGS ============== */
/* Banner in the Settings → Notion card that mirrors the setup wizard's
 * proxy auto-detection. Goes green when /api/notion/health responds,
 * stays violet if the user has pasted an external proxy URL, goes red
 * if neither is available. */
function updateSettingsNotionProxyBanner() {
  const banner = $("#settings-notion-proxy-banner");
  if (!banner) return;
  const sameOrigin = window._NOTION_SAMEORIGIN_OK === true;
  const external   = !!(state.settings.notion?.proxyUrl);
  if (sameOrigin && !external) {
    banner.innerHTML = "✓ <b>Built-in proxy active</b> at <code>/api/notion</code>. No configuration needed.";
    banner.style.background = "var(--emerald-50)";
    banner.style.borderLeftColor = "var(--emerald-500)";
    banner.style.color = "var(--emerald-500)";
  } else if (external) {
    banner.innerHTML = `Using your external proxy: <code>${escapeHtml(state.settings.notion.proxyUrl)}</code>`;
    banner.style.background = "var(--violet-50)";
    banner.style.borderLeftColor = "var(--violet-500)";
    banner.style.color = "var(--slate-700)";
  } else if (sameOrigin === undefined) {
    banner.textContent = "Checking connection method…";
    banner.style.background = "var(--slate-50)";
    banner.style.borderLeftColor = "var(--violet-500)";
    banner.style.color = "var(--slate-500)";
  } else {
    banner.innerHTML = "No proxy available. The built-in proxy needs the app to be hosted on Netlify (or you can paste an external proxy URL in Advanced below).";
    banner.style.background = "var(--red-50)";
    banner.style.borderLeftColor = "var(--red-500)";
    banner.style.color = "var(--red-600)";
  }
}

function renderSettings() {
  $("#set-provider").value = state.settings.provider;
  populateModels();
  $("#key-anthropic").value = state.settings.keys.anthropic || "";
  $("#key-openai").value    = state.settings.keys.openai    || "";
  $("#key-gemini").value    = state.settings.keys.gemini    || "";
  if ($("#key-deepseek"))   $("#key-deepseek").value   = state.settings.keys.deepseek || "";
  if ($("#key-kimi"))       $("#key-kimi").value       = state.settings.keys.kimi     || "";
  if ($("#key-custom"))     $("#key-custom").value     = state.settings.keys.custom   || "";
  if ($("#kimi-base-url"))  $("#kimi-base-url").value  = state.settings.kimiBaseUrl   || "";
  if ($("#custom-base-url"))$("#custom-base-url").value= (state.settings.custom && state.settings.custom.baseUrl) || "";
  if ($("#custom-model"))   $("#custom-model").value   = (state.settings.custom && state.settings.custom.model)   || "";
  $("#notion-token").value  = state.settings.notion.token   || "";
  $("#notion-parent").value = state.settings.notion.parent  || "";
  if ($("#notion-proxy")) $("#notion-proxy").value = state.settings.notion.proxyUrl || "";
  updateSettingsNotionProxyBanner();
  // Same-origin probe is async — re-run on a short delay to reflect the result.
  setTimeout(updateSettingsNotionProxyBanner, 600);
  setTimeout(updateSettingsNotionProxyBanner, 1800);
  toggleProviderRows();

  // PHASE 4 cost-saving toggles
  $("#set-routing") && ($("#set-routing").checked = state.settings.routing       !== false);
  $("#set-caching") && ($("#set-caching").checked = state.settings.promptCaching !== false);
  $("#set-trim")    && ($("#set-trim").checked    = state.settings.trimHistory   !== false);

  // PHASE 3 — detection provider + key
  const dp = $("#set-detect-provider");
  const dk = $("#set-detect-key");
  if (dp && dk) {
    dp.value = (state.settings.detection?.provider) || "";
    dk.value = (state.settings.detection?.key)      || "";
    const def = (window.Detection?.PROVIDERS || {})[dp.value];
    if ($("#detectProviderHint")) {
      $("#detectProviderHint").textContent = def
        ? `${def.label} — ${def.keyLabel}. Docs: ${def.docsUrl}`
        : "Pick a provider above to see the key format and docs link.";
    }
  }
}

function populateModels() {
  const provider = $("#set-provider").value;
  const sel = $("#set-model");
  if (!sel) return;

  if (provider === "custom") {
    // No built-in models — the user types the model name in #custom-model.
    // Disable the routine-model dropdown to make it clear this is overridden.
    const m = (state.settings.custom && state.settings.custom.model) || "";
    setHTML(sel, `<option value="${escapeHtml(m)}">${escapeHtml(m || "(set the model name in the Custom row below)")}</option>`);
    sel.disabled = true;
    // Same treatment for the premium picker.
    const psel = $("#set-premium-model");
    if (psel) {
      setHTML(psel, `<option value="${escapeHtml(m)}">${escapeHtml(m || "(custom — same as routine)")}</option>`);
      psel.disabled = true;
    }
    return;
  }

  sel.disabled = false;
  const list = AI_MODELS[provider] || [];
  setHTML(sel, list.map(m => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.label)}</option>`).join(""));
  sel.value = state.settings.model[provider] || list[0]?.id || "";

  const psel = $("#set-premium-model");
  if (psel) {
    psel.disabled = false;
    setHTML(psel, list.map(m => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.label)}</option>`).join(""));
    psel.value = (state.settings.premiumModel && state.settings.premiumModel[provider])
                 || (window.TIER_MODEL?.[provider]?.PREMIUM)
                 || list[0]?.id || "";
  }
}

function toggleProviderRows() {
  const provider = $("#set-provider").value;
  $$(".api-key-row").forEach(r => r.classList.toggle("active", r.dataset.provider === provider));
}

/* ============== COACH ============== */
function openCoach() {
  const ws = $(".workspace");
  if (ws) { ws.classList.remove("no-coach"); ws.classList.add("coach-open"); }
  renderCoachMeta();
}
function closeCoach() {
  const ws = $(".workspace");
  if (ws) { ws.classList.add("no-coach"); ws.classList.remove("coach-open"); }
}

function renderCoachMeta() {
  const s = state.settings;
  const warn = s.keys[s.provider] ? "" : '<br/><span style="color:var(--danger);">No API key set — open Settings.</span>';
  setHTML($("#coachMeta"), `Provider: <b>${escapeHtml(s.provider)}</b> · Model: <b>${escapeHtml(s.model[s.provider])}</b>${warn}`);
}

function renderCoachMessages() {
  const html = state.coachMessages.map(m => `<div class="msg ${escapeHtml(m.role)}">${escapeHtml(m.content)}</div>`).join("");
  const wrap = $("#coachMessages");
  setHTML(wrap, html);
  wrap.scrollTop = wrap.scrollHeight;
}

async function sendCoachMessage() {
  const inputEl = $("#coachInput");
  const text = (inputEl.value || "").trim();
  if (!text) return;

  const s = state.settings;
  if (!s.keys[s.provider]) {
    toast("Add an API key in Settings first.");
    switchView("settings"); return;
  }

  state.coachMessages.push({ role: "user", content: text });
  renderCoachMessages();
  inputEl.value = "";
  state.coachMessages.push({ role: "assistant", content: "…thinking…" });
  renderCoachMessages();

  const e = state.current;
  const discMeta = (typeof DISCIPLINES !== "undefined" && DISCIPLINES.find(d => d.id === e?.setup?.discipline)) || null;
  const context = e ? `
Active essay context:
- Title: ${e.setup.title}
- Course: ${e.setup.course}
- Degree level: ${e.setup.degreeLevel}
- Discipline: ${e.setup.discipline || "(unset)"}${discMeta ? ` — ${discMeta.hint}` : ""}
- Word count target: ${e.setup.wordCount}
- Citation style: ${e.setup.citationStyle}
- Brief: ${e.setup.brief || "(none)"}
- Decoded brief — command words: ${e.brief.commandWords}; audience: ${e.brief.audience}; scope: ${e.brief.scope}; constraints: ${e.brief.constraints}; success criteria: ${e.brief.successCriteria}
- Rubric criteria: ${(e.rubric.criteria || []).map(c => `${c.name} (${c.weight}%)`).join(", ") || "(none)"}
- Research question: ${currentResearchQuestion(e) || "(none)"}
- Essay type (chosen): ${e.essayType.chosen || "(not yet)"}
- Thesis: ${e.thesis.combined || "(none)"}
- Current step: ${METHODOLOGY.steps[state.currentStep].title}
- Draft length: ${(e.draft||"").length} chars
` : "";

  const system = METHODOLOGY.coachSystem + "\n\n" + context;

  try {
    // PHASE 4.4 — Trim conversation history before sending.
    let outgoing = state.coachMessages
      .filter(m => m.content !== "…thinking…")
      .map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
    if (s.trimHistory !== false && typeof trimHistory === "function") {
      outgoing = trimHistory(outgoing, s.historyKeep || 6);
    }

    const result = await AI.chat({
      provider: s.provider,
      model:    pickModel("COACH_CHAT"),
      task:     "COACH_CHAT",
      apiKey:   s.keys[s.provider],
      cacheable: s.promptCaching !== false,
      system,
      messages: outgoing
    });
    recordAIUsage({ task: "COACH_CHAT", model: result.model, usage: result.usage, cost: result.cost });
    state.coachMessages.pop();
    state.coachMessages.push({ role: "assistant", content: result.text });
    if (e) { e.coach = state.coachMessages; saveEssays(); }
    logIntegrity("COACH_CALL", METHODOLOGY.steps[state.currentStep].title);
    renderCoachMessages();
  } catch (err) {
    state.coachMessages.pop();
    state.coachMessages.push({ role: "error", content: "Coach error: " + err.message });
    renderCoachMessages();
  }
}

/* ============== NOTION PUSH ============== */
async function pushToNotion() {
  const e = state.current; if (!e) return;
  persistCurrentStep();
  const token  = state.settings.notion.token;
  const override = ($("#notion-parent-override") || {}).value || "";
  const parent = (override || state.settings.notion.parent || "").trim();
  const statusEl = $("#notionPushStatus");

  if (!token)  { statusEl.className = "status-line err"; statusEl.textContent = "No Notion token set. Open Settings."; return; }
  if (!parent) { statusEl.className = "status-line err"; statusEl.textContent = "No parent page ID set."; return; }

  statusEl.className = "status-line"; statusEl.textContent = "Pushing…";
  try {
    const notionEssay = {
      title: e.setup.title || "Untitled",
      essayType: METHODOLOGY.essayTypes.find(t=>t.id===e.essayType.chosen)?.title || "Essay",
      updatedAt: e.updatedAt,
      prompt: e.setup.brief,
      thesis: e.thesis.combined,
      draft:  e.draft,
      outline:(e.outline && e.outline.text) || "",
      sources:e.sources
    };
    const page = await Notion.pushEssay({ token, parentPageId: parent, essay: notionEssay });
    logIntegrity("EXPORT_NOTION", page.url || "");
    statusEl.className = "status-line ok";
    setHTML(statusEl, `Pushed to Notion ✓ <a href="${escapeHtml(page.url)}" target="_blank">Open in Notion →</a>`);
  } catch (err) {
    statusEl.className = "status-line err";
    statusEl.textContent = "Failed: " + err.message;
  }
}

/* ============== FLOWCHART MODAL ============== */
function showFlowchartModal() {
  $("#asciiFlow").textContent = METHODOLOGY.masterFlow.asciiArt;
  openModalEl("flowModal");
  // Reset scroll inside the modal card.
  const card = $("#flowModal .modal-card");
  if (card) card.scrollTop = 0;
}
function hideFlowchartModal() { closeModalEl("flowModal"); }

/* ============== BIND GLOBAL ============== */
function bindGlobal() {
  $$(".nav-btn").forEach(b => b.addEventListener("click", () => switchView(b.dataset.view)));
  $("#navHome").addEventListener("click", () => switchView("home"));

  const startBtn = $("#startBtn");
  if (startBtn) startBtn.addEventListener("click", startNewEssay);
  const seeFlow = $("#seeFlowBtn");
  if (seeFlow) seeFlow.addEventListener("click", showFlowchartModal);

  // Click the flowchart image → native fullscreen.
  const flowImg = $("#flowImg");
  if (flowImg) flowImg.addEventListener("click", () => enterFullscreen(flowImg, flowImg.src));
  document.addEventListener("click", ev => {
    if (ev.target.matches("[data-close]") || (ev.target.classList.contains("modal") && ev.target.id === "flowModal")) hideFlowchartModal();
    if (ev.target.matches("[data-close]") || (ev.target.classList.contains("modal") && ev.target.id === "chapterModal")) hideChapterModal();
    if (ev.target.matches("[data-close]") || (ev.target.classList.contains("modal") && ev.target.id === "lightbox")) hideLightbox();
  });

  $("#backHomeBtn")?.addEventListener("click", () => switchView("home"));
  $("#saveBtn")?.addEventListener("click", () => persistCurrentStep(true));
  $("#aiCoachBtn")?.addEventListener("click", openCoach);
  $("#closeCoachBtn")?.addEventListener("click", closeCoach);

  // PHASE 5.2 — Sync controls (Push / Pull / Open)
  $("#syncPushBtn")?.addEventListener("click", async () => {
    const e = state.current;
    if (!e) return;
    const s = state.settings;
    const dbId = s.notion?.workspace?.databases?.essays;
    const detail = $("#syncDetail");
    if (!dbId) { detail.textContent = "Bootstrap the workspace in Settings first."; return; }

    detail.textContent = "Pushing…";
    persistCurrentStep(false);  // make sure latest box values are saved before push
    try {
      const meta = await NotionSync.push({
        token: s.notion.token,
        essayLibraryDbId: dbId,
        essay: e,
        onProgress: (msg) => { detail.textContent = msg; }
      });
      saveEssays();
      renderSyncStatus();
      toast("Pushed to Notion.");
    } catch (err) {
      detail.textContent = err.message;
      if (/conflict/i.test(err.message)) {
        // Offer a force-push override.
        if (confirm("Notion has been edited since the last push. Force-push and overwrite Notion?")) {
          e.notionSync = e.notionSync || {};
          e.notionSync._forcePush = true;
          $("#syncPushBtn").click();
        }
      } else {
        toast("Push failed: " + err.message);
      }
    }
  });

  $("#syncPullBtn")?.addEventListener("click", async () => {
    const e = state.current;
    if (!e || !e.notionPageId) return;
    if (!confirm("Pull from Notion? Any unsaved local changes will be overwritten.")) return;
    const s = state.settings;
    const detail = $("#syncDetail");
    detail.textContent = "Pulling…";
    try {
      const fresh = await NotionSync.pull({
        token: s.notion.token,
        pageId: e.notionPageId,
        onProgress: (msg) => { detail.textContent = msg; }
      });
      // Replace the in-memory essay with the pulled one, preserving id.
      Object.assign(e, fresh, { id: e.id });
      saveEssays();
      renderWorkspace();
      renderSyncStatus();
      toast("Pulled from Notion.");
    } catch (err) {
      detail.textContent = err.message;
      toast("Pull failed: " + err.message);
    }
  });

  $("#syncOpenBtn")?.addEventListener("click", () => {
    const url = state.current?.notionSync?.url;
    if (url) window.open(url, "_blank", "noopener");
  });

  $$("#stepnav .step-link").forEach(btn => btn.addEventListener("click", () => {
    persistCurrentStep();
    state.currentStep = parseInt(btn.dataset.step, 10);
    if (state.current) { state.current.step = state.currentStep; saveEssays(); }
    renderWorkspace();
  }));

  $("#sendCoachBtn")?.addEventListener("click", sendCoachMessage);
  $("#coachPreset")?.addEventListener("change", ev => {
    const v = ev.target.value; if (!v) return;
    const map = {
      critique:  "Critique my current step against the curriculum's principles. Be specific.",
      examples:  "Show me 3 strong examples relevant to my current step.",
      brainstorm:"Help me brainstorm ideas for my current step.",
      refine:    "Refine my thesis using the Topic+Position+Rationale formula and 'So what?' test.",
      peel:      "Check this paragraph against the PEEL structure. Flag what is missing.",
      radar:     "Evaluate the following source using RADAR (Relevance, Authority, Date, Appearance, Reason).",
      counter:   "Draft a They Say / I Say counterargument paragraph for my essay."
    };
    $("#coachInput").value = map[v] || "";
    ev.target.value = "";
  });

  $("#set-provider").addEventListener("change", () => { populateModels(); toggleProviderRows(); });
  $("#saveSettingsBtn").addEventListener("click", () => {
    state.settings.provider = $("#set-provider").value;
    // For custom provider, $("#set-model") shows the user-typed model from
    // #custom-model; for built-ins, it's the dropdown value.
    if (state.settings.provider !== "custom") {
      state.settings.model[state.settings.provider] = $("#set-model").value;
    }
    state.settings.keys.anthropic = $("#key-anthropic").value.trim();
    state.settings.keys.openai    = $("#key-openai").value.trim();
    state.settings.keys.gemini    = $("#key-gemini").value.trim();
    state.settings.keys.deepseek  = ($("#key-deepseek")?.value || "").trim();
    state.settings.keys.kimi      = ($("#key-kimi")?.value     || "").trim();
    state.settings.keys.custom    = ($("#key-custom")?.value   || "").trim();
    state.settings.kimiBaseUrl    = ($("#kimi-base-url")?.value || "").trim().replace(/\/+$/, "");
    state.settings.custom         = state.settings.custom || { baseUrl: "", model: "" };
    state.settings.custom.baseUrl = ($("#custom-base-url")?.value || "").trim().replace(/\/+$/, "");
    state.settings.custom.model   = ($("#custom-model")?.value   || "").trim();
    saveSettings(); toast("Settings saved.");
  });

  // PHASE 3 — Integrity detection settings
  $("#set-detect-provider")?.addEventListener("change", () => {
    const p = $("#set-detect-provider").value;
    const def = (window.Detection?.PROVIDERS || {})[p];
    $("#detectProviderHint").textContent = def
      ? `${def.label} — ${def.keyLabel}. Docs: ${def.docsUrl}`
      : "Pick a provider above to see the key format and docs link.";
  });
  $("#saveDetectionBtn")?.addEventListener("click", () => {
    state.settings.detection = state.settings.detection || {};
    state.settings.detection.provider = $("#set-detect-provider").value;
    state.settings.detection.key      = $("#set-detect-key").value.trim();
    saveSettings();
    const st = $("#detectionStatus");
    st.className = "status-line ok";
    st.textContent = "Detection settings saved.";
    toast("Detection settings saved.");
  });

  // PHASE 4 cost-saving panel
  $("#saveCostSettingsBtn")?.addEventListener("click", () => {
    state.settings.routing       = $("#set-routing").checked;
    state.settings.promptCaching = $("#set-caching").checked;
    state.settings.trimHistory   = $("#set-trim").checked;
    const provider = $("#set-provider").value;
    const premium  = $("#set-premium-model").value;
    state.settings.premiumModel = state.settings.premiumModel || {};
    state.settings.premiumModel[provider] = premium;
    saveSettings();
    const st = $("#costSettingsStatus");
    st.className = "status-line ok";
    st.textContent = "Cost settings saved.";
    toast("Cost settings saved.");
  });
  $("#testAiBtn").addEventListener("click", async () => {
    const status = $("#aiTestStatus"); status.className = "status-line"; status.textContent = "Testing…";
    const provider = $("#set-provider").value;
    const model = $("#set-model").value;
    const apiKey = $("#key-" + provider).value.trim();
    try {
      const out = await AI.test({ provider, model, apiKey });
      status.className = "status-line ok";
      status.textContent = `OK — provider replied: "${out.slice(0, 80)}"`;
    } catch (e) {
      status.className = "status-line err"; status.textContent = "Failed: " + e.message;
    }
  });
  $("#saveNotionBtn").addEventListener("click", () => {
    state.settings.notion.token    = $("#notion-token").value.trim();
    state.settings.notion.parent   = $("#notion-parent").value.trim();
    state.settings.notion.proxyUrl = ($("#notion-proxy")?.value || "").trim().replace(/\/+$/, "");
    saveSettings(); toast("Notion settings saved.");
  });
  $("#testNotionBtn").addEventListener("click", async () => {
    const status = $("#notionTestStatus"); status.className = "status-line"; status.textContent = "Testing…";
    try {
      const me = await Notion.test($("#notion-token").value.trim());
      status.className = "status-line ok";
      status.textContent = "OK — connected as " + (me.name || (me.bot && me.bot.owner && me.bot.owner.user && me.bot.owner.user.name) || "integration");
    } catch (e) {
      status.className = "status-line err"; status.textContent = "Failed: " + e.message;
    }
  });

  // Bootstrap the academic workspace under the configured parent page.
  $("#bootstrapNotionBtn")?.addEventListener("click", async () => {
    const token = $("#notion-token").value.trim();
    const rawParent = $("#notion-parent").value.trim();
    const logEl = $("#bootstrapLog");
    const inline = $("#bootstrapStatusInline");
    if (!token)     { inline.textContent = "Add a token + click Save first."; return; }
    if (!rawParent) { inline.textContent = "Add a parent page URL or ID + click Save first."; return; }
    const parent = Notion.parsePageId(rawParent);
    if (!parent)    { inline.textContent = "Couldn't find a 32-char page ID in that input. Paste the full Notion URL or the ID."; return; }

    logEl.innerHTML = "";
    inline.textContent = "Building…";
    const onProgress = ({ msg, ok }) => {
      const line = document.createElement("div");
      line.className = "bootstrap-line " + (ok ? "ok" : "err");
      line.textContent = msg;
      logEl.appendChild(line);
      logEl.scrollTop = logEl.scrollHeight;
    };
    try {
      const r = await Notion.bootstrapWorkspace(token, parent, onProgress);
      state.settings.notion.workspace = {
        builtAt: Date.now(),
        databases: r.databases,
        pages: r.pages
      };
      saveSettings();
      const errs = r.errors.length;
      inline.textContent = errs
        ? `Done with ${errs} step${errs===1?"":"s"} failed — see log.`
        : "Done — workspace is ready in Notion.";
    } catch (err) {
      inline.textContent = "Bootstrap failed: " + err.message;
    }
  });

  // Re-open the setup wizard from Settings (does NOT reset stored credentials).
  $("#reopenSetupWizardBtn")?.addEventListener("click", () => {
    state.settings.setupComplete = false; // so the wizard can be re-finalised
    saveSettings();
    showSetupWizard();
  });

  // Full backup: essays + settings + integrity metadata. Restorable on any
  // device, with or without Supabase login.
  $("#exportDataBtn").addEventListener("click", () => {
    // Scrub anything we never want in a portable file (currently nothing,
    // but keep this hook so we can mask things like API keys if asked).
    const exportSettings = JSON.parse(JSON.stringify(state.settings || {}));
    const blob = JSON.stringify({
      app:        "easy-essay",
      version:    2,
      exportedAt: new Date().toISOString(),
      settings:   exportSettings,
      essays:     state.essays || []
    }, null, 2);
    const name = "easy-essay-backup-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json";
    downloadFile(blob, name, "application/json");
    toast(`Backup saved (${(state.essays||[]).length} essay${(state.essays||[]).length===1?"":"s"} + settings).`);
  });

  $("#importDataBtn").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", async ev => {
    const files = Array.from(ev.target.files || []);
    if (!files.length) return;

    /* Track which essays this import created so we can offer to push them
     * to Notion afterwards (Task 1). */
    const newlyImportedIds = [];
    let backupRestored = false;

    try {
      for (const f of files) {
        const ext = (f.name.split(".").pop() || "").toLowerCase();
        const result = await handleImportFile(f, ext);
        if (!result) continue;

        if (result.kind === "backup") {
          // Backup files take over the whole essays array — handled inline.
          backupRestored = true;
          if (result.essayIds) newlyImportedIds.push(...result.essayIds);
        } else if (result.kind === "essay") {
          state.essays = state.essays || [];
          state.essays.push(result.essay);
          newlyImportedIds.push(result.essay.id);
        }
      }

      saveEssays();
      saveSettings();
      renderLibrary();
      renderHome();

      if (backupRestored) {
        // Backup path already toasts inside handleImportFile.
      } else if (newlyImportedIds.length === 1) {
        toast(`Imported 1 essay as a new draft.`);
      } else if (newlyImportedIds.length > 1) {
        toast(`Imported ${newlyImportedIds.length} essays as new drafts.`);
      }

      // Task 1 — Offer to push freshly imported essays into Notion if it's
      // connected. We never auto-push without asking (some students will
      // want to clean the text up first).
      await maybeOfferNotionPushAfterImport(newlyImportedIds);

    } catch (e) {
      console.error("Import failed:", e);
      toast("Import failed: " + (e.message || e));
    } finally {
      // Clear the file input so re-selecting the same file re-fires change.
      ev.target.value = "";
    }
  });

  /* ── per-file import dispatcher ────────────────────────────────────── */
  async function handleImportFile(file, ext) {
    if (ext === "json" || file.type === "application/json") {
      return await importBackupJson(file);
    }
    if (ext === "txt" || ext === "md" || ext === "markdown" ||
        file.type === "text/plain" || file.type === "text/markdown") {
      const text = await file.text();
      return { kind: "essay", essay: makeEssayFromText(file.name, text, ext === "md" || ext === "markdown" ? "markdown" : "text") };
    }
    if (ext === "docx" || file.name.toLowerCase().endsWith(".docx")) {
      const text = await extractDocxText(file);
      return { kind: "essay", essay: makeEssayFromText(file.name, text, "docx") };
    }
    toast(`Unsupported file: ${file.name}. Use .json, .txt, .md, or .docx.`);
    return null;
  }

  /* ── backup JSON path (v1 + v2) — preserved from previous version ──── */
  async function importBackupJson(file) {
    const data = JSON.parse(await file.text());

    // v2 backup (new format) — full settings + essays, preserves IDs
    if (data && data.app === "easy-essay" && Array.isArray(data.essays)) {
      const replace = confirm(
        `Backup contains ${data.essays.length} essay${data.essays.length===1?"":"s"}` +
        (data.settings ? " + settings" : "") + ".\n\n" +
        "Click OK to REPLACE everything currently in this browser with the backup.\n" +
        "Click Cancel to MERGE (keep your current essays, add the backup's as new copies)."
      );
      let ids;
      if (replace) {
        state.essays = data.essays;
        if (data.settings && typeof data.settings === "object") {
          state.settings = { ...state.settings, ...data.settings };
        }
        ids = data.essays.map(e => e.id).filter(Boolean);
      } else {
        const cloned = data.essays.map(e => ({ ...e, id: uid() }));
        state.essays = (state.essays || []).concat(cloned);
        ids = cloned.map(e => e.id);
      }
      toast(`Imported ${data.essays.length} essay${data.essays.length===1?"":"s"}${data.settings?" + settings":""}.`);
      return { kind: "backup", essayIds: ids };
    }

    // v1 backup (legacy) — essays only
    if (data && Array.isArray(data.essays)) {
      const cloned = data.essays.map(e => ({ ...e, id: uid() }));
      state.essays = (state.essays || []).concat(cloned);
      toast("Imported " + data.essays.length + " essays (legacy format).");
      return { kind: "backup", essayIds: cloned.map(e => e.id) };
    }

    toast("JSON file isn't a recognisable easy-essay backup.");
    return null;
  }

  /* ── plain-text + markdown → essay shell ────────────────────────────── */
  function makeEssayFromText(fileName, content, sourceFormat) {
    const baseTitle = fileName.replace(/\.[^.]+$/, "").trim() || "Imported essay";
    const now = Date.now();
    const wordCount = (content || "").trim().split(/\s+/).filter(Boolean).length;
    return {
      id: uid(),
      createdAt: now,
      updatedAt: now,
      step: 8, // Drafting — they've got prose, start from there
      setup: {
        title: baseTitle,
        course: "",
        degreeLevel: "undergraduate",
        wordCount: Math.max(500, Math.round(wordCount / 100) * 100),
        deadline: "",
        citationStyle: "APA 7th",
        discipline: "",
        brief: `Imported from ${sourceFormat.toUpperCase()} file "${fileName}". Add the original brief here if you have it; the rest of the workflow still works without it.`,
        initialIdea: ""
      },
      brief:   { commandWords:"", audience:"", scope:"", constraints:"", successCriteria:"" },
      rubric:  { templateId: "", criteria: [] },
      questions: { generated: [], selectedIndex: -1, custom: "" },
      essayType: { recommended: "", chosen: "", why: "" },
      sources: [],
      thesis:  { topic:"", position:"", rationale:"", combined:"", supportingClaims:"", counterargument:"", motive:"" },
      outline: { text:"", allocation: {}, sectionsByKey: {} },
      paragraphs: [],
      draft: content,
      notes: `Imported on ${new Date().toLocaleDateString()} from ${fileName}.`,
      checklist: {},
      coach: [],
      integrity: [{ ts: now, action: "EXPORT_LOCAL", detail: `Imported from ${sourceFormat} file: ${fileName}` }],
      aiCost: { total: 0, byTask: {}, byModel: {}, calls: 0 },
      aiLedger: []
    };
  }

  /* ── .docx → text via lazy-loaded mammoth.js ───────────────────────── */
  async function extractDocxText(file) {
    // Lazy-load mammoth from CDN. Only happens when a .docx is imported —
    // students who never touch Word files don't pay the bandwidth.
    if (!window.mammoth) {
      toast("Loading Word-document reader… (first time only)");
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js";
        s.onload = resolve;
        s.onerror = () => reject(new Error("Couldn't load Word reader. Try converting the .docx to .txt or .md and re-import."));
        document.head.appendChild(s);
      });
    }
    const buf = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer: buf });
    if (!result || !result.value) {
      throw new Error("Couldn't extract any text from this .docx — it may be empty, password-protected, or scanned images.");
    }
    return result.value;
  }

  /* ── Task 1: prompt to push imported essays to Notion ──────────────── */
  async function maybeOfferNotionPushAfterImport(essayIds) {
    if (!essayIds || essayIds.length === 0) return;
    if (typeof NotionSync === "undefined" || !NotionSync.isConfigured) return;
    if (!NotionSync.isConfigured()) return;  // Notion not set up — silently skip

    const yes = confirm(
      `Push ${essayIds.length} imported essay${essayIds.length===1?"":"s"} to your Notion workspace now?\n\n` +
      `OK = push each one as a new Notion page now.\n` +
      `Cancel = leave them local for now (you can push individually later from any essay's side rail).`
    );
    if (!yes) return;

    let ok = 0, fail = 0;
    toast(`Pushing ${essayIds.length} essay${essayIds.length===1?"":"s"} to Notion…`);
    for (const id of essayIds) {
      const essay = (state.essays || []).find(e => e.id === id);
      if (!essay) continue;
      try {
        const meta = await NotionSync.pushEasy(essay);
        // Persist the Notion page ID/URL onto the essay so future syncs know.
        if (meta) {
          essay.notion = essay.notion || {};
          essay.notion.pageId   = meta.pageId   || essay.notion.pageId;
          essay.notion.pageUrl  = meta.pageUrl  || essay.notion.pageUrl;
          essay.notion.lastPush = Date.now();
        }
        ok++;
      } catch (err) {
        console.warn("Notion push failed for", essay.setup?.title || id, err);
        fail++;
      }
    }
    saveEssays();
    renderLibrary();
    if (fail === 0) {
      toast(`✓ Pushed ${ok} essay${ok===1?"":"s"} to Notion.`);
    } else {
      toast(`Pushed ${ok}, failed ${fail}. See console for details.`);
    }
  }
  $("#wipeBtn").addEventListener("click", () => {
    if (!confirm("Wipe all essays, keys, and Notion settings? This cannot be undone.")) return;
    localStorage.removeItem(STORAGE.essays);
    localStorage.removeItem(STORAGE.settings);
    localStorage.removeItem(STORAGE.active);
    state.essays = []; state.current = null;
    state.settings = {
      provider:"anthropic",
      model:{anthropic:"claude-sonnet-4-5",openai:"gpt-4o-mini",gemini:"gemini-2.0-flash"},
      keys:{anthropic:"",openai:"",gemini:""},
      notion:{token:"",parent:""}
    };
    toast("Wiped."); switchView("home");
  });

  document.addEventListener("input", ev => {
    if (ev.target && ev.target.id === "ws-essay-title" && state.current) {
      state.current.setup.title = ev.target.value;
      state.current.updatedAt = Date.now();
      saveEssays();
    }
  });
}

/* ============== AUTH + CLOUD SYNC (Supabase) ==============
 *
 * Anonymous users still get the full app via localStorage. Signed-in users
 * also push to essay_app.* tables in Supabase, so their work follows them
 * across devices, browsers, and time. localStorage stays as a write-through
 * cache so the app remains snappy and works offline.
 *
 * Sync is debounced: every save schedules a 1.5s push. Multiple saves in
 * quick succession only trigger one server call.
 */

let _pushSettingsTimer = null;
let _pushEssayTimers = {}; // per-essay debounce

function _debouncePushSettings() {
  if (!window.Sb || !window.Sb.isSignedIn()) return;
  clearTimeout(_pushSettingsTimer);
  _pushSettingsTimer = setTimeout(() => window.Sb.pushSettings(state.settings), 1500);
}
function _debouncePushEssay(essay) {
  if (!window.Sb || !window.Sb.isSignedIn() || !essay || !essay.id) return;
  clearTimeout(_pushEssayTimers[essay.id]);
  _pushEssayTimers[essay.id] = setTimeout(() => window.Sb.pushEssay(essay), 1500);
}

// Patch saveSettings / saveEssays to also push to the server.
const _origSaveSettings = saveSettings;
saveSettings = function() {
  _origSaveSettings.apply(this, arguments);
  _debouncePushSettings();
};
const _origSaveEssays = saveEssays;
saveEssays = function() {
  _origSaveEssays.apply(this, arguments);
  if (state.current) _debouncePushEssay(state.current);
};

function updateAuthUI() {
  const signInBtn = $("#signInBtn");
  const userBtn   = $("#userMenuBtn");
  if (!signInBtn || !userBtn) return;
  const user = window.Sb?.currentUser();
  if (user) {
    const name = user.user_metadata?.name || user.email?.split("@")[0] || "Account";
    signInBtn.hidden = true;
    userBtn.hidden = false;
    userBtn.textContent = "👤 " + name;
    userBtn.title = `Signed in as ${user.email || "user"}\nClick to sign out`;
  } else {
    signInBtn.hidden = false;
    userBtn.hidden = true;
  }
}

function openAuthModal() {
  // Refresh the iframe-warning banner each open
  const banner = $("#authIframeBanner");
  if (banner) banner.hidden = !window.Sb?.inIframe();
  setText($("#authResult"), "");
  openModalEl("authModal");
  setTimeout(() => $("#authEmailInput")?.focus(), 60);
}
function closeAuthModal() { closeModalEl("authModal"); }

async function _handleMagicLink() {
  const r = $("#authResult");
  const email = ($("#authEmailInput")?.value || "").trim();
  r.className = "status-line";
  r.textContent = "Sending…";
  try {
    await window.Sb.signInWithMagicLink(email);
    r.className = "status-line ok";
    r.textContent = "✓ Magic link sent. Check your email (and spam folder). Clicking the link signs you in here.";
  } catch (err) {
    r.className = "status-line err";
    r.textContent = "Failed: " + err.message;
  }
}
async function _handleGoogleSignIn() {
  const r = $("#authResult");
  r.className = "status-line"; r.textContent = "Opening Google…";
  try {
    const res = await window.Sb.signInWithGoogle();
    if (res?.newTab) {
      r.className = "status-line";
      r.textContent = "Google sign-in opened in a new tab. Come back here once you're signed in.";
    }
  } catch (err) {
    r.className = "status-line err";
    r.textContent = "Failed: " + err.message;
  }
}

async function _handleSignOut() {
  if (!confirm("Sign out? Your local browser copy stays, but auto-sync stops until you sign in again.")) return;
  await window.Sb.signOut();
  toast("Signed out.");
  updateAuthUI();
}

/* On first successful sign-in, migrate any local-only essays/settings to
 * the new account so the user doesn't lose anything they wrote before
 * signing up. */
async function _handleFirstSignIn(user) {
  // Pull what's on the server first
  const remote = await window.Sb.pullAll();
  const haveLocalEssays = (state.essays || []).length > 0;
  const haveRemoteEssays = (remote.essays || []).length > 0;

  if (!haveRemoteEssays && haveLocalEssays) {
    // Brand-new account with existing local data → upload it
    const { migratedEssays, settingsUploaded } = await window.Sb.migrateLocal(state.settings, state.essays);
    toast(`Welcome — saved ${migratedEssays} essay${migratedEssays===1?"":"s"} to your account.`);
    return;
  }

  if (haveRemoteEssays) {
    // Server has data — pull it down and merge
    // For simplicity (and safety), server is authoritative.
    if (remote.settings) {
      state.settings = { ...state.settings, ...remote.settings };
      _origSaveSettings();
    }
    // Merge essays: server wins on conflicts; keep local-only ones too
    const localById = new Map((state.essays || []).map(e => [e.id, e]));
    for (const re of remote.essays) localById.set(re.id, re);
    state.essays = Array.from(localById.values());
    saveEssaysLocal();
    toast(`Welcome back — restored ${remote.essays.length} essay${remote.essays.length===1?"":"s"} from your account.`);
    // After pulling, upload any local-only essays the server doesn't have
    const remoteIds = new Set(remote.essays.map(e => e.id));
    const localOnly = (state.essays || []).filter(e => !remoteIds.has(e.id));
    if (localOnly.length) await window.Sb.pushEssaysBatch(localOnly);
  } else {
    // No data either side — fresh account, nothing to do
    toast("Signed in.");
  }
  renderLibrary();
  renderHome();
}

// Save-essays without triggering the sync push (used when restoring from
// server to avoid an immediate echo back).
function saveEssaysLocal() {
  localStorage.setItem(STORAGE.essays, JSON.stringify(state.essays));
}

function wireAuth() {
  if (!window.Sb) return;
  window.Sb.init();

  window.addEventListener("supabase:ready", () => updateAuthUI());
  window.addEventListener("supabase:auth-change", async (ev) => {
    const user = ev.detail?.user;
    updateAuthUI();
    if (user && ev.detail?.event === "SIGNED_IN") {
      closeAuthModal();
      await _handleFirstSignIn(user);
    } else if (ev.detail?.event === "SIGNED_OUT") {
      // Clear in-memory state? Keep local — user might sign back in.
    }
  });

  $("#signInBtn")?.addEventListener("click", openAuthModal);
  $("#authCloseX")?.addEventListener("click", closeAuthModal);
  $("#authMagicBtn")?.addEventListener("click", _handleMagicLink);
  $("#authGoogleBtn")?.addEventListener("click", _handleGoogleSignIn);
  $("#userMenuBtn")?.addEventListener("click", _handleSignOut);

  // Pressing Enter in the email field submits the magic link
  $("#authEmailInput")?.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") { ev.preventDefault(); _handleMagicLink(); }
  });
}

/* ============== INIT ============== */
window.addEventListener("DOMContentLoaded", () => {
  loadAll();
  bindGlobal();
  wireAuth();           // Supabase init + auth UI (works whether or not user is signed in)
  wireSetupWizard();    // attach wizard handlers once (markup is in index.html)
  renderHome();
  maybeShowSetupWizard(); // auto-show on first visit only
});
