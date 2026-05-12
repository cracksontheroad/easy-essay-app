/* ========================================================================
 * AI PROVIDERS — Anthropic, OpenAI, Gemini
 * Browser-side calls. Keys stored in localStorage only.
 *
 * Phase 4 additions:
 *  • Per-model pricing table (USD per 1M tokens, in/out/cache).
 *  • Usage extraction from every provider's response.
 *  • `cost` returned with every call (sums input + output + cache).
 *  • Task-based model routing (PHASE 4.2): caller passes { task }, the
 *    routing map picks the cheapest model that should handle that task.
 *  • Anthropic prompt caching (PHASE 4.3): system prompt is marked
 *    cache_control=ephemeral, so repeated calls within 5 min cost 1/10th.
 *  • Conversation-history trim helper (PHASE 4.4): trimHistory().
 * ====================================================================== */

const AI_MODELS = {
  anthropic: [
    { id: "claude-opus-4-5",          label: "Claude Opus 4.5 (most capable)" },
    { id: "claude-sonnet-4-5",        label: "Claude Sonnet 4.5 (balanced)" },
    { id: "claude-haiku-4-5",         label: "Claude Haiku 4.5 (fast & cheap)" },
    { id: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet (legacy)" }
  ],
  openai: [
    { id: "gpt-4o",      label: "GPT-4o" },
    { id: "gpt-4o-mini", label: "GPT-4o mini (fast & cheap)" },
    { id: "gpt-4-turbo", label: "GPT-4 Turbo" }
  ],
  gemini: [
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (free tier)" },
    { id: "gemini-1.5-pro",   label: "Gemini 1.5 Pro" },
    { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (fast)" }
  ]
};

/* USD per 1M tokens. Approximate public prices as of mid-2025.
 * Update here if providers change rates. */
const AI_PRICING = {
  "claude-opus-4-5":          { in: 15.00, out: 75.00, cacheWrite: 18.75, cacheRead: 1.50 },
  "claude-sonnet-4-5":        { in:  3.00, out: 15.00, cacheWrite:  3.75, cacheRead: 0.30 },
  "claude-haiku-4-5":         { in:  1.00, out:  5.00, cacheWrite:  1.25, cacheRead: 0.10 },
  "claude-3-5-sonnet-latest": { in:  3.00, out: 15.00, cacheWrite:  3.75, cacheRead: 0.30 },
  "gpt-4o":                   { in:  2.50, out: 10.00 },
  "gpt-4o-mini":              { in:  0.15, out:  0.60 },
  "gpt-4-turbo":              { in: 10.00, out: 30.00 },
  "gemini-2.0-flash":         { in:  0.075, out: 0.30, freeTier: true },
  "gemini-1.5-flash":         { in:  0.075, out: 0.30 },
  "gemini-1.5-pro":           { in:  1.25, out:  5.00 }
};

/* PHASE 4.2 — Task-based routing.
 * Caller passes { task: "RQ_GENERATE" } and we resolve to a model.
 * "ROUTINE" tasks default to the cheapest competent model.
 * "PREMIUM" tasks (thesis stress-test, fallacy scan, counter-arg) escalate
 * to a stronger model — only if the user has a key for it. */
const TASK_ROUTING = {
  // ROUTINE — small / structural
  BRIEF_PARSE:      "ROUTINE",
  RUBRIC_GENERATE:  "ROUTINE",
  RQ_GENERATE:      "ROUTINE",
  TYPE_RECOMMEND:   "ROUTINE",
  RADAR_HINT:       "ROUTINE",
  MECHANICS:        "ROUTINE",
  HEDGING:          "ROUTINE",
  PEEL_DRAFT:       "ROUTINE",
  OUTLINE_GENERATE: "ROUTINE",
  COACH_CHAT:       "ROUTINE",

  // PREMIUM — judgement / critique
  THESIS_CRITIQUE:  "PREMIUM",
  FALLACY_SCAN:     "PREMIUM",
  COUNTER_GEN:      "PREMIUM",
  ARGUMENT_AUDIT:   "PREMIUM"
};

// Per provider, which model to use for each tier.
const TIER_MODEL = {
  anthropic: { ROUTINE: "claude-haiku-4-5", PREMIUM: "claude-sonnet-4-5" },
  openai:    { ROUTINE: "gpt-4o-mini",      PREMIUM: "gpt-4o" },
  gemini:    { ROUTINE: "gemini-2.0-flash", PREMIUM: "gemini-1.5-pro" }
};

/* PHASE 4.4 — Conversation-history trim.
 * Keeps the most recent `keep` messages verbatim; summarises older ones in
 * a single synthetic message. Naive but predictable. */
function trimHistory(messages, keep = 6) {
  if (!Array.isArray(messages) || messages.length <= keep) return messages || [];
  const older = messages.slice(0, -keep);
  const recent = messages.slice(-keep);
  const summary = older.map(m => `${m.role}: ${(m.content||"").slice(0, 100)}`).join(" | ");
  return [
    { role: "user", content: `[Earlier-conversation summary]: ${summary}` },
    ...recent
  ];
}

/* Cost calculator — usage is { input_tokens, output_tokens, cache_read, cache_write } */
function calculateCost(model, usage) {
  const price = AI_PRICING[model];
  if (!price || !usage) return 0;
  const inTok    = usage.input_tokens  || 0;
  const outTok   = usage.output_tokens || 0;
  const cacheR   = usage.cache_read    || 0;
  const cacheW   = usage.cache_write   || 0;
  // Cache reads replace input cost; cache writes are slightly more than input.
  const inCost    = ((inTok - cacheR) / 1e6) * (price.in || 0);
  const outCost   = (outTok / 1e6) * (price.out || 0);
  const cacheRC   = (cacheR / 1e6) * (price.cacheRead  || 0);
  const cacheWC   = (cacheW / 1e6) * (price.cacheWrite || 0);
  return Math.max(0, inCost + outCost + cacheRC + cacheWC);
}

const AI = {

  /* Resolve a model from { provider, task, override }.
   * override wins; otherwise routing map picks the tier model. */
  resolveModel({ provider, task, override }) {
    if (override) return override;
    if (!task) return null;
    const tier = TASK_ROUTING[task] || "ROUTINE";
    return TIER_MODEL[provider]?.[tier] || null;
  },

  /* Main entry point.
   * Returns { text, usage, cost, model, raw }. */
  async chat({ provider, model, task, apiKey, system, messages, cacheable = true }) {
    if (!apiKey) throw new Error(`No API key set for ${provider}. Add one in Settings.`);

    // Resolve model: explicit > task-based > error
    const resolvedModel = model || AI.resolveModel({ provider, task });
    if (!resolvedModel) throw new Error(`No model and no task routing for ${provider}.`);

    let result;
    if (provider === "anthropic") result = await AI._anthropic({ model: resolvedModel, apiKey, system, messages, cacheable });
    else if (provider === "openai") result = await AI._openai({ model: resolvedModel, apiKey, system, messages });
    else if (provider === "gemini") result = await AI._gemini({ model: resolvedModel, apiKey, system, messages });
    else throw new Error(`Unknown provider: ${provider}`);

    result.model = resolvedModel;
    result.cost = calculateCost(resolvedModel, result.usage);
    return result;
  },

  /* ---------- Anthropic Messages API + prompt caching ---------- */
  async _anthropic({ model, apiKey, system, messages, cacheable }) {
    // PHASE 4.3 — Mark the system prompt as cache_control=ephemeral.
    // Anthropic charges cacheWrite on first call (slightly > input) and
    // cacheRead (1/10th of input) on subsequent calls within 5 min TTL.
    const systemBlocks = system
      ? [{ type: "text", text: system, ...(cacheable ? { cache_control: { type: "ephemeral" } } : {}) }]
      : undefined;

    const body = {
      model,
      max_tokens: 1500,
      ...(systemBlocks ? { system: systemBlocks } : {}),
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Anthropic ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data = await res.json();
    const text = (data.content || [])
      .filter(p => p.type === "text")
      .map(p => p.text)
      .join("\n")
      .trim();
    const u = data.usage || {};
    return {
      text,
      raw: data,
      usage: {
        input_tokens:  u.input_tokens  || 0,
        output_tokens: u.output_tokens || 0,
        cache_read:    u.cache_read_input_tokens     || 0,
        cache_write:   u.cache_creation_input_tokens || 0
      }
    };
  },

  /* ---------- OpenAI Chat Completions ---------- */
  async _openai({ model, apiKey, system, messages }) {
    const allMessages = [];
    if (system) allMessages.push({ role: "system", content: system });
    for (const m of messages) allMessages.push({ role: m.role, content: m.content });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: allMessages,
        max_tokens: 1500,
        temperature: 0.6
      })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`OpenAI ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";
    const u = data.usage || {};
    return {
      text,
      raw: data,
      usage: {
        input_tokens:  u.prompt_tokens     || 0,
        output_tokens: u.completion_tokens || 0
      }
    };
  },

  /* ---------- Google Gemini ---------- */
  async _gemini({ model, apiKey, system, messages }) {
    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    const body = {
      contents,
      generationConfig: { temperature: 0.6, maxOutputTokens: 1500 }
    };
    if (system) {
      body.systemInstruction = { role: "user", parts: [{ text: system }] };
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Gemini ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data = await res.json();
    const text = (data.candidates?.[0]?.content?.parts || [])
      .map(p => p.text)
      .filter(Boolean)
      .join("\n")
      .trim();
    const u = data.usageMetadata || {};
    return {
      text,
      raw: data,
      usage: {
        input_tokens:  u.promptTokenCount     || 0,
        output_tokens: u.candidatesTokenCount || 0
      }
    };
  },

  /* ---------- Quick connectivity check ---------- */
  async test({ provider, model, apiKey }) {
    const r = await AI.chat({
      provider, model, apiKey,
      task: "BRIEF_PARSE",  // routes to cheapest
      system: "You are a connection test responder.",
      messages: [{ role: "user", content: "Reply with exactly: OK" }]
    });
    return r.text;
  }
};

window.AI = AI;
window.AI_MODELS = AI_MODELS;
window.AI_PRICING = AI_PRICING;
window.TASK_ROUTING = TASK_ROUTING;
window.TIER_MODEL = TIER_MODEL;
window.trimHistory = trimHistory;
window.calculateCost = calculateCost;
